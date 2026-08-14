import { getSpeechRecognitionCtor } from "@/utils/runtime-adapters"

type SpeechRecognitionResultEvent = {
  resultIndex: number
  results: SpeechRecognitionResultList
}

type SpeechRecognitionErrorEvent = {
  error: string
}

type SpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export type TranscriptRecognition = {
  readonly supported: boolean
  start(): void
  stop(): void
  abort(): void
}

export function createTranscriptRecognition(input: {
  onInterim: (text: string) => void
  onFinal: (text: string) => void
  onError: (error: string) => void
  onEnd: () => void
}): TranscriptRecognition {
  const Ctor = getSpeechRecognitionCtor<SpeechRecognition>(window)
  if (!Ctor) return { supported: false, start() {}, stop() {}, abort() {} }

  const recognition = new Ctor()
  recognition.lang = navigator.language || "en-US"
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1
  recognition.onresult = (event) => {
    let interim = ""
    let final = ""
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index]
      const text = result[0]?.transcript ?? ""
      if (result.isFinal) final += text
      else interim += text
    }
    const trimmed = final.trim() || interim.trim()
    if (!trimmed) return
    if (final.trim()) input.onFinal(final.trim())
    else input.onInterim(interim.trim())
  }
  recognition.onerror = (event) => input.onError(event.error)
  recognition.onend = () => input.onEnd()

  return {
    supported: true,
    start() {
      recognition.start()
    },
    stop() {
      recognition.stop()
    },
    abort() {
      recognition.abort()
    },
  }
}

export function speak(text: string, options: { rate?: number; onEnd?: () => void } = {}): VoidFunction {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {}
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = options.rate ?? 1
  utterance.onend = () => options.onEnd?.()
  utterance.onerror = () => options.onEnd?.()
  window.speechSynthesis.speak(utterance)
  return () => {
    utterance.onend = null
    utterance.onerror = null
    window.speechSynthesis.cancel()
  }
}

export function cancelSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
}

export const isVoiceSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window && getSpeechRecognitionCtor(window) !== undefined
