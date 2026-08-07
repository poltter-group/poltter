import "./index.css"
import { createAsync, query } from "@solidjs/router"
import { Title } from "@solidjs/meta"
import { For, Match, Switch } from "solid-js"
import { Footer } from "~/component/footer"
import { Header } from "~/component/header"
import { Faq } from "~/component/faq"
import { Legal } from "~/component/legal"
import { getLastSeenWorkspaceID } from "../workspace/common"
import { useI18n } from "~/context/i18n"
import { useLanguage } from "~/context/language"
import { LocaleLinks } from "~/component/locale-links"

const checkLoggedIn = query(async () => {
  "use server"
  return await getLastSeenWorkspaceID().catch(() => {})
}, "checkLoggedIn.get")

const tiers = [
  {
    id: "free",
    highlighted: false,
    features: [
      "pricing.free.feature1",
      "pricing.free.feature2",
      "pricing.free.feature3",
      "pricing.free.feature4",
    ],
  },
  {
    id: "go",
    highlighted: true,
    features: [
      "pricing.go.feature1",
      "pricing.go.feature2",
      "pricing.go.feature3",
      "pricing.go.feature4",
      "pricing.go.feature5",
    ],
  },
  {
    id: "black",
    highlighted: false,
    features: [
      "pricing.black.feature1",
      "pricing.black.feature2",
      "pricing.black.feature3",
      "pricing.black.feature4",
      "pricing.black.feature5",
      "pricing.black.feature6",
    ],
  },
] as const

const comparisonFeatures = [
  {
    label: "pricing.comparison.freeModels",
    free: true,
    go: true,
    black: true,
  },
  {
    label: "pricing.comparison.goModels",
    free: false,
    go: true,
    black: true,
  },
  {
    label: "pricing.comparison.premiumModels",
    free: false,
    go: false,
    black: true,
  },
  {
    label: "pricing.comparison.byok",
    free: true,
    go: true,
    black: true,
  },
  {
    label: "pricing.comparison.autoReload",
    free: false,
    go: false,
    black: false,
    freeText: "pricing.comparison.autoReload.free",
    goText: "pricing.comparison.autoReload.go",
    blackText: "pricing.comparison.autoReload.black",
  },
  {
    label: "pricing.comparison.limits",
    free: false,
    go: false,
    black: false,
    freeText: "pricing.comparison.limits.free",
    goText: "pricing.comparison.limits.go",
    blackText: "pricing.comparison.limits.black",
  },
  {
    label: "pricing.comparison.support",
    free: false,
    go: false,
    black: false,
    freeText: "pricing.comparison.support.free",
    goText: "pricing.comparison.support.go",
    blackText: "pricing.comparison.support.black",
  },
]

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.3333 4L6.00001 11.3333L2.66667 8"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="square"
      />
    </svg>
  )
}

function DashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 8H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
    </svg>
  )
}

export default function Pricing() {
  const i18n = useI18n()
  const language = useLanguage()
  const loggedin = createAsync(() => checkLoggedIn())

  return (
    <main data-page="pricing">
      <Title>{i18n.t("pricing.title")}</Title>
      <LocaleLinks path="/pricing" />

      <div data-component="container">
        <Header zen hideGetStarted />

        <div data-component="content">
          <section data-component="hero">
            <h1>{i18n.t("pricing.hero.title")}</h1>
            <p>{i18n.t("pricing.hero.body")}</p>
          </section>

          <section data-component="tiers">
            <For each={tiers}>
              {(tier) => (
                <div data-slot="tier-card" data-highlighted={tier.highlighted}>
                  <div data-slot="tier-header">
                    <span data-slot="tier-name">{i18n.t(`pricing.${tier.id}.name`)}</span>
                    <div data-slot="tier-price">
                      <span data-slot="amount">{i18n.t(`pricing.${tier.id}.price`)}</span>
                      <span data-slot="period">{i18n.t(`pricing.${tier.id}.period`)}</span>
                    </div>
                    <p data-slot="tier-desc">{i18n.t(`pricing.${tier.id}.desc`)}</p>
                  </div>
                  <ul data-slot="tier-features">
                    <For each={tier.features}>
                      {(feature) => (
                        <li>
                          <span data-slot="check">
                            <CheckIcon />
                          </span>
                          {i18n.t(feature)}
                        </li>
                      )}
                    </For>
                  </ul>
                  <div data-slot="tier-cta">
                    <Switch>
                      <Match when={tier.id === "free"}>
                        <a href="/auth" data-slot="tier-button" data-style="secondary">
                          {i18n.t("pricing.free.cta")}
                        </a>
                      </Match>
                      <Match when={tier.id === "go"}>
                        <a href="/auth" data-slot="tier-button" data-style="primary">
                          {i18n.t("pricing.go.cta")}
                        </a>
                      </Match>
                      <Match when={tier.id === "black"}>
                        <a href="/black" data-slot="tier-button" data-style="secondary">
                          {i18n.t("pricing.black.cta")}
                        </a>
                      </Match>
                    </Switch>
                  </div>
                </div>
              )}
            </For>
          </section>

          <section data-component="comparison">
            <h2>{i18n.t("pricing.comparison.title")}</h2>
            <table data-slot="comparison-table">
              <thead>
                <tr>
                  <th>{i18n.t("pricing.comparison.feature")}</th>
                  <th>{i18n.t("pricing.free.name")}</th>
                  <th>{i18n.t("pricing.go.name")}</th>
                  <th>{i18n.t("pricing.black.name")}</th>
                </tr>
              </thead>
              <tbody>
                <For each={comparisonFeatures}>
                  {(feature) => (
                    <tr>
                      <td>{i18n.t(feature.label)}</td>
                      <td>
                        {feature.free ? (
                          <span data-slot="check-icon">
                            <CheckIcon />
                          </span>
                        ) : feature.freeText ? (
                          i18n.t(feature.freeText)
                        ) : (
                          <span data-slot="dash-icon">
                            <DashIcon />
                          </span>
                        )}
                      </td>
                      <td>
                        {feature.go ? (
                          <span data-slot="check-icon">
                            <CheckIcon />
                          </span>
                        ) : feature.goText ? (
                          i18n.t(feature.goText)
                        ) : (
                          <span data-slot="dash-icon">
                            <DashIcon />
                          </span>
                        )}
                      </td>
                      <td>
                        {feature.black ? (
                          <span data-slot="check-icon">
                            <CheckIcon />
                          </span>
                        ) : feature.blackText ? (
                          i18n.t(feature.blackText)
                        ) : (
                          <span data-slot="dash-icon">
                            <DashIcon />
                          </span>
                        )}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </section>

          <section data-component="faq">
            <h2>{i18n.t("common.faq")}</h2>
            <ul>
              <li>
                <Faq question={i18n.t("pricing.faq.q1")}>{i18n.t("pricing.faq.a1")}</Faq>
              </li>
              <li>
                <Faq question={i18n.t("pricing.faq.q2")}>{i18n.t("pricing.faq.a2")}</Faq>
              </li>
              <li>
                <Faq question={i18n.t("pricing.faq.q3")}>{i18n.t("pricing.faq.a3")}</Faq>
              </li>
              <li>
                <Faq question={i18n.t("pricing.faq.q4")}>{i18n.t("pricing.faq.a4")}</Faq>
              </li>
              <li>
                <Faq question={i18n.t("pricing.faq.q5")}>{i18n.t("pricing.faq.a5")}</Faq>
              </li>
            </ul>
          </section>

          <Footer />
        </div>
      </div>

      <Legal />
    </main>
  )
}
