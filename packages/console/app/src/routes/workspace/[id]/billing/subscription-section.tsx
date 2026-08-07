import { A, action, useParams, useAction, createAsync, useSubmission, json } from "@solidjs/router"
import { createMemo, For, Match, Show, Switch } from "solid-js"
import { createStore } from "solid-js/store"
import { Billing } from "@poltter-ai/console-core/billing.js"
import { withActor } from "~/context/auth.withActor"
import styles from "./subscription-section.module.css"
import { queryBillingInfo } from "../../common"
import { useI18n } from "~/context/i18n"
import { useLanguage } from "~/context/language"

const createSessionUrl = action(async (workspaceID: string, returnUrl: string) => {
  "use server"
  return json(
    await withActor(
      () =>
        Billing.generateSessionUrl({ returnUrl })
          .then((data) => ({ error: undefined, data }))
          .catch((e) => ({
            error: e.message as string,
            data: undefined,
          })),
      workspaceID,
    ),
  )
}, "subscription.sessionUrl")

export function SubscriptionSection() {
  const params = useParams()
  const i18n = useI18n()
  const language = useLanguage()
  const billingInfo = createAsync(() => queryBillingInfo(params.id!))
  const sessionAction = useAction(createSessionUrl)
  const sessionSubmission = useSubmission(createSessionUrl)
  const [store, setStore] = createStore({
    sessionRedirecting: false,
    showCancelConfirm: false,
  })

  const subscription = createMemo(() => billingInfo()?.subscription)
  const hasBlack = createMemo(() => !!billingInfo()?.subscriptionID)
  const hasGo = createMemo(() => !!billingInfo()?.liteSubscriptionID)
  const hasPaymentMethod = createMemo(() => !!billingInfo()?.paymentMethodID)
  const hasBalance = createMemo(() => (billingInfo()?.balance ?? 0) > 0)

  const planName = createMemo(() => {
    if (hasBlack()) {
      const plan = subscription()?.plan
      if (plan === "200") return "Black (200 seats)"
      if (plan === "100") return "Black (100 seats)"
      return "Black (20 seats)"
    }
    if (hasGo()) return "Go"
    return "Free"
  })

  const planPrice = createMemo(() => {
    if (hasBlack()) {
      const plan = subscription()?.plan
      if (plan === "200") return "$200/mo"
      if (plan === "100") return "$100/mo"
      return "$20/mo"
    }
    if (hasGo()) return "$10/mo"
    return "$0"
  })

  const subscriptionStatus = createMemo(() => {
    const sub = subscription()
    if (!sub) return "none"
    return sub.status ?? "none"
  })

  async function onClickManage() {
    setStore("sessionRedirecting", true)
    const result = await sessionAction(params.id!, window.location.href)
    if (result.data) {
      window.location.href = result.data
      return
    }
    setStore("sessionRedirecting", false)
  }

  function formatResetTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <section class={styles.root}>
      <div data-slot="section-title">
        <h2>{i18n.t("workspace.subscription.title")}</h2>
        <p>{i18n.t("workspace.subscription.subtitle")}</p>
      </div>
      <div data-slot="section-content">
        <div data-slot="subscription-card">
          <div data-slot="plan-info">
            <div data-slot="plan-name">{planName()}</div>
            <div data-slot="plan-price">{planPrice()}</div>
          </div>
          <div data-slot="plan-details">
            <Show when={hasBlack()}>
              <div data-slot="detail-row">
                <span data-slot="detail-label">{i18n.t("workspace.subscription.status")}</span>
                <span data-slot="detail-value" data-status={subscriptionStatus()}>
                  {subscriptionStatus() === "subscribed" ? "Active" : subscriptionStatus()}
                </span>
              </div>
              <Show when={subscription()?.seats}>
                <div data-slot="detail-row">
                  <span data-slot="detail-label">{i18n.t("workspace.subscription.seats")}</span>
                  <span data-slot="detail-value">{subscription()?.seats}</span>
                </div>
              </Show>
            </Show>
            <Show when={hasGo()}>
              <div data-slot="detail-row">
                <span data-slot="detail-label">{i18n.t("workspace.subscription.status")}</span>
                <span data-slot="detail-value" data-status="active">Active</span>
              </div>
            </Show>
            <Show when={!hasBlack() && !hasGo()}>
              <div data-slot="detail-row">
                <span data-slot="detail-label">{i18n.t("workspace.subscription.type")}</span>
                <span data-slot="detail-value">Pay-as-you-go</span>
              </div>
            </Show>
          </div>
          <div data-slot="plan-actions">
            <Show when={hasBlack() || hasGo()}>
              <button
                data-color="primary"
                disabled={sessionSubmission.pending || store.sessionRedirecting}
                onClick={onClickManage}
              >
                {sessionSubmission.pending || store.sessionRedirecting
                  ? i18n.t("workspace.billing.loading")
                  : i18n.t("workspace.subscription.manage")}
              </button>
            </Show>
            <Show when={!hasBlack() && !hasGo()}>
              <A href={language.route("/pricing")} data-slot="upgrade-link">
                {i18n.t("workspace.subscription.upgrade")}
              </A>
            </Show>
          </div>
        </div>

        <Show when={billingInfo()?.reloadError}>
          <div data-slot="payment-error">
            <div data-slot="error-icon">!</div>
            <div data-slot="error-content">
              <p data-slot="error-title">{i18n.t("workspace.subscription.paymentFailed")}</p>
              <p data-slot="error-message">{billingInfo()?.reloadError}</p>
              <Show when={billingInfo()?.timeReloadError}>
                <p data-slot="error-time">
                  {i18n.t("workspace.subscription.lastAttempt")}:{" "}
                  {new Date(billingInfo()!.timeReloadError!).toLocaleString()}
                </p>
              </Show>
            </div>
            <button
              data-color="primary"
              disabled={sessionSubmission.pending || store.sessionRedirecting}
              onClick={onClickManage}
            >
              {i18n.t("workspace.subscription.updatePayment")}
            </button>
          </div>
        </Show>

        <Show when={hasPaymentMethod()}>
          <div data-slot="payment-info">
            <div data-slot="info-row">
              <span data-slot="info-label">{i18n.t("workspace.subscription.paymentMethod")}</span>
              <span data-slot="info-value">
                {billingInfo()?.paymentMethodType === "card"
                  ? `Card •••• ${billingInfo()?.paymentMethodLast4}`
                  : billingInfo()?.paymentMethodType === "link"
                    ? "Stripe Link"
                    : billingInfo()?.paymentMethodType ?? "Unknown"}
              </span>
            </div>
            <Show when={hasBalance()}>
              <div data-slot="info-row">
                <span data-slot="info-label">{i18n.t("workspace.subscription.currentBalance")}</span>
                <span data-slot="info-value">${((billingInfo()?.balance ?? 0) / 100000000).toFixed(2)}</span>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </section>
  )
}
