import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { PRODUCTS } from '../../src/data/products'
import { decrementStock, type CartLine } from './_lib/sheets'

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`)
  return value
}

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'contact@loasisenfleurs.com'

function parseCart(metadataCart: string | undefined): CartLine[] {
  if (!metadataCart) return []
  return metadataCart.split(',').map(pair => {
    const [id, qty] = pair.split(':').map(Number)
    return { id, qty }
  }).filter(line => Number.isInteger(line.id) && Number.isInteger(line.qty) && line.qty > 0)
}

// Le contenu vient de champs saisis par le client (Stripe Checkout, note de commande) :
// on échappe avant de l'insérer dans l'email HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatOrderEmail(session: Stripe.Checkout.Session, items: CartLine[]): string {
  const lines = items.map(item => {
    const product = PRODUCTS.find(p => p.id === item.id)
    const name = product ? escapeHtml(product.name) : `Produit #${item.id}`
    const lineTotal = product ? (product.price * item.qty).toFixed(2) : '?'
    return `<li>${item.qty} × ${name} — ${lineTotal}€</li>`
  }).join('')

  // Le nom exact du champ adresse de livraison dépend de la version de l'API Stripe
  // utilisée par le compte d'Agnès : à vérifier lors du premier test réel (cf. /review).
  interface ShippingLike { name?: string, address?: Stripe.Address }
  const sessionWithShipping = session as unknown as { shipping_details?: ShippingLike, shipping?: ShippingLike }
  const shipping = sessionWithShipping.shipping_details ?? sessionWithShipping.shipping
  const address = shipping?.address

  const addressHtml = address
    ? escapeHtml(`${address.line1 ?? ''} ${address.line2 ?? ''}`) + `<br>` + escapeHtml(`${address.postal_code ?? ''} ${address.city ?? ''}`) + `<br>` + escapeHtml(address.country ?? '')
    : 'Non renseignée'

  const note = session.metadata?.note
  const noteHtml = note ? `<p><strong>Note du client :</strong><br>${escapeHtml(note)}</p>` : ''

  return `
    <h2>Nouvelle commande — L'Oasis en Fleurs</h2>
    <p><strong>Client :</strong> ${escapeHtml(session.customer_details?.name ?? '—')} (${escapeHtml(session.customer_details?.email ?? '—')})</p>
    <p><strong>Adresse de livraison :</strong><br>${escapeHtml(shipping?.name ?? '')}<br>${addressHtml}</p>
    <p><strong>Produits commandés :</strong></p>
    <ul>${lines}</ul>
    <p><strong>Total payé :</strong> ${((session.amount_total ?? 0) / 100).toFixed(2)}€</p>
    ${noteHtml}
  `
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'method_not_allowed' }
  }

  const signature = event.headers['stripe-signature']
  if (!signature) {
    return { statusCode: 400, body: 'missing_signature' }
  }

  const rawBody = event.isBase64Encoded && event.body
    ? Buffer.from(event.body, 'base64')
    : (event.body ?? '')

  const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'))

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, getEnv('STRIPE_WEBHOOK_SECRET'))
  } catch (err) {
    console.error('Signature webhook Stripe invalide :', err)
    return { statusCode: 400, body: 'invalid_signature' }
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    // On ignore les autres types d'événements : on ne s'est abonné qu'à celui-ci dans Stripe,
    // mais on répond 200 par sécurité si le dashboard est configuré pour en envoyer davantage.
    return { statusCode: 200, body: 'ignored' }
  }

  const session = stripeEvent.data.object as Stripe.Checkout.Session
  const items = parseCart(session.metadata?.cart)

  if (items.length === 0) {
    console.error('Session Stripe sans panier exploitable dans les metadata :', session.id)
    return { statusCode: 200, body: 'no_cart_metadata' }
  }

  try {
    await decrementStock(items)
  } catch (err) {
    // Le paiement a déjà eu lieu : on ne peut pas bloquer la vente à ce stade.
    // On journalise l'échec pour qu'Agnès corrige le stock manuellement si besoin.
    console.error('Échec de la décrémentation du stock après paiement confirmé :', session.id, err)
  }

  try {
    const resend = new Resend(getEnv('RESEND_API_KEY'))
    await resend.emails.send({
      from: getEnv('RESEND_FROM_EMAIL'),
      to: NOTIFY_EMAIL,
      subject: `Nouvelle commande L'Oasis en Fleurs — ${((session.amount_total ?? 0) / 100).toFixed(2)}€`,
      html: formatOrderEmail(session, items),
    })
  } catch (err) {
    console.error('Échec de l\'envoi de l\'email de notification de commande :', session.id, err)
  }

  return { statusCode: 200, body: 'ok' }
}
