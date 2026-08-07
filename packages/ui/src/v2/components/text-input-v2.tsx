import { type ComponentProps, type JSX, Show, splitProps } from "solid-js"
import { Icon } from "./icon"
import "./text-input-v2.css"

export interface TextInputV2Props extends Omit<ComponentProps<"input">, "type"> {
  /** Icon or adornment shown before the field value. */
  leadingIcon?: JSX.Element
  /** Show the trailing copy action. */
  showCopyButton?: boolean
  /** Show the trailing clear action. */
  showClearButton?: boolean
  /** Show the trailing reveal/hide action for secret fields. */
  showRevealButton?: boolean
  /** Whether the secret value is currently visible. */
  revealed?: boolean
  /** Accessible label for the copy button. */
  copyLabel?: string
  /** Accessible label for the clear button. */
  clearLabel?: string
  /** Accessible label for the reveal button. */
  revealLabel?: string
  onCopyClick?: (event: MouseEvent) => void
  onClearClick?: (event: MouseEvent) => void
  onRevealClick?: (event: MouseEvent) => void
  /** Apply tabular numerals to the field value. */
  numeric?: boolean
  /** Error styling for the field and value text. */
  invalid?: boolean
  /** `base` is 28px tall; `large` is 32px tall. */
  appearance?: "base" | "large"
  type?: ComponentProps<"input">["type"]
}

export function TextInputV2(props: TextInputV2Props) {
  const [local, inputProps] = splitProps(props, [
    "class",
    "classList",
    "leadingIcon",
    "showCopyButton",
    "showClearButton",
    "showRevealButton",
    "revealed",
    "copyLabel",
    "clearLabel",
    "revealLabel",
    "onCopyClick",
    "onClearClick",
    "onRevealClick",
    "numeric",
    "invalid",
    "appearance",
    "disabled",
  ])

  return (
    <div
      data-component="text-input-v2"
      data-disabled={local.disabled ? "" : undefined}
      data-invalid={local.invalid ? "" : undefined}
      data-numeric={local.numeric ? "" : undefined}
      data-appearance={local.appearance ?? "base"}
      data-leading-icon={local.leadingIcon ? "" : undefined}
      classList={{
        ...local.classList,
        [local.class ?? ""]: !!local.class,
      }}
    >
      <div data-slot="text-input-v2-value">
        <Show when={local.leadingIcon}>
          <span data-slot="text-input-v2-leading-icon">{local.leadingIcon}</span>
        </Show>
        <input
          {...inputProps}
          type={inputProps.type ?? "text"}
          disabled={local.disabled}
          aria-invalid={local.invalid ? true : undefined}
          data-slot="text-input-v2-input"
        />
      </div>
      <Show when={local.showClearButton || local.showCopyButton || local.showRevealButton}>
        <button
          type="button"
          data-slot="text-input-v2-icon-button"
          data-variant={local.showClearButton ? "clear" : local.showRevealButton ? "reveal" : "copy"}
          aria-label={
            local.showClearButton
              ? (local.clearLabel ?? "Clear")
              : local.showRevealButton
                ? (local.revealLabel ?? "Reveal")
                : (local.copyLabel ?? "Copy")
          }
          disabled={local.disabled}
          onMouseDown={(event) => {
            if (local.showClearButton) return
            event.preventDefault()
          }}
          onClick={(event) => {
            if (local.showClearButton) {
              local.onClearClick?.(event)
              return
            }
            if (local.showRevealButton) {
              local.onRevealClick?.(event)
              return
            }
            local.onCopyClick?.(event)
          }}
        >
          <Icon
            name={
              local.showClearButton
                ? "xmark-small"
                : local.showRevealButton
                  ? (local.revealed ? "eye-off" : "eye")
                  : "copy"
            }
          />
        </button>
      </Show>
    </div>
  )
}
