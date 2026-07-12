import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { PRODUCTS, type Product } from '../../src/data/products'
import { checkStock, type CartLine } from './_lib/sheets'

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`)
  return value
}

// ── Frais de port au poids (grille d'Agnès) ──────────────────────────────────
// Poids estimé d'un produit en grammes (contenu déduit de l'unité + emballage selon la catégorie).
// Estimation volontairement simple : les tranches de port font 1 kg, la précision au gramme n'est pas requise.
function estimateWeightGrams(product: Product): number {
  const unit = product.unit.toLowerCase()
  let content = 0
  const kg = unit.match(/([\d.,]+)\s*kg/)
  const ml = unit.match(/([\d.,]+)\s*ml/)
  const g = unit.match(/([\d.,]+)\s*g(?![a-z])/)
  if (kg) content = parseFloat(kg[1].replace(',', '.')) * 1000
  else if (ml) content = parseFloat(ml[1].replace(',', '.'))   // ~1 g/ml (aqueux/huileux)
  else if (g) content = parseFloat(g[1].replace(',', '.'))

  const packaging: Record<string, number> = {
    'Huiles Essentielles': 45, 'Phytembryothérapie': 70, 'Synergies': 70,
    'Hydrolats': 90, 'Tisanes & Plantes': 15, 'Baumes': 45, 'Savons': 12,
    'Miellerie': unit.includes('pot') ? 220 : 70, 'Laine': 20,
  }
  const pack = packaging[product.category] ?? 40

  if (content === 0) { // unité non chiffrable (créations laine « Pièce unique », « Taille … »)
    if (product.category === 'Laine') {
      if (/pull/i.test(product.name)) content = 400
      else if (/étole|écharpe|châle|chèche/i.test(product.name)) content = 220
      else content = 150
    } else content = 100
  }
  return Math.round(content + pack)
}

// Grille tarifaire au poids total (centimes). À compléter avec Agnès pour > 2 kg.
const SHIPPING_TIERS: { maxGrams: number, cents: number }[] = [
  { maxGrams: 1000, cents: 880 },   // jusqu'à 1 kg → 8,80 €
  { maxGrams: 2000, cents: 1190 },  // de 1 à 2 kg → 11,90 €
]
function shippingCentsForWeight(grams: number): number {
  for (const tier of SHIPPING_TIERS) if (grams <= tier.maxGrams) return tier.cents
  return SHIPPING_TIERS[SHIPPING_TIERS.length - 1].cents // > dernière tranche : on applique la plus haute
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

  // Vérification de stock côté serveur — uniquement si le compte de service Google est configuré.
  // Sinon, on s'appuie sur la protection déjà affichée côté visiteur (badge « Épuisé » lu depuis
  // la feuille publique), et on laisse passer le paiement plutôt que de tout bloquer.
  const stockConfigured = !!(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
  if (stockConfigured) {
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
  }

  // Frais de port calculés au POIDS total du panier (grille d'Agnès). France uniquement.
  const cartWeightGrams = items.reduce((sum, item) => {
    const product = PRODUCTS.find(p => p.id === item.id)!
    return sum + estimateWeightGrams(product) * item.qty
  }, 0)
  const shippingFeeCents = shippingCentsForWeight(cartWeightGrams)

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
        fixed_amount: { amount: shippingFeeCents, currency: 'eur' },
        display_name: 'Livraison France (au poids)',
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
