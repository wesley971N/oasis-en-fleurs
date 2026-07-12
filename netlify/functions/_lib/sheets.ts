import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

const STOCK_SHEET_TITLE = 'Stock'

interface StockRowData {
  id: string
  nom: string
  stock: string
}

let cachedDoc: GoogleSpreadsheet | null = null

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`)
  return value
}

async function getDoc(): Promise<GoogleSpreadsheet> {
  if (cachedDoc) return cachedDoc

  const sheetId = getEnv('GOOGLE_SHEET_ID')
  const clientEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKey = getEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n')

  const auth = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const doc = new GoogleSpreadsheet(sheetId, auth)
  await doc.loadInfo()
  cachedDoc = doc
  return doc
}

async function getStockSheet() {
  const doc = await getDoc()
  const sheet = doc.sheetsByTitle[STOCK_SHEET_TITLE]
  if (!sheet) throw new Error(`Feuille "${STOCK_SHEET_TITLE}" introuvable dans le Google Sheet (GOOGLE_SHEET_ID)`)
  return sheet
}

export interface CartLine {
  id: number
  qty: number
}

export type StockCheckResult =
  | { ok: true }
  | { ok: false, productId: number, available: number }

// Vérifie que chaque ligne du panier a un stock suffisant. Ne modifie rien.
export async function checkStock(items: CartLine[]): Promise<StockCheckResult> {
  const sheet = await getStockSheet()
  const rows = await sheet.getRows<StockRowData>()

  for (const item of items) {
    const row = rows.find(r => Number(r.get('id')) === item.id)
    const available = row ? Number(row.get('stock')) : 0
    if (!Number.isFinite(available) || available < item.qty) {
      return { ok: false, productId: item.id, available: Number.isFinite(available) ? available : 0 }
    }
  }
  return { ok: true }
}

// Décrémente le stock après un paiement confirmé. À n'appeler qu'une fois le paiement validé par Stripe.
export async function decrementStock(items: CartLine[]): Promise<void> {
  const sheet = await getStockSheet()
  const rows = await sheet.getRows<StockRowData>()

  for (const item of items) {
    const row = rows.find(r => Number(r.get('id')) === item.id)
    if (!row) continue
    const current = Number(row.get('stock'))
    row.set('stock', String(Math.max(0, (Number.isFinite(current) ? current : 0) - item.qty)))
    await row.save()
  }
}
