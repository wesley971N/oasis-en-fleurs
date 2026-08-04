// Pré-rendu SEO SANS navigateur (100 % fiable sur Netlify).
// Après `vite build`, on lit le catalogue produits et on injecte un contenu HTML
// statique (titres, produits, ferme, contact) DANS <div id="root">…</div>.
// React (createRoot) remplace ce contenu par l'app au chargement du JavaScript ;
// mais Google — qui lit le HTML sans exécuter le JS — voit désormais tout le texte.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const indexPath = path.join(ROOT, 'dist', 'index.html')
const productsPath = path.join(ROOT, 'src', 'data', 'products.ts')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const unesc = (s) => s.replace(/\\'/g, "'").replace(/\\"/g, '"')

try {
  let html = fs.readFileSync(indexPath, 'utf8')
  const src = fs.readFileSync(productsPath, 'utf8')

  // Extraire les produits : P(id,'nom','catégorie',prix,'unité','emoji','description'…)
  const re = /P\(\d+,'((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)',([\d.]+),'((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)'/g
  const cats = []
  const byCat = {}
  let m
  while ((m = re.exec(src))) {
    const p = { name: unesc(m[1]), category: unesc(m[2]), price: m[3], unit: unesc(m[4]), desc: unesc(m[6]) }
    if (!byCat[p.category]) { byCat[p.category] = []; cats.push(p.category) }
    byCat[p.category].push(p)
  }
  const total = Object.values(byCat).reduce((n, a) => n + a.length, 0)

  let catalog = ''
  for (const cat of cats) {
    catalog += `<section><h3>${esc(cat)}</h3><ul>`
    for (const p of byCat[cat]) {
      catalog += `<li><strong>${esc(p.name)}</strong> — ${esc(p.desc)} <em>(${esc(p.price)} € · ${esc(p.unit)})</em></li>`
    }
    catalog += `</ul></section>`
  }

  const seo = `<div style="max-width:820px;margin:0 auto;padding:40px 24px;font-family:Georgia,serif;color:#2b2b2b;line-height:1.6">
<h1>Les Naturels de la Source — L'Oasis en Fleurs</h1>
<p>Ferme phytothérapeutique d'Agnès Gilliet à Curciat-Dongalon (01560), en Bresse (Bourgogne). Phytothérapie et aromathérapie artisanales : plantes médicinales, huiles essentielles, hydrolats, macérats de bourgeons (phytembryothérapie), synergies, baumes, savons artisanaux « Mille Bulles », miels de la miellerie, laines et créations. Consultations, soins naturels et stages immersifs à la ferme.</p>
<h2>Boutique &amp; Soins</h2>
${catalog}
<h2>La Ferme</h2>
<p>Sur place : jardin de plantes médicinales cultivé sans engrais chimiques ni pesticides, brebis sardes, chèvres angora et alpagas pour la laine, filature artisanale, miellerie avec six ruches Buckfast sédentaires, et chevaux. Un lieu d'accueil thérapeutique et de ressourcement en pleine nature.</p>
<h2>Les Stages</h2>
<p>Stages immersifs animés par Agnès Gilliet : plantes médicinales, fabrication de savons à froid, fabrication de baumes, initiation au jeûne et randonnées, laver et préparer la laine, cuisine crue et vivante, jardin en permaculture.</p>
<h2>Consultation</h2>
<p>Agnès Gilliet, phyto-aromathérapeute, reçoit en consultation à la ferme ou en visio pour un accompagnement personnalisé par les plantes. Consultation découverte offerte de 15 minutes.</p>
<h2>Contact</h2>
<address>L'Oasis en Fleurs — Agnès Gilliet, 320 chemin des Boulatières, 01560 Curciat-Dongalon, France. Téléphone : 06 64 34 86 87. Email : contact@lesnaturelsdelasource.com</address>
</div>`

  const before = html
  html = html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${seo}</div>`)
  if (html === before) {
    console.warn('⚠ Pré-rendu : balise <div id="root"></div> introuvable, index.html inchangé.')
  } else {
    fs.writeFileSync(indexPath, html, 'utf8')
    console.log(`✓ Pré-rendu SEO injecté — ${total} produits, index.html = ${(html.length / 1024).toFixed(0)} Ko`)
  }
} catch (err) {
  // Non bloquant : le build continue même si le pré-rendu échoue.
  console.warn('⚠ Pré-rendu ignoré (build poursuivi) :', err?.message || err)
}
