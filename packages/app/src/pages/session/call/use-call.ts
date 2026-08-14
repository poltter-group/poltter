import { Binary } from "@poltter-ai/core/util/binary"
import type { Message, Session, TextPart } from "@poltter-ai/sdk/v2/client"
import { batch, createEffect, onCleanup, type Accessor } from "solid-js"
import { createStore } from "solid-js/store"
import { sendFollowupDraft } from "@/components/prompt-input/submit"
import { useLanguage } from "@/context/language"
import { type ModelSelection, useLocal } from "@/context/local"
import type { Prompt } from "@/context/prompt"
import { useServerSync } from "@/context/server-sync"
import { useSDK } from "@/context/sdk"
import { useSync } from "@/context/sync"
import { Identifier } from "@/utils/id"
import { Persist, persisted } from "@/utils/persist"
import { cancelSpeech, createTranscriptRecognition, isVoiceSupported, speak } from "./speech"

export type CallPhase = "idle" | "listening" | "working" | "speaking" | "paused" | "ended"

export type CallTranscriptEntry = {
  role: "user" | "assistant"
  text: string
  time: number
}

type CallStore = {
  phase: CallPhase
  transcript: CallTranscriptEntry[]
  liveTranscript: string
  liveText: string
  error: string | undefined
  supported: boolean
}

export function createCall(input: { sessionID: Accessor<string | undefined> }) {
  const sdk = useSDK()
  const sync = useSync()
  const serverSync = useServerSync()
  const local = useLocal()
  const language = useLanguage()

  const [store, setStore] = createStore<CallStore>({
    phase: "idle",
    transcript: [],
    liveTranscript: "",
    liveText: "",
    error: undefined,
    supported: isVoiceSupported(),
  })

  const [prefs, setPrefs] = persisted(Persist.global("call"), createStore({ speakReplies: true }))

  let recognition: ReturnType<typeof createTranscriptRecognition> | undefined
  let cancelSpeechRef: VoidFunction | undefined
  let sentMessageID: string | undefined

  const pushTranscript = (role: "user" | "assistant", text: string) => {
    setStore("transcript", (entries) => [...entries, { role, text, time: Date.now() }])
  }

  const messageText = (message: Message) => {
    return (sync().data.part[message.id] ?? [])
      .filter((part): part is TextPart => part.type === "text")
      .map((part) => part.text)
      .join("")
      .trim()
  }

  const lastAssistantTextAfter = (messages: Message[], afterID: string | undefined) => {
    if (!afterID) return ""
    const result = Binary.search(messages, afterID, (message) => message.id)
    if (!result.found) return ""
    let text = ""
    for (let index = result.index + 1; index < messages.length; index += 1) {
      const message = messages[index]
      if (message.role !== "assistant") continue
      const candidate = messageText(message)
      if (candidate) text = candidate
    }
    return text
  }

  createEffect(() => {
    const id = input.sessionID()
    const phase = store.phase
    if (!id || phase === "idle" || phase === "ended") return
    const working = sync().data.session_working(id)
    const messages = sync().data.message[id] ?? []

    if (working) {
      if (sentMessageID) setStore("liveText", lastAssistantTextAfter(messages, sentMessageID))
      return
    }

    const sent = sentMessageID
    if (!sent) return
    sentMessageID = undefined
    setStore("liveText", "")
    const text = lastAssistantTextAfter(messages, sent)
    if (!text) {
      if (store.phase === "working") setStore("phase", "listening")
      return
    }

    pushTranscript("assistant", text)
    if (!prefs.speakReplies) {
      if (store.phase === "working") setStore("phase", "listening")
      return
    }
    setStore("phase", "speaking")
    cancelSpeechRef = speak(text, {
      onEnd: () => {
        if (store.phase !== "speaking") return
        setStore("phase", "listening")
      },
    })
  })

  onCleanup(() => {
    recognition?.abort()
    cancelSpeechRef?.()
    cancelSpeech()
  })

  const resolveModel = (session: Session | undefined, modelSelection: ModelSelection) => {
    const sessionModel = session?.model
    if (sessionModel?.id && sessionModel.providerID) {
      return { providerID: sessionModel.providerID, modelID: sessionModel.id, variant: sessionModel.variant }
    }
    const model = modelSelection.current()
    if (!model) return
    return { providerID: model.provider.id, modelID: model.id, variant: modelSelection.variant.current() ?? undefined }
  }

  const sendPrompt = async (text: string) => {
    const id = input.sessionID()
    if (!id) return
    const session = sync().session.get(id)
    const agent = session?.agent ?? local.agent.current()?.name
    const model = resolveModel(session, local.model)
    if (!agent || !model) {
      setStore({ phase: "paused", error: language.t("call.unavailable") })
      return
    }

    const messageID = Identifier.ascending("message")
    const prompt: Prompt = [{ type: "text", content: text, start: 0, end: text.length }]
    sentMessageID = messageID
    batch(() => {
      pushTranscript("user", text)
      setStore({ phase: "working", liveText: "", liveTranscript: "", error: undefined })
    })

    try {
      await sendFollowupDraft({
        api: sdk().api.session,
        sync: sync(),
        serverSync: serverSync(),
        draft: {
          sessionID: id,
          sessionDirectory: sync().directory,
          prompt,
          context: [],
          agent,
          model,
          variant: model.variant,
        },
        messageID,
        optimisticBusy: true,
      })
    } catch {
      sentMessageID = undefined
      setStore({ phase: "listening", error: language.t("call.sendFailed") })
    }
  }

  const startRecognition = () => {
    if (recognition) {
      recognition.abort()
      recognition = undefined
    }
    let pendingFinal: string | undefined
    const next = createTranscriptRecognition({
      onInterim: (text) => setStore("liveTranscript", text),
      onFinal: (text) => {
        pendingFinal = text
        setStore("liveTranscript", text)
      },
      onError: () => {
        if (recognition !== next) return
        recognition = undefined
        if (store.phase !== "listening") return
        setStore({ phase: "paused", error: language.t("call.unavailable") })
      },
      onEnd: () => {
        if (recognition !== next) return
        recognition = undefined
        if (store.phase !== "listening") return
        const final = pendingFinal
        pendingFinal = undefined
        setStore("liveTranscript", "")
        if (final) void sendPrompt(final)
        else setStore({ phase: "paused", error: undefined })
      },
    })
    if (!next.supported) {
      setStore({ phase: "paused", error: language.t("call.unavailable") })
      return
    }
    setStore({ phase: "listening", liveTranscript: "", error: undefined })
    recognition = next
    next.start()
  }

  const begin = () => {
    cancelSpeechRef?.()
    cancelSpeechRef = undefined
    sentMessageID = undefined
    setStore({ phase: "listening", transcript: [], liveTranscript: "", liveText: "", error: undefined })
    startRecognition()
  }

  const end = () => {
    recognition?.abort()
    recognition = undefined
    cancelSpeechRef?.()
    cancelSpeechRef = undefined
    cancelSpeech()
    sentMessageID = undefined
    setStore({ phase: "ended", liveTranscript: "", liveText: "", error: undefined })
  }

  const toggleTalk = () => {
    const phase = store.phase
    if (phase === "idle" || phase === "ended") {
      begin()
      return
    }
    if (phase === "listening") {
      recognition?.stop()
      return
    }
    cancelSpeechRef?.()
    cancelSpeechRef = undefined
    startRecognition()
  }

  return {
    store,
    speakReplies: () => prefs.speakReplies,
    setSpeakReplies: (value: boolean) => setPrefs("speakReplies", value),
    begin,
    end,
    toggleTalk,
  }
}

export type CallController = ReturnType<typeof createCall>

