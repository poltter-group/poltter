import { Component } from "solid-js"
import { useLanguage } from "@/context/language"
import { ButtonV2 } from "@poltter-ai/ui/v2/button-v2"
import { Icon } from "@poltter-ai/ui/icon"

const plans = [
  {
    key: "free",
    price: "0",
    period: "",
    features: [
      "settings.upgrade.plan.free.feature.1",
      "settings.upgrade.plan.free.feature.2",
      "settings.upgrade.plan.free.feature.3",
      "settings.upgrade.plan.free.feature.4",
    ],
    cta: "settings.upgrade.plan.free.cta",
    current: true,
  },
  {
    key: "pro",
    price: "20",
    period: "/mo",
    features: [
      "settings.upgrade.plan.pro.feature.1",
      "settings.upgrade.plan.pro.feature.2",
      "settings.upgrade.plan.pro.feature.3",
      "settings.upgrade.plan.pro.feature.4",
      "settings.upgrade.plan.pro.feature.5",
    ],
    cta: "settings.upgrade.plan.pro.cta",
    current: false,
  },
  {
    key: "enterprise",
    price: "Custom",
    period: "",
    features: [
      "settings.upgrade.plan.enterprise.feature.1",
      "settings.upgrade.plan.enterprise.feature.2",
      "settings.upgrade.plan.enterprise.feature.3",
      "settings.upgrade.plan.enterprise.feature.4",
      "settings.upgrade.plan.enterprise.feature.5",
      "settings.upgrade.plan.enterprise.feature.6",
    ],
    cta: "settings.upgrade.plan.enterprise.cta",
    current: false,
  },
]

export const SettingsUpgradeV2: Component = () => {
  const language = useLanguage()

  return (
    <>
      <div class="settings-v2-tab-header">
        <h2 class="settings-v2-tab-title">{language.t("settings.upgrade.title")}</h2>
        <p class="settings-v2-tab-description">{language.t("settings.upgrade.description")}</p>
      </div>
      <div class="settings-v2-tab-body settings-v2-upgrade">
        <div class="settings-v2-upgrade-plans">
          {plans.map((plan) => (
            <div
              class={`settings-v2-upgrade-plan ${plan.current ? "settings-v2-upgrade-plan--current" : ""}`}
            >
              <div class="settings-v2-upgrade-plan-header">
                <span class="settings-v2-upgrade-plan-name">
                  {language.t(`settings.upgrade.plan.${plan.key}.name`)}
                </span>
                {plan.current && (
                  <span class="settings-v2-badge">{language.t("settings.upgrade.currentPlan")}</span>
                )}
              </div>
              <div class="settings-v2-upgrade-plan-price">
                {plan.price !== "Custom" && <span class="settings-v2-upgrade-plan-currency">$</span>}
                <span class="settings-v2-upgrade-plan-amount">{plan.price}</span>
                {plan.period && <span class="settings-v2-upgrade-plan-period">{plan.period}</span>}
              </div>
              <ul class="settings-v2-upgrade-plan-features">
                {plan.features.map((f) => (
                  <li>
                    <Icon name="check" />
                    {language.t(f)}
                  </li>
                ))}
              </ul>
              <ButtonV2
                variant={plan.current ? "ghost" : "contrast"}
                disabled={plan.current}
                class="settings-v2-upgrade-plan-cta"
              >
                {language.t(plan.cta)}
              </ButtonV2>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
