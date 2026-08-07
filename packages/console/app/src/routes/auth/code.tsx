import { A, useNavigate, useSearchParams } from "@solidjs/router"
import { Title } from "@solidjs/meta"
import { createSignal, Show } from "solid-js"
import { useI18n } from "~/context/i18n"
import { useLanguage } from "~/context/language"
import { LanguagePicker } from "~/component/language-picker"
import "./index.css"

export default function AuthCode() {
  const navigate = useNavigate()
  const i18n = useI18n()
  const language = useLanguage()
  const [searchParams] = useSearchParams()
  const [code, setCode] = createSignal("")
  const [error, setError] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [resendSuccess, setResendSuccess] = createSignal(false)

  const email = searchParams.email || ""

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError("")

    const codeValue = code().trim()
    if (!codeValue || codeValue.length !== 6) {
      setError(i18n.t("auth.code.error.invalidCode"))
      return
    }

    setLoading(true)
    try {
      const authUrl = import.meta.env.VITE_AUTH_URL
      const params = new URLSearchParams({
        client_id: "app",
        redirect_uri: `${window.location.origin}/auth/callback/auth/code`,
        response_type: "code",
        provider: "email",
        code: codeValue,
        email: email,
      })
      window.location.href = `${authUrl}/authorize?${params.toString()}`
    } catch (e) {
      setError(i18n.t("auth.code.error.invalidCode"))
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendSuccess(false)
    try {
      const authUrl = import.meta.env.VITE_AUTH_URL
      const params = new URLSearchParams({
        client_id: "app",
        redirect_uri: `${window.location.origin}/auth/callback/auth/email`,
        response_type: "code",
        provider: "email",
        email: email,
      })
      window.location.href = `${authUrl}/authorize?${params.toString()}`
    } catch (e) {
      console.error("Failed to resend code:", e)
    }
  }

  return (
    <div data-page="auth-code">
      <Title>{i18n.t("auth.code.title")} | Poltter</Title>
      <div data-component="auth-container">
        <div data-slot="logo">
          <A href={language.route("/")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="179" height="32" viewBox="0 0 179 32" fill="none">
              <g clip-path="url(#clip0_3654_210259)">
                <mask
                  id="mask0_3654_210259"
                  style="mask-type:luminance"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="179"
                  height="32"
                >
                  <path d="M178.286 0H0V32H178.286V0Z" fill="white" />
                </mask>
                <g mask="url(#mask0_3654_210259)">
                  <path d="M13.7132 22.8577H4.57031V13.7148H13.7132V22.8577Z" fill="#444444" />
                  <path
                    d="M13.7143 9.14174H4.57143V22.856H13.7143V9.14174ZM18.2857 27.4275H0V4.57031H18.2857V27.4275Z"
                    fill="#CDCDCD"
                  />
                  <path d="M36.5725 22.8577H27.4297V13.7148H36.5725V22.8577Z" fill="#444444" />
                  <path
                    d="M27.4308 22.856H36.5737V9.14174H27.4308V22.856ZM41.1451 27.4275H27.4308V31.9989H22.8594V4.57031H41.1451V27.4275Z"
                    fill="#CDCDCD"
                  />
                  <path d="M64.0033 18.2852V22.8566H50.2891V18.2852H64.0033Z" fill="#444444" />
                  <path
                    d="M63.9967 18.2846H50.2824V22.856H63.9967V27.4275H45.7109V4.57031H63.9967V18.2846ZM50.2824 13.7132H59.4252V9.14174H50.2824V13.7132Z"
                    fill="#CDCDCD"
                  />
                  <path d="M82.2835 27.4291H73.1406V13.7148H82.2835V27.4291Z" fill="#444444" />
                  <path
                    d="M82.2846 9.14174H73.1417V27.4275H68.5703V4.57031H82.2846V9.14174ZM86.856 27.4275H82.2846V9.14174H86.856V27.4275Z"
                    fill="#CDCDCD"
                  />
                  <path d="M109.714 22.8577H96V13.7148H109.714V22.8577Z" fill="#444444" />
                  <path
                    d="M109.715 9.14174H96.0011V22.856H109.715V27.4275H91.4297V4.57031H109.715V9.14174Z"
                    fill="white"
                  />
                  <path d="M128.002 22.8577H118.859V13.7148H128.002V22.8577Z" fill="#444444" />
                  <path
                    d="M128.003 9.14174H118.86V22.856H128.003V9.14174ZM132.575 27.4275H114.289V4.57031H132.575V27.4275Z"
                    fill="white"
                  />
                  <path d="M150.854 22.8577H141.711V13.7148H150.854V22.8577Z" fill="#444444" />
                  <path
                    d="M150.855 9.14286H141.712V22.8571H150.855V9.14286ZM155.426 27.4286H137.141V4.57143H150.855V0H155.426V27.4286Z"
                    fill="white"
                  />
                  <path d="M178.285 18.2852V22.8566H164.57V18.2852H178.285Z" fill="#444444" />
                  <path
                    d="M164.571 9.14174V13.7132H173.714V9.14174H164.571ZM178.286 18.2846H164.571V22.856H178.286V27.4275H160V4.57031H178.286V18.2846Z"
                    fill="white"
                  />
                </g>
              </g>
              <defs>
                <clipPath id="clip0_3654_210259">
                  <rect width="178.286" height="32" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </A>
        </div>

        <div data-slot="card">
          <h1 data-slot="title">{i18n.t("auth.code.title")}</h1>
          <p data-slot="subtitle">
            {i18n.t("auth.code.subtitle").replace("{{email}}", email)}
          </p>

          <form onSubmit={handleSubmit}>
            <div data-slot="input-group">
              <input
                type="text"
                value={code()}
                onInput={(e) => setCode(e.currentTarget.value)}
                placeholder={i18n.t("auth.code.placeholder")}
                data-slot="input"
                autocomplete="one-time-code"
                maxlength={6}
                autofocus
              />
            </div>

            <Show when={error()}>
              <p data-slot="error">{error()}</p>
            </Show>

            <button type="submit" data-slot="submit" disabled={loading()}>
              {loading() ? "..." : i18n.t("auth.code.submit")}
            </button>
          </form>

          <div data-slot="resend">
            <Show when={resendSuccess()}>
              <p data-slot="resend-success">{i18n.t("auth.code.resendSuccess")}</p>
            </Show>
            <button type="button" data-slot="resend-button" onClick={handleResend}>
              {i18n.t("auth.code.resend")}
            </button>
          </div>

          <A href="/auth/email" data-slot="back-link">
            ← Back to email
          </A>
        </div>

        <LanguagePicker align="center" />
      </div>
    </div>
  )
}
