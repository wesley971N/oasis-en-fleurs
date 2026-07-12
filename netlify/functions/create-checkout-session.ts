import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { PRODUCTS } from '../../src/data/products'
import { checkStock, type CartLine } from './_lib/sheets'

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`)
  return value
}

interface CheckoutRequestBody {
  items: CartLine[]
  note?: string
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) }
  }

  let body: CheckoutRequestBody
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid_body' }) }
  }

  const items = Array.isArray(body.items) ? body.items : []
  if (items.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'empty_cart' }) }
  }

  // Sécurité : on ne fait jamais confiance au prix envoyé par le client.
  // Chaque ligne est relue depuis le catalogue serveur (src/data/products.ts).
  const taxRateId = process.env.STRIPE_TAX_RATE_ID
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  for (const item of items) {
    const product = PRODUCTS.find(p => p.id === item.id)
    if (!product || !Number.isInteger(item.qty) || item.qty <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'invalid_item', productId: item.id }) }
    }
    lineItems.push({
      quantity: item.qty,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(product.price * 100),
        product_data: { name: product.name },
      },
      ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
    })
  }

  // Cas limite (specs/projet.md) : rupture de stock OU Google Sheet inaccessible
  // → on bloque l'achat avant le paiement plutôt que de laisser passer la commande.
  try {
    const stockResult = await checkStock(items)
    if (!stockResult.ok) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'out_of_stock', productId: stockResult.productId, available: stockResult.available }),
      }
    }
  } catch (err) {
    console.error('Vérification du stock impossible :', err)
    return { statusCode: 503, body: JSON.stringify({ error: 'stock_check_unavailable' }) }
  }

  // Frais de port — France uniquement (specs/projet.md). La grille réelle (montant exact,
  // éventuel seuil de livraison gratuite) reste à confirmer avec Agnès avant la mise en prod ;
  // ces deux variables doivent être positionnées dans Netlify avant d'aller en production.
  const shippingFeeCents = parseInt(getEnv('SHIPPING_FLAT_FEE_CENTS'), 10)
  const freeShippingThresholdCents = process.env.FREE_SHIPPING_THRESHOLD_CENTS
    ? parseInt(process.env.FREE_SHIPPING_THRESHOLD_CENTS, 10)
    : null

  const subtotalCents = lineItems.reduce(
    (sum, li) => sum + (li.price_data!.unit_amount as number) * (li.quantity ?? 1),
    0
  )
  const freeShippingApplies = freeShippingThresholdCents !== null && subtotalCents >= freeShippingThresholdCents

  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || getEnv('SITE_URL')

  const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'))

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    // Expédition France uniquement (besoin exact de la spec).
    shipping_address_collection: { allowed_countries: ['FR'] },
    shipping_options: [{
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: freeShippingApplies ? 0 : shippingFeeCents, currency: 'eur' },
        display_name: freeShippingApplies ? 'Livraison gratuite' : 'Livraison (France)',
      },
    }],
    // Le webhook relit ce panier pour décrémenter le stock une fois le paiement confirmé.
    metadata: {
      cart: items.map(i => `${i.id}:${i.qty}`).join(','),
      ...(body.note ? { note: body.note.slice(0, 480) } : {}),
    },
    success_url: `${siteUrl}/boutique?commande=succes`,
    cancel_url: `${siteUrl}/boutique?commande=annulee`,
  })

  return {
    statusCode: 200,
    body: JSON.stringify({ url: session.url }),
  }
}
