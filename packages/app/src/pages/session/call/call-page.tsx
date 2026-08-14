import { createEffect, createMemo, For, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { useLanguage } from "@/context/language"
import { useSync } from "@/context/sync"
import { Icon } from "@poltter-ai/ui/icon"
import { IconButton } from "@poltter-ai/ui/icon-button"
import { Tooltip } from "@poltter-ai/ui/tooltip"
import { agentColor } from "@/utils/agent"
import { useCall } from "./call-context"
import type { CallPhase } from "./use-call"

const statusLabel = (phase: CallPhase, t: ReturnType<typeof useLanguage>["t"]) => {
  if (phase === "listening") return t("call.listening")
  if (phase === "working") return t("call.working")
  if (phase === "speaking") return t("call.speaking")
  if (phase === "paused") return t("call.paused")
  return t("call.title")
}

const statusClass = (phase: CallPhase) => {
  if (phase === "listening") return "bg-icon-success-base"
  if (phase === "working") return "bg-icon-warning-base"
  if (phase === "speaking") return "bg-icon-strong-base"
  return "bg-icon-warning-base"
}

const cardRadius = "999px 999px 28px 28px"

function ParticipantCard(props: {
  icon: "person" | "robot"
  name: string
  isAgent: boolean
  color?: string
  status: string
  speaking: boolean
}) {
  return (
    <div
      class="relative flex flex-col items-center justify-center gap-3 overflow-hidden border border-border-base bg-surface-raised px-4 pb-5 pt-8 transition-all"
      style={{ "border-radius": cardRadius, "aspect-ratio": "4 / 3" }}
    >
      <Show when={props.speaking}>
        <span class="absolute inset-0 ring-2 ring-icon-success-base opacity-60" style={{ "border-radius": cardRadius }} />
      </Show>
      <div
        class="relative size-20 flex items-center justify-center overflow-hidden rounded-full border border-border-base bg-background-base"
        style={props.isAgent ? { "border-color": props.color ?? undefined } : undefined}
      >
        <Icon
          name={props.icon}
          size="large"
          style={props.isAgent && props.color ? { color: props.color } : undefined}
        />
      </div>
      <div class="flex min-w-0 items-center gap-1.5">
        <span class="truncate text-sm font-medium text-text-strong">{props.name}</span>
        <Show when={props.isAgent}>
          <span
            class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider leading-none"
            style={props.color ? { color: props.color } : undefined}
          >
            AI
          </span>
        </Show>
      </div>
      <span class="text-xs text-text-subtle">{props.status}</span>
    </div>
  )
}

export function CallPage(props: { sessionID: string | undefined }) {
  const language = useLanguage()
  const call = useCall()
  const sync = useSync()

  const active = () => call.store.phase !== "idle" && call.store.phase !== "ended"

  const agents = createMemo(() =>
    sync().data.agent.filter((item) => item.mode !== "subagent" && !item.hidden),
  )

  const currentAgent = createMemo(() => {
    const id = props.sessionID
    if (!id) return undefined
    return sync().session.get(id)?.agent
  })

  const userSpeaking = () =>
    call.store.phase === "listening" || call.store.phase === "working"

  const agentSpeaking = () =>
    call.store.phase === "speaking"

  const talkIcon = () => (call.store.phase === "listening" ? "stop" : "mic")
  const talkLabel = () =>
    call.store.phase === "listening" ? language.t("call.releaseToSend") : language.t("call.holdToTalk")

  let transcriptRef: HTMLDivElement | undefined
  createEffect(() => {
    const count = call.store.transcript.length
    if (count === 0 || !transcriptRef) return
    transcriptRef.scrollTop = transcriptRef.scrollHeight
  })

  return (
    <Show when={props.sessionID && active()}>
      <Portal>
        <div class="fixed inset-0 z-[60] flex flex-col bg-background-base">
          <header class="flex items-center justify-between gap-2 border-b border-border-base px-4 py-3 shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-text-strong">{language.t("call.title")}</span>
              <span
                class="flex items-center gap-1.5 text-xs text-text-subtle"
                classList={{ "text-icon-critical-base": !!call.store.error }}
              >
                <span classList={{ "size-1.5 rounded-full": true, [statusClass(call.store.phase)]: true }} />
                {call.store.error ?? statusLabel(call.store.phase, language.t)}
              </span>
            </div>
            <IconButton
              icon="close"
              variant="ghost"
              size="small"
              aria-label={language.t("call.end")}
              onClick={() => call.end()}
            />
          </header>

          <main class="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center gap-6 p-6">
            <div class="w-full grid gap-4 justify-center" style={{ "grid-template-columns": "repeat(auto-fit, minmax(180px, 280px))" }}>
              <ParticipantCard
                icon="person"
                name={language.t("call.me")}
                isAgent={false}
                status={call.store.error ?? statusLabel(call.store.phase, language.t)}
                speaking={userSpeaking()}
              />
              <For each={agents()}>
                {(agent) => (
                  <ParticipantCard
                    icon="robot"
                    name={agent.name}
                    isAgent={true}
                    color={agentColor(agent.name, agent.color)}
                    status={currentAgent() === agent.name ? (call.store.error ?? statusLabel(call.store.phase, language.t)) : "Ready"}
                    speaking={agentSpeaking() && currentAgent() === agent.name}
                  />
                )}
              </For>
            </div>

            <Show when={call.store.transcript.length > 0 || call.store.liveTranscript || call.store.liveText}>
              <div
                ref={transcriptRef}
                class="w-full max-w-2xl max-h-[160px] overflow-y-auto space-y-1.5 rounded-lg border border-border-base bg-surface-raised p-3"
              >
              <For each={call.store.transcript}>
                {(entry) => (
                  <div classList={{ "text-sm": true, "text-text-strong": entry.role === "user", "text-text-subtle": entry.role === "assistant" }}>
                    <span class="mr-1 text-xs uppercase tracking-wide opacity-60">
                      {entry.role === "user" ? language.t("call.me") : language.t("call.polly")}
                    </span>
                    {entry.text}
                  </div>
                )}
              </For>
              <Show when={call.store.liveTranscript}>
                <div class="text-sm italic text-text-weak">{call.store.liveTranscript}</div>
              </Show>
              <Show when={call.store.liveText}>
                <div class="text-sm text-text-weak">{call.store.liveText}</div>
              </Show>
            </div>
          </Show>
        </main>

        <footer class="flex items-center justify-between gap-2 border-t border-border-base px-4 py-3 shrink-0">
          <button
            type="button"
            aria-pressed={call.speakReplies()}
            onClick={() => call.setSpeakReplies(!call.speakReplies())}
            classList={{
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors": true,
              "text-text-strong": call.speakReplies(),
              "text-text-subtle": !call.speakReplies(),
            }}
          >
            <Icon name="volume" size="small" />
            {language.t("call.speakReplies")}
          </button>
          <div class="flex items-center gap-2">
            <Tooltip value={language.t("call.end")} placement="top">
              <IconButton
                icon="close"
                variant="primary"
                size="normal"
                onClick={() => call.end()}
                aria-label={language.t("call.end")}
              />
            </Tooltip>
            <Tooltip value={talkLabel()} placement="top">
              <IconButton
                icon={talkIcon()}
                variant="primary"
                size="normal"
                onClick={() => call.toggleTalk()}
                aria-label={talkLabel()}
              />
            </Tooltip>
          </div>
        </footer>
        </div>
      </Portal>
    </Show>
  )
}
