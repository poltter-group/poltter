import { A, useNavigate } from "@solidjs/router"
import { Title } from "@solidjs/meta"
import { createSignal, Show } from "solid-js"
import { useI18n } from "~/context/i18n"
import { useLanguage } from "~/context/language"
import { LanguagePicker } from "~/component/language-picker"
import "./index.css"

export default function AuthEmail() {
  const navigate = useNavigate()
  const i18n = useI18n()
  const language = useLanguage()
  const [email, setEmail] = createSignal("")
  const [error, setError] = createSignal("")
  const [loading, setLoading] = createSignal(false)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError("")

    const emailValue = email().trim()
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setError(i18n.t("auth.email.error.invalidEmail"))
      return
    }

    setLoading(true)
    try {
      const authUrl = import.meta.env.VITE_AUTH_URL
      const params = new URLSearchParams({
        client_id: "app",
        redirect_uri: `${window.location.origin}/auth/callback/auth/email`,
        response_type: "code",
        provider: "email",
        email: emailValue,
      })
      window.location.href = `${authUrl}/authorize?${params.toString()}`
    } catch (e) {
      setError(i18n.t("auth.email.error.invalidEmail"))
      setLoading(false)
    }
  }

  return (
    <div data-page="auth-email">
      <Title>{i18n.t("auth.email.title")} | Poltter</Title>
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
          <h1 data-slot="title">{i18n.t("auth.email.title")}</h1>
          <p data-slot="subtitle">{i18n.t("auth.email.subtitle")}</p>

          <form onSubmit={handleSubmit}>
            <div data-slot="input-group">
              <input
                type="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                placeholder={i18n.t("auth.email.placeholder")}
                data-slot="input"
                autocomplete="email"
                autofocus
              />
            </div>

            <Show when={error()}>
              <p data-slot="error">{error()}</p>
            </Show>

            <button type="submit" data-slot="submit" disabled={loading()}>
              {loading() ? "..." : i18n.t("auth.email.submit")}
            </button>
          </form>

          <div data-slot="divider">
            <span>{i18n.t("auth.code.title")}</span>
          </div>

          <div data-slot="providers">
            <A href="/auth/authorize?continue=/auth" data-slot="provider-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </A>
            <A href="/auth/authorize?continue=/auth" data-slot="provider-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </A>
          </div>
        </div>

        <LanguagePicker />
      </div>
    </div>
  )
}
