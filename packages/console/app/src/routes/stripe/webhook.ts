import type { Stripe } from "stripe"
import { Billing } from "@poltter-ai/console-core/billing.js"
import type { APIEvent } from "@solidjs/start/server"
import { and, Database, eq, sql } from "@poltter-ai/console-core/drizzle/index.js"
import { BillingTable, LiteTable, PaymentTable } from "@poltter-ai/console-core/schema/billing.sql.js"
import { Identifier } from "@poltter-ai/console-core/identifier.js"
import { centsToMicroCents } from "@poltter-ai/console-core/util/price.js"
import { Actor } from "@poltter-ai/console-core/actor.js"
import { Resource } from "@poltter-ai/console-resource"
import { LiteData } from "@poltter-ai/console-core/lite.js"
import { BlackData } from "@poltter-ai/console-core/black.js"
import { Referral } from "@poltter-ai/console-core/referral.js"
import { AWS } from "@poltter-ai/console-core/aws.js"

export async function POST(input: APIEvent) {
  const body = await Billing.stripe().webhooks.constructEventAsync(
    await input.request.text(),
    input.request.headers.get("stripe-signature")!,
    Resource.STRIPE_WEBHOOK_SECRET.value,
  )
  console.log(body.type, JSON.stringify(body, null, 2))

  return (async () => {
    if (body.type === "customer.updated") {
      // check default payment method changed
      const prevInvoiceSettings = body.data.previous_attributes?.invoice_settings ?? {}
      if (!("default_payment_method" in prevInvoiceSettings)) return "ignored"

      const customerID = body.data.object.id
      const paymentMethodID = body.data.object.invoice_settings.default_payment_method as string

      if (!customerID) throw new Error("Customer ID not found")
      if (!paymentMethodID) throw new Error("Payment method ID not found")

      const paymentMethod = await Billing.stripe().paymentMethods.retrieve(paymentMethodID)
      await Database.use(async (tx) => {
        await tx
          .update(BillingTable)
          .set({
            paymentMethodID,
            paymentMethodLast4: paymentMethod.card?.last4 ?? null,
            paymentMethodType: paymentMethod.type,
          })
          .where(eq(BillingTable.customerID, customerID))
      })
    }
    if (body.type === "checkout.session.completed" && body.data.object.mode === "payment") {
      const workspaceID = body.data.object.metadata?.workspaceID
      const amountInCents = body.data.object.metadata?.amount && parseInt(body.data.object.metadata?.amount)
      const customerID = body.data.object.customer as string
      const paymentID = body.data.object.payment_intent as string
      const invoiceID = body.data.object.invoice as string

      if (!workspaceID) throw new Error("Workspace ID not found")
      if (!customerID) throw new Error("Customer ID not found")
      if (!amountInCents) throw new Error("Amount not found")
      if (!paymentID) throw new Error("Payment ID not found")
      if (!invoiceID) throw new Error("Invoice ID not found")

      await Actor.provide("system", { workspaceID }, async () => {
        const customer = await Billing.get()
        if (customer?.customerID && customer.customerID !== customerID) throw new Error("Customer ID mismatch")

        // set customer metadata
        if (!customer?.customerID) {
          await Billing.stripe().customers.update(customerID, {
            metadata: {
              workspaceID,
            },
          })
        }

        // get payment method for the payment intent
        const paymentIntent = await Billing.stripe().paymentIntents.retrieve(paymentID, {
          expand: ["payment_method"],
        })
        const paymentMethod = paymentIntent.payment_method
        if (!paymentMethod || typeof paymentMethod === "string") throw new Error("Payment method not expanded")

        await Database.transaction(async (tx) => {
          await tx
            .update(BillingTable)
            .set({
              balance: sql`${BillingTable.balance} + ${centsToMicroCents(amountInCents)}`,
              customerID,
              paymentMethodID: paymentMethod.id,
              paymentMethodLast4: paymentMethod.card?.last4 ?? null,
              paymentMethodType: paymentMethod.type,
              // enable reload if first time enabling billing
              ...(customer?.customerID
                ? {}
                : {
                    reloadError: null,
                    timeReloadError: null,
                  }),
            })
            .where(eq(BillingTable.workspaceID, workspaceID))
          await tx.insert(PaymentTable).values({
            workspaceID,
            id: Identifier.create("payment"),
            amount: centsToMicroCents(amountInCents),
            paymentID,
            invoiceID,
            customerID,
          })
        })
      })
    }
    if (body.type === "customer.subscription.created") {
      const type = body.data.object.metadata?.type
      if (type === "lite") {
        const workspaceID = body.data.object.metadata?.workspaceID
        const userID = body.data.object.metadata?.userID
        const userEmail = body.data.object.metadata?.userEmail
        const coupon = body.data.object.metadata?.coupon
        const customerID = body.data.object.customer as string
        const invoiceID = body.data.object.latest_invoice as string
        const subscriptionID = body.data.object.id as string
        const paymentMethodID = body.data.object.default_payment_method as string

        if (!workspaceID) throw new Error("Workspace ID not found")
        if (!userID) throw new Error("User ID not found")
        if (!customerID) throw new Error("Customer ID not found")
        if (!invoiceID) throw new Error("Invoice ID not found")
        if (!subscriptionID) throw new Error("Subscription ID not found")
        if (!paymentMethodID) throw new Error("Payment method ID not found")

        // get payment method for the payment intent
        const paymentMethod = await Billing.stripe().paymentMethods.retrieve(paymentMethodID)
        await Actor.provide("system", { workspaceID }, async () => {
          // look up current billing
          const billing = await Billing.get()
          if (!billing) throw new Error(`Workspace with ID ${workspaceID} not found`)
          if (billing.customerID && billing.customerID !== customerID) throw new Error("Customer ID mismatch")

          // set customer metadata
          if (!billing?.customerID) {
            await Billing.stripe().customers.update(customerID, {
              metadata: {
                workspaceID,
              },
            })
          }

          await Database.transaction(async (tx) => {
            await tx
              .update(BillingTable)
              .set({
                customerID,
                liteSubscriptionID: subscriptionID,
                lite: {},
                paymentMethodID: paymentMethod.id,
                paymentMethodLast4: paymentMethod.card?.last4 ?? null,
                paymentMethodType: paymentMethod.type,
              })
              .where(eq(BillingTable.workspaceID, workspaceID))

            await tx.insert(LiteTable).values({
              workspaceID,
              id: Identifier.create("lite"),
              userID: userID,
            })

            if (userEmail) {
              if (coupon === LiteData.firstMonth50Coupon) {
                await Billing.redeemCoupon(userEmail, "GO1MONTH50")
              } else if (coupon === LiteData.firstMonth100Coupon) {
                await Billing.redeemCoupon(userEmail, "GOFREEMONTH")
              } else if (coupon === LiteData.threeMonths100Coupon) {
                await Billing.redeemCoupon(userEmail, "GO3MONTHS100")
              } else if (coupon === LiteData.sixMonths100Coupon) {
                await Billing.redeemCoupon(userEmail, "GO6MONTHS100")
              } else if (coupon === LiteData.twelveMonths100Coupon) {
                await Billing.redeemCoupon(userEmail, "GO12MONTHS100")
              }
            }
          })

          await Referral.completeFromLiteSubscription({
            workspaceID,
            userID,
          }).catch((error) => {
            console.error("Referral sync failed", error)
          })
        })
      }
    }
    if (body.type === "customer.subscription.updated" && body.data.object.status === "incomplete_expired") {
      const subscriptionID = body.data.object.id
      if (!subscriptionID) throw new Error("Subscription ID not found")

      const productID = body.data.object.items.data[0].price.product as string
      if (productID === LiteData.productID()) {
        await Billing.unsubscribeLite({ subscriptionID })
      } else if (productID === BlackData.productID()) {
        await Billing.unsubscribeBlack({ subscriptionID })
      }
    }
    if (body.type === "customer.subscription.deleted") {
      const subscriptionID = body.data.object.id
      if (!subscriptionID) throw new Error("Subscription ID not found")

      const productID = body.data.object.items.data[0].price.product as string
      if (productID === LiteData.productID()) {
        await Billing.unsubscribeLite({ subscriptionID })
      } else if (productID === BlackData.productID()) {
        await Billing.unsubscribeBlack({ subscriptionID })
      }
    }
    if (body.type === "invoice.payment_succeeded") {
      if (
        body.data.object.billing_reason === "subscription_create" ||
        body.data.object.billing_reason === "subscription_cycle"
      ) {
        const invoiceID = body.data.object.id as string
        const amountInCents = body.data.object.amount_paid
        const customerID = body.data.object.customer as string
        const subscriptionID = body.data.object.parent?.subscription_details?.subscription as string
        const productID = body.data.object.lines?.data[0].pricing?.price_details?.product as string

        if (!customerID) throw new Error("Customer ID not found")
        if (!invoiceID) throw new Error("Invoice ID not found")
        if (!subscriptionID) throw new Error("Subscription ID not found")

        // get coupon id from subscription
        const invoice = await Billing.stripe().invoices.retrieve(invoiceID, {
          expand: ["discounts", "payments"],
        })
        const paymentID = invoice.payments?.data[0]?.payment.payment_intent as string
        const couponID = (invoice.discounts[0] as Stripe.Discount)?.coupon?.id as string
        if (!paymentID) {
          // payment id can be undefined when using coupon
          if (!couponID) throw new Error("Payment ID not found")
        }

        const workspaceID = await Database.use((tx) =>
          tx
            .select({ workspaceID: BillingTable.workspaceID })
            .from(BillingTable)
            .where(eq(BillingTable.customerID, customerID))
            .then((rows) => rows[0]?.workspaceID),
        )
        if (!workspaceID) throw new Error("Workspace ID not found for customer")

        await Database.use((tx) =>
          tx.insert(PaymentTable).values({
            workspaceID,
            id: Identifier.create("payment"),
            amount: centsToMicroCents(amountInCents),
            paymentID,
            invoiceID,
            customerID,
            enrichment: {
              type: productID === LiteData.productID() ? "lite" : "subscription",
              currency: body.data.object.currency === "inr" ? "inr" : undefined,
              couponID,
            },
          }),
        )
      } else if (body.data.object.billing_reason === "manual") {
        const workspaceID = body.data.object.metadata?.workspaceID
        const amountInCents = body.data.object.metadata?.amount && parseInt(body.data.object.metadata?.amount)
        const invoiceID = body.data.object.id as string
        const customerID = body.data.object.customer as string

        if (!workspaceID) throw new Error("Workspace ID not found")
        if (!customerID) throw new Error("Customer ID not found")
        if (!amountInCents) throw new Error("Amount not found")
        if (!invoiceID) throw new Error("Invoice ID not found")

        await Actor.provide("system", { workspaceID }, async () => {
          // get payment id from invoice
          const invoice = await Billing.stripe().invoices.retrieve(invoiceID, {
            expand: ["payments"],
          })
          await Database.transaction(async (tx) => {
            await tx
              .update(BillingTable)
              .set({
                balance: sql`${BillingTable.balance} + ${centsToMicroCents(amountInCents)}`,
                reloadError: null,
                timeReloadError: null,
              })
              .where(eq(BillingTable.workspaceID, Actor.workspace()))
            await tx.insert(PaymentTable).values({
              workspaceID: Actor.workspace(),
              id: Identifier.create("payment"),
              amount: centsToMicroCents(amountInCents),
              invoiceID,
              paymentID: invoice.payments?.data[0].payment.payment_intent as string,
              customerID,
            })
          })
        })
      }
    }
    if (body.type === "invoice.payment_failed" || body.type === "invoice.payment_action_required") {
      const invoice = body.data.object
      const customerID = invoice.customer as string
      
      if (!customerID) throw new Error("Customer ID not found")

      const workspaceID = await Database.use((tx) =>
        tx
          .select({ workspaceID: BillingTable.workspaceID })
          .from(BillingTable)
          .where(eq(BillingTable.customerID, customerID))
          .then((rows) => rows[0]?.workspaceID),
      )
      if (!workspaceID) throw new Error("Workspace ID not found")

      const invoiceID = invoice.id
      const errorMessage = invoice.attempt_count > 1 
        ? "Your subscription payment has failed. Please update your payment method."
        : "Your payment has failed. Please update your payment method."

      await Actor.provide("system", { workspaceID }, async () => {
        // For manual reloads, update the reload error
        if (invoice.billing_reason === "manual") {
          const paymentIntent = await Billing.stripe().paymentIntents.retrieve(invoiceID)
          const detailedError =
            typeof paymentIntent === "object" && paymentIntent !== null
              ? paymentIntent.last_payment_error?.message
              : undefined

          await Database.use((tx) =>
            tx
              .update(BillingTable)
              .set({
                reload: false,
                reloadError: detailedError ?? errorMessage,
                timeReloadError: sql`now()`,
              })
              .where(eq(BillingTable.workspaceID, Actor.workspace())),
          )
        }

        // Send dunning email for all failed payments
        const customer = await Billing.stripe().customers.retrieve(customerID)
        if (customer && !customer.deleted && customer.email) {
          const isSubscription = invoice.subscription !== null
          const billing = await Billing.get()
          
          AWS.sendEmail({
            to: customer.email,
            subject: isSubscription 
              ? "Action Required: Subscription Payment Failed"
              : "Action Required: Payment Failed",
            body: `
              <h2>Payment Failed</h2>
              <p>We were unable to process your payment for your Poltter ${isSubscription ? "subscription" : "account"}.</p>
              <p><strong>Error:</strong> ${errorMessage}</p>
              <p>Please update your payment method to avoid service interruption.</p>
              <p><a href="${Resource.App.url}/workspace/${workspaceID}/billing">Update Payment Method</a></p>
              <p>If you have any questions, please contact us at help@anoma.ly</p>
            `,
          }).catch((err) => console.error("Failed to send dunning email:", err))
        }
      })
    }
    if (body.type === "charge.refunded") {
      const customerID = body.data.object.customer as string
      const paymentIntentID = body.data.object.payment_intent as string
      if (!customerID) throw new Error("Customer ID not found")
      if (!paymentIntentID) throw new Error("Payment ID not found")

      const workspaceID = await Database.use((tx) =>
        tx
          .select({
            workspaceID: BillingTable.workspaceID,
          })
          .from(BillingTable)
          .where(eq(BillingTable.customerID, customerID))
          .then((rows) => rows[0]?.workspaceID),
      )
      if (!workspaceID) throw new Error("Workspace ID not found")

      const payment = await Database.use((tx) =>
        tx
          .select({
            amount: PaymentTable.amount,
            enrichment: PaymentTable.enrichment,
          })
          .from(PaymentTable)
          .where(and(eq(PaymentTable.paymentID, paymentIntentID), eq(PaymentTable.workspaceID, workspaceID)))
          .then((rows) => rows[0]),
      )
      if (!payment) throw new Error("Payment not found")

      await Database.transaction(async (tx) => {
        await tx
          .update(PaymentTable)
          .set({
            timeRefunded: new Date(body.created * 1000),
          })
          .where(and(eq(PaymentTable.paymentID, paymentIntentID), eq(PaymentTable.workspaceID, workspaceID)))

        // deduct balance only for top up
        if (!payment.enrichment?.type) {
          await tx
            .update(BillingTable)
            .set({
              balance: sql`${BillingTable.balance} - ${payment.amount}`,
            })
            .where(eq(BillingTable.workspaceID, workspaceID))
        }
      })
    }
  })()
    .then((message) => {
      return Response.json({ message: message ?? "done" }, { status: 200 })
    })
    .catch((error: any) => {
      return Response.json({ message: error.message }, { status: 500 })
    })
}
