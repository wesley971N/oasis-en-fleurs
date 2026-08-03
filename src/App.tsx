import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
import agnesPhoto from './assets/agnes.jpg'
import agnesBureauPhoto from './assets/agnes-bureau.jpg'
import fermeHeroPhoto from './assets/ferme-hero.jpg'
import stagesHeroPhoto from './assets/stages-hero.jpg'
import boutiqueHeroPhoto from './assets/boutique-hero.jpg'
import logoNaturels from './assets/logo-naturels-dore.png'
// Photos réelles de la ferme (Agnès Gilliet — Curciat-Dongalon)
import paysagePhoto from './assets/photos/paysage.jpg'
import passiflorePhoto from './assets/photos/passiflore.jpg'
import salicairePhoto from './assets/photos/salicaire.jpg'
import jardinPhoto from './assets/photos/jardin.jpg'
import ombellePhoto from './assets/photos/ombelle.jpg'
import ombelle2Photo from './assets/photos/ombelle2.jpg'
import laineEtagerePhoto from './assets/photos/laine-etagere.jpg'
import rouetPhoto from './assets/photos/rouet.jpg'
import mielPotPhoto from './assets/photos/miel-pot.jpg'
import mielRemplissagePhoto from './assets/photos/miel-remplissage.jpg'
import brebisPhoto from './assets/photos/brebis.jpg'
import chevalBlancPhoto from './assets/photos/cheval-blanc.jpg'
import chevalPhoto from './assets/photos/cheval.jpg'
import flaconMaceratPhoto from './assets/photos/flacon-macerat.jpg'
import hydrolatPhoto from './assets/photos/hydrolat.jpg'
import baumePhoto from './assets/photos/baume.jpg'
import tisanePhoto from './assets/photos/tisane.jpg'
import mielJarPhoto from './assets/photos/miel-jar.jpg'
import savonPhoto from './assets/photos/savon.jpg'
import tricotPhoto from './assets/photos/tricot.jpg'
import sprayPhoto from './assets/photos/spray.jpg'
import { PRODUCTS, type Product } from './data/products'

// ─── Types ───────────────────────────────────────────────────────────────────
interface CartItem extends Product { qty: number }

// ─── Photos réelles de la ferme ──────────────────────────────────────────────
const IMG = {
  // Carrousel plantes
  carousel: [
    { url: passiflorePhoto, label:'Passiflore en fleur' },
    { url: salicairePhoto,  label:'Salicaire des prés' },
    { url: ombelle2Photo,   label:'Ombelles médicinales' },
    { url: jardinPhoto,     label:'Au jardin médicinal' },
    { url: ombellePhoto,    label:'Fleurs de la ferme' },
    { url: paysagePhoto,    label:'Prairies de Bresse' },
  ],
  // Univers produits (ordre : Phyto · Huiles/Hydrolats · Baumes · Savons · Miellerie · Animaux)
  univers: [
    flaconMaceratPhoto,
    hydrolatPhoto,
    baumePhoto,
    savonPhoto,
    mielJarPhoto,
    chevalBlancPhoto,
  ],
  // Produits boutique
  products: [
    flaconMaceratPhoto, hydrolatPhoto, baumePhoto, tisanePhoto,
    savonPhoto, sprayPhoto, mielJarPhoto, laineEtagerePhoto,
    tricotPhoto, rouetPhoto, mielPotPhoto, passiflorePhoto,
    salicairePhoto, jardinPhoto,
  ],
  // Mosaïque ferme
  mosaic: [
    jardinPhoto,       // 0 · Jardin médicinal
    brebisPhoto,       // 1 · Brebis
    mielPotPhoto,      // 2 · Miellerie
    laineEtagerePhoto, // 3 · Laine & Créations
    chevalPhoto,       // 4 · Chevaux
  ],
}

// Photos produits réelles (fond neutre) — associées par id de produit.
// Glob Vite : tout fichier src/assets/photos/products/p<id>.jpg est repris automatiquement,
// sans toucher à data/products.ts (partagé avec les Netlify Functions de paiement).
const PRODUCT_IMAGE_MODULES = import.meta.glob('./assets/photos/products/*.jpg', { eager: true, import: 'default' }) as Record<string, string>
const PRODUCT_IMAGES: Record<number, string> = {}
for (const path in PRODUCT_IMAGE_MODULES) {
  const m = path.match(/p(\d+)\.jpg$/)
  if (m) PRODUCT_IMAGES[Number(m[1])] = PRODUCT_IMAGE_MODULES[path]
}

// Diaporama de la savonnerie Mille Bulles (savons de Dany) — photos détourées sur fond #FAF7F1
const SAVON_MODULES = import.meta.glob('./assets/photos/savonnerie/*.jpg', { eager: true, import: 'default' }) as Record<string, string>
const SAVON_LABELS: Record<string, string> = {
  patchou: 'Patchou', lavandou: 'Lavandou', menthus: 'Menthus', vulcano: 'Vulcano',
  carotin: 'Carotin', 'douceur-miel': 'Douceur Miel', canelange: 'Canélange',
}
const SAVONNERIE_SOAPS = Object.keys(SAVON_LABELS)
  .map(slug => {
    const p = Object.keys(SAVON_MODULES).find(k => k.endsWith(`/${slug}.jpg`))
    return p ? { slug, label: SAVON_LABELS[slug], img: SAVON_MODULES[p] } : null
  })
  .filter(Boolean) as { slug: string, label: string, img: string }[]

// Pelote de mohair (produit #113) — coloris sélectionnables avec photo associée.
const PELOTE_ID = 113
const PELOTE_MODULES = import.meta.glob('./assets/photos/pelote/*.jpg', { eager: true, import: 'default' }) as Record<string, string>
const PELOTE_COLORS = [
  { key:'naturel',  label:'Naturel',  swatch:'#E8E0CE' },
  { key:'rubis',    label:'Rubis',    swatch:'#B01B2E' },
  { key:'bordeaux', label:'Bordeaux', swatch:'#6E1B2A' },
  { key:'potiron',  label:'Potiron',  swatch:'#C4551C' },
  { key:'lagon',    label:'Lagon',    swatch:'#2E9DB0' },
  { key:'emeraude', label:'Émeraude', swatch:'#1D6B5A' },
].map(c => ({ ...c, img: PELOTE_MODULES[`./assets/photos/pelote/${c.key}.jpg`] }))

// Baume calendula : un seul produit en boutique avec un choix de grammage.
// Chaque grammage reste un id réel distinct (prix fiable côté paiement) ; du plus petit au plus grand.
// Produits déclinés en plusieurs formats : une seule fiche en boutique, le format se choisit
// dans le détail. Chaque format garde un id distinct (prix fiable côté paiement).
// Le 1er id de chaque groupe est celui affiché dans la grille.
const VARIANT_GROUPS: number[][] = [
  [92, 136, 94], // Baume calendula : 30 g · 60 g · 100 g
  [79, 137],     // Fluidité articulation : 50 ml · 200 ml
  [139, 138],    // AllergySyn : 30 ml · 50 ml
]
const variantGroupFor = (id: number) => VARIANT_GROUPS.find(g => g.includes(id))
const HIDDEN_VARIANT_IDS = VARIANT_GROUPS.flatMap(g => g.slice(1))

// Lien d'avis Google de la fiche d'établissement (ouvre directement le formulaire d'avis)
const GOOGLE_REVIEW_URL = 'https://g.page/r/CfWaKtYsN4KdEBM/review'

const CATEGORIES = ['Tout', 'Phytembryothérapie', 'Huiles Essentielles', 'Hydrolats', 'Synergies', 'Tisanes & Plantes', 'Baumes', 'Savons', 'Miellerie', 'Créations laines']

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Phytembryothérapie': `La phytoembryothérapie fait partie intégrante de la phytothérapie — à ne pas confondre avec la gemmothérapie, qui appartient à l'homéopathie.

La phytoembryothérapie propose des macérats concentrés en principes actifs, non dilués, pour une utilisation phytothérapeutique. La gemmothérapie, quant à elle, propose des macérats mère dilués 10 fois (1D) pour une utilisation homéopathique. Le macérât glycériné 1D de la gemmothérapie est réalisé avec de l'alcool et de la glycérine, sans eau.

─── Procédé de fabrication — Phytoembryothérapie (méthode Pol Henry) ───

1re étape : Les bourgeons frais sont laissés entiers.

2e étape : Macération 20 jours dans un mélange de 33 % d'eau · 33 % de glycérine végétale (base colza bio) · 33 % d'alcool à 96° (céréales bio). Le mélange est constamment agité lentement.

3e étape : Filtration par gravité — récupération de 12 à 13 kg de filtrat.

4e étape : Extraction par pression douce, pour ne pas lyser les tissus des bourgeons — récupération de 2 à 5 kg d'extrait.

5e étape : Mélange des extraits des étapes 3 et 4 — obtention de 14 à 18 litres de macérât concentré.

─── Procédé de fabrication — Gemmothérapie ───

1re étape : Les bourgeons frais sont broyés (perte de principes actifs).

2e étape : Macération au 1/20ème dans 50 % de glycérine · 50 % d'alcool à 96°, sans eau.

3e étape : Filtration.

4e étape : Extraction par pression importante.

5e étape : Dilution au 1/10ème dans 16 % d'eau · 34 % d'alcool (96°) · 50 % de glycérine.

─── Les solvants utilisés dans la méthode de Pol Henry ───

Chacun de ces trois solvants extrait des principes actifs différents :

L'eau (H₂O) joue un double rôle : transmission énergétique du bourgeon — à laquelle le Dr Pol Henry accordait une grande importance — et extraction des composants hydrosolubles : tanins, sels minéraux, flavonoïdes hydrosolubles, vitamines hydrosolubles, certains acides.

L'alcool (CH₃-CH₂-OH) extrait : alcaloïdes, hétérosides, glycosides.

La glycérine végétale, extraite du colza (teneur en huile de 50 à 68 %), extrait : huiles essentielles (phénols…), flavonoïdes liposolubles, vitamines liposolubles, certains acides.`,
  'Hydrolats': `L'hydrolat est le sous-produit aqueux obtenu après distillation d'une plante : il s'agit de la vapeur d'eau condensée, chargée d'environ 1 à 2 % d'huile essentielle. Bien moins concentrés que les huiles essentielles, les hydrolats sont accessibles à tous, y compris aux enfants et aux personnes fragiles. Ils s'utilisent en cure, avec une action douce mais efficace, sur de longues périodes et sans aucun risque. Composés à 98 % d'eau, ils se prennent principalement par voie orale (1 c. à café dans un verre d'eau pour les enfants, 1 c. à soupe pour les adultes, 2 à 3 fois par jour pendant environ 1 mois), ou en cure minceur (5 c. à soupe dans 1,5 litre d'eau à boire dans la journée). Exemples : hydrolat de livèche, de cataire, de menthe poivrée, de carotte sauvage.`,
  'Baumes': `Les baumes sont élaborés à base de macérés oléiques de fleurs, feuilles et racines récoltées dans des endroits de montagne préservés ou cultivées sans engrais chimiques ni pesticides. Ils contiennent de la cire d'abeilles et des huiles essentielles pour renforcer l'action et les propriétés des plantes. Parmi les plantes utilisées : fleurs de soucis, de plantain, d'arnica, consoude, achillée millefeuille, framboisier, et bien d'autres…`,
  'Huiles Essentielles': `Les huiles essentielles sont obtenues par distillation à la vapeur d'eau des parties aromatiques d'une plante — fleurs, feuilles, écorces, racines ou graines. Extrêmement concentrées, elles contiennent toute l'essence de la plante et agissent en très petites quantités. Leur utilisation demande précaution et connaissance : elles ne conviennent pas à toutes les personnes sans avis préalable (femmes enceintes, jeunes enfants, personnes sous traitement). En aromathérapie, elles s'utilisent diluées dans une huile végétale par voie cutanée, par inhalation, ou pour certaines par voie orale sur recommandation d'un praticien.`,
  'Synergies': `Une synergie est un mélange soigneusement dosé de plusieurs huiles essentielles ou macérâts dont les propriétés se complètent et se renforcent mutuellement. Formulées pour répondre à un objectif précis — détente, immunité, circulation, sommeil… — elles permettent d'obtenir un effet plus ciblé et plus complet qu'une plante seule. Chaque synergie est composée à L'Oasis en Fleurs à partir de plantes rigoureusement sélectionnées, selon les besoins spécifiques rencontrés en consultation.`,
  'Tisanes & Plantes': `Les tisanes sont l'une des formes les plus anciennes et les plus douces d'utilisation des plantes médicinales. Préparées par infusion, décoction ou macération à froid, elles libèrent les principes actifs hydrosolubles de la plante : flavonoïdes, tanins, mucilages… Cultivées sur 2 hectares sans engrais chimiques ni pesticides, les plantes de L'Oasis en Fleurs sont récoltées à maturité, séchées à l'air libre et conditionnées avec soin pour préserver toute leur richesse aromatique et thérapeutique.`,
  'Savons': `Mille Bulles, la savonnerie artisanale des Naturels de la Source.

Nos savons sont réalisés selon le procédé traditionnel de saponification à froid, qui préserve la glycérine naturelle ainsi que les propriétés des huiles végétales. Enrichis de macérâts de plantes médicinales, d'huiles essentielles et de beurres végétaux, ils nourrissent, apaisent et protègent la peau en douceur. Sans conservateur, chaque pain est façonné et découpé à la main.`,
  'Miellerie': `Le miel de L'Oasis en Fleurs est un miel toutes fleurs, récolté auprès des 6 ruches Buckfast sédentaires installées sur la ferme. Les abeilles butinent librement les fleurs sauvages et médicinales du domaine et des prairies de la Bresse, produisant un miel d'une grande richesse aromatique. Non chauffé, il conserve l'ensemble de ses enzymes, pollens et propriétés naturelles. Conditionné directement à la ferme, disponible en pot de 500 g ou au kilo.`,
}

const STAGES = [
  { id: 1, title: 'Stage d\'été — Plantes médicinales', date: '13 au 19 juillet 2026 · Complet', duration: '7 jours', price: 300, places: 7, emoji: '🌿',
    description: 'Une semaine complète autour d\'une vingtaine de plantes médicinales : reconnaissance sur le terrain au fil des saisons, formes galéniques, préparation de macérats hydroalcoolique et oléique, séchage et conditionnement, fabrication d\'un baume et d\'un sirop. Repas de midi compris, hébergement non compris.' },
  { id: 2, title: 'Initiation au jeûne & randonnées', date: 'Dates 2026 à définir', duration: '3 jours', price: 200, places: 10, emoji: '🥾',
    description: 'Trois jours de jeûne accompagné et de randonnées à la découverte des plantes, rythmés par jus de légumes, tisanes et eau. Préparation alimentaire en amont et contre-indications médicales (certificat médical requis). Hébergement possible sur place (60 €/nuit), acompte de 100 € à l\'inscription.' },
  { id: 3, title: 'Fabrication de savons à froid', date: 'Dates 2026 à définir', duration: '1 journée', price: 48, places: 7, emoji: '🧼',
    description: 'Apprenez la saponification à froid et repartez avec vos propres savons artisanaux : choix des huiles, dosage, moulage et règles de sécurité. Minimum 5 participants.' },
  { id: 4, title: 'Fabrication de baumes', date: 'Dates 2026 à définir', duration: '1 journée', price: 48, places: 7, emoji: '🏺',
    description: 'Réalisez vos baumes de soin à partir de macérats de plantes, de cire d\'abeille et d\'huiles essentielles. Minimum 5 participants.' },
  { id: 5, title: 'Laver la laine', date: 'Dates 2026 à définir', duration: '1 journée · 10h–17h', price: 48, places: 7, emoji: '🧶',
    description: 'Le premier geste de la transformation : laver et préparer la toison de brebis, de chèvres angora ou d\'alpaga avant le filage. Journée pratique et manuelle. Minimum 2 participants.' },
  { id: 6, title: 'Cuisine crue & vivante', date: 'Dates 2026 à définir', duration: '1 journée · 9h30–17h', price: 48, places: 7, emoji: '🥗',
    description: 'Une journée pour découvrir la cuisine crue : techniques, associations et recettes, avec un repas préparé et dégusté ensemble sur place.' },
  { id: 7, title: 'Jardin en permaculture', date: 'De mai à septembre 2026', duration: '1 journée', price: 48, places: 7, emoji: '🌱',
    description: 'Au fil de la saison, apprenez à créer et entretenir un jardin en permaculture : lecture du sol, préparation du terrain, semis, récupération d\'eau de pluie, paillage, protection des plants et organisation du potager.' },
]

// ─── SVG Components ──────────────────────────────────────────────────────────
const BotanicSVG = () => (
  <svg viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-h-[420px]">
    {/* Stem */}
    <path d="M200 460 Q195 380 200 300 Q205 220 200 140" stroke="#F5F0E8" strokeWidth="3" strokeLinecap="round"/>
    {/* Large left leaf */}
    <path d="M200 320 Q140 280 100 240 Q120 300 200 320Z" fill="#C9A84C" opacity="0.7"/>
    <path d="M200 320 L100 240" stroke="#F5F0E8" strokeWidth="1" opacity="0.5"/>
    {/* Large right leaf */}
    <path d="M200 280 Q265 245 310 200 Q285 265 200 280Z" fill="#F5F0E8" opacity="0.6"/>
    <path d="M200 280 L310 200" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
    {/* Small left leaf */}
    <path d="M200 230 Q155 200 130 170 Q155 215 200 230Z" fill="#C9A84C" opacity="0.5"/>
    {/* Flower center */}
    <circle cx="200" cy="140" r="22" fill="#C9A84C"/>
    {/* Petals */}
    {[0,45,90,135,180,225,270,315].map((angle, i) => (
      <ellipse key={i} cx={200 + Math.cos(angle * Math.PI/180) * 38} cy={140 + Math.sin(angle * Math.PI/180) * 38}
        rx="14" ry="8" fill="#F5F0E8" opacity="0.8"
        transform={`rotate(${angle} ${200 + Math.cos(angle * Math.PI/180) * 38} ${140 + Math.sin(angle * Math.PI/180) * 38})`}/>
    ))}
    {/* Small roots */}
    <path d="M200 460 Q185 480 170 490" stroke="#F5F0E8" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <path d="M200 460 Q215 475 230 485" stroke="#F5F0E8" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <path d="M200 460 Q200 478 200 490" stroke="#F5F0E8" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    {/* Decorative dots */}
    {[...Array(12)].map((_, i) => (
      <circle key={i} cx={80 + Math.random() * 240} cy={80 + Math.random() * 360}
        r={1 + Math.random() * 2} fill="#C9A84C" opacity={0.3 + Math.random() * 0.3}/>
    ))}
    {/* Frame lines */}
    <rect x="20" y="20" width="360" height="460" stroke="#F5F0E8" strokeWidth="1" opacity="0.2" fill="none"/>
    <rect x="30" y="30" width="340" height="440" stroke="#C9A84C" strokeWidth="0.5" opacity="0.3" fill="none"/>
  </svg>
)

const LeafIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 22C6 22 2 16 2 10 8 4 18 4 22 10 22 16 18 22 12 22Z" fill="#4A6741" opacity="0.8"/>
    <path d="M12 22 L12 8" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// Logo vectoriel "Les Naturels de la Source" — recréé en SVG pour qualité parfaite
const LogoSVG = ({ size = 52 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    {/* Fond carré arrondi teal foncé */}
    <rect width="200" height="200" rx="8" fill="#1C4A3A"/>

    {/* Cercle ornement extérieur */}
    <circle cx="100" cy="88" r="68" fill="none" stroke="#C9A06A" strokeWidth="1.2" opacity="0.5"/>
    {/* Cercle ornement intérieur */}
    <circle cx="100" cy="88" r="62" fill="none" stroke="#C9A06A" strokeWidth="0.7" opacity="0.4"/>

    {/* Petits ornements sur le cercle (points cardinaux) */}
    {[0,45,90,135,180,225,270,315].map((a,i) => (
      <circle key={i}
        cx={100 + Math.cos((a-90)*Math.PI/180)*65}
        cy={88  + Math.sin((a-90)*Math.PI/180)*65}
        r={a%90===0 ? 2.5 : 1.2} fill="#C9A06A" opacity={a%90===0 ? 0.9 : 0.5}/>
    ))}

    {/* ── Arbre de vie ── */}
    {/* Tronc */}
    <path d="M100 148 L100 105" stroke="#C9A06A" strokeWidth="4" strokeLinecap="round"/>
    {/* Racines */}
    <path d="M100 148 Q88 155 78 152" stroke="#C9A06A" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>
    <path d="M100 148 Q112 155 122 152" stroke="#C9A06A" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>
    <path d="M100 148 Q93 158 88 158" stroke="#C9A06A" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
    <path d="M100 148 Q107 158 112 158" stroke="#C9A06A" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>

    {/* Branches principales */}
    <path d="M100 118 Q82 108 68 98"  stroke="#C9A06A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M100 118 Q118 108 132 98" stroke="#C9A06A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M100 110 Q90 96 82 84"   stroke="#C9A06A" strokeWidth="2"   fill="none" strokeLinecap="round"/>
    <path d="M100 110 Q110 96 118 84"  stroke="#C9A06A" strokeWidth="2"   fill="none" strokeLinecap="round"/>
    {/* Branche centrale haute */}
    <path d="M100 108 Q100 92 100 80"  stroke="#C9A06A" strokeWidth="2"   fill="none" strokeLinecap="round"/>

    {/* Branches secondaires gauche */}
    <path d="M68 98 Q58 88 52 80"    stroke="#C9A06A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M68 98 Q64 85 62 76"    stroke="#C9A06A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M82 84 Q76 74 72 66"    stroke="#C9A06A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* Branches secondaires droite */}
    <path d="M132 98 Q142 88 148 80"  stroke="#C9A06A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M132 98 Q136 85 138 76"  stroke="#C9A06A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M118 84 Q124 74 128 66"  stroke="#C9A06A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

    {/* Feuillage — cercles dorés de taille variable */}
    {/* Couronne extérieure */}
    {[
      [52,78,7],[62,74,6],[72,64,7],[82,56,6.5],[100,52,8],[118,56,6.5],
      [128,64,7],[138,74,6],[148,78,7],[56,90,5],[144,90,5],
    ].map(([x,y,r],i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#C9A06A" opacity="0.85"/>
    ))}
    {/* Couronne intérieure */}
    {[
      [72,70,5.5],[84,60,5],[100,55,6],[116,60,5],[128,70,5.5],
      [78,80,4.5],[122,80,4.5],[100,65,5.5],
    ].map(([x,y,r],i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#C9A06A" opacity="0.6"/>
    ))}
    {/* Petits accents */}
    {[
      [90,72,3],[110,72,3],[100,76,3.5],[84,50,3],[116,50,3],
      [66,84,3],[134,84,3],[100,46,4],
    ].map(([x,y,r],i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#C9A06A" opacity="0.45"/>
    ))}

    {/* ── Texte ── */}
    {/* "LES NATURELS" */}
    <text x="100" y="172" textAnchor="middle"
      fontFamily="'Vollkorn', 'Georgia', serif"
      fontSize="14.5" fontWeight="600" letterSpacing="3"
      fill="#C9A06A">LES NATURELS</text>
    {/* Ligne décorative */}
    <line x1="52" y1="177" x2="148" y2="177" stroke="#C9A06A" strokeWidth="0.7" opacity="0.5"/>
    {/* "DE LA SOURCE" */}
    <text x="100" y="188" textAnchor="middle"
      fontFamily="'Barlow', 'Arial', sans-serif"
      fontSize="8" fontWeight="400" letterSpacing="3.5"
      fill="#C9A06A" opacity="0.8">DE LA SOURCE</text>
  </svg>
)

// ─── CountUp ─────────────────────────────────────────────────────────────────
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(to)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasRun.current) {
        hasRun.current = true
        const duration = 1400
        const start = performance.now()
        const tick = (now: number) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(eased * to))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [to])

  return <span ref={ref}>{count}{suffix}</span>
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.fade-up, .fade-left, .fade-right').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  })
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Navbar({ page, setPage, cartCount, onRdv, onOpenCart }: {
  page: string, setPage: (p: string) => void, cartCount: number, onRdv: () => void, onOpenCart: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const navLinks: [string,string][] = [
    ['accueil','Accueil'],['boutique','Boutique & Soins'],['ferme','La Ferme'],
    ['stages','Les Stages'],['consultation','Consultation'],['contact','Nous contacter'],
  ]
  const navigate = (id: string) => { setPage(id); window.scrollTo(0,0); setMenuOpen(false) }

  const CartIcon = ({ color }: { color: string }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  )

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* Logo */}
          <button onClick={() => navigate('accueil')}
            style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:0 }}>
            <div style={{ background:'#fff', borderRadius:14, padding:'8px 16px', display:'flex', alignItems:'center', gap:12,
                boxShadow:'0 2px 14px rgba(0,0,0,0.10)', border:'1px solid rgba(28,74,58,0.12)', transition:'transform 0.3s', flexShrink:0 }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <img src={logoNaturels} alt="Les Naturels de la Source" style={{ height:54, width:'auto', display:'block' }}/>
              <span className="brand-wordmark" style={{ fontFamily:'"Petit Formal Script",cursive', fontSize:18,
                lineHeight:1.1, color:'#1C4A3A', fontWeight:400, whiteSpace:'nowrap' }}>
                Les Naturels de la Source
              </span>
            </div>
          </button>

          {/* Desktop links */}
          <div className="navbar-links-desktop" style={{ display:'flex', alignItems:'center', gap:24 }}>
            {navLinks.map(([id,label]) => (
              <button key={id} onClick={() => navigate(id)}
                style={{ background:'none', border:'none', fontFamily:'Barlow,sans-serif', fontSize:13,
                  fontWeight: page===id ? 600 : 400, letterSpacing:1,
                  color: scrolled ? (page===id ? 'var(--moss)' : 'var(--brown-light)') : 'var(--cream)',
                  borderBottom: page===id ? '1.5px solid var(--gold)' : '1.5px solid transparent',
                  paddingBottom:2, transition:'all 0.2s' }}>
                {label}
              </button>
            ))}
            <button onClick={onOpenCart} style={{ position:'relative', background:'none', border:'none' }}>
              <CartIcon color={scrolled ? 'var(--brown)' : 'var(--cream)'}/>
              {cartCount > 0 && <span key={cartCount} className="cart-badge">{cartCount}</span>}
            </button>
            <button onClick={onRdv} className="btn-primary" style={{ padding:'10px 24px' }}>Prendre RDV</button>
          </div>

          {/* Mobile — panier + hamburger */}
          <div className="navbar-mobile-right" style={{ display:'none', alignItems:'center', gap:12 }}>
            <button onClick={onOpenCart} style={{ position:'relative', background:'none', border:'none' }}>
              <CartIcon color={scrolled ? 'var(--brown)' : 'var(--cream)'}/>
              {cartCount > 0 && <span key={cartCount} className="cart-badge">{cartCount}</span>}
            </button>
            <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu"
              style={{ color: scrolled ? 'var(--brown)' : 'var(--cream)' }}>
              <span style={{ transform: menuOpen ? 'rotate(45deg) translate(4.5px,5px)' : 'none' }}/>
              <span style={{ opacity: menuOpen ? 0 : 1 }}/>
              <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(4.5px,-5px)' : 'none' }}/>
            </button>
          </div>
        </div>
        {/* Barre de progression scroll */}
        <motion.div
          style={{ scaleX, transformOrigin: 'left', background: 'var(--gold)', height: 2, position: 'absolute', bottom: 0, left: 0, right: 0 }}
        />
      </nav>

      {/* Menu mobile plein écran */}
      <div className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
        <button onClick={() => setMenuOpen(false)}
          style={{ position:'absolute', top:24, right:28, background:'none', border:'none', fontSize:32, color:'var(--ink)', lineHeight:1, cursor:'pointer' }}>×</button>
        <div style={{ display:'flex', flexDirection:'column', gap:0, marginBottom:48 }}>
          {navLinks.map(([id,label], i) => (
            <button key={id} onClick={() => navigate(id)}
              className="mobile-nav-link"
              style={{ background:'none', border:'none', textAlign:'left', fontFamily:'Vollkorn,serif',
                fontSize:30, fontWeight:400, color: page===id ? 'var(--forest)' : 'var(--ink)',
                padding:'14px 0', borderBottom:'1px solid oklch(0.42 0.085 150 / 0.10)', cursor:'pointer',
                transitionDelay: menuOpen ? `${i * 0.06 + 0.08}s` : '0s' }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => { onRdv(); setMenuOpen(false) }}
          className="btn-primary" style={{ width:'100%', textAlign:'center', fontSize:13 }}>
          Prendre RDV
        </button>
      </div>
    </>
  )
}

function ToastContainer({ toasts }: { toasts: string[] }) {
  return (
    <div className="toast-container">
      {toasts.map((t, i) => <div key={i} className="toast-item">{t}</div>)}
    </div>
  )
}

// ─── Hero Bandeau avec image de fond ─────────────────────────────────────────
function HeroBanner({ img, tag, title, subtitle, imgPos = 'center' }: {
  img: string, tag: string, title: string, subtitle: string, imgPos?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = imgRef.current
    const wrap = wrapRef.current
    if (!el || !wrap) return
    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { yPercent: -12 },
        {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        }
      )
    }, wrap)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrapRef} style={{ position:'relative', padding:'140px 32px 80px', textAlign:'center', overflow:'hidden' }}>
      <img ref={imgRef} src={img} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'120%', top:'-10%', objectFit:'cover', objectPosition:imgPos }}/>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, rgba(30,20,10,0.42) 0%, rgba(30,20,10,0.10) 75%)' }}/>
      <div style={{ position:'relative', zIndex:1 }}>
        <p style={{ fontFamily:'Barlow,sans-serif', fontSize:12, letterSpacing:3, color:'var(--gold)', textTransform:'uppercase', marginBottom:12, textShadow:'0 1px 10px rgba(0,0,0,0.6)' }}>{tag}</p>
        <h1 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(40px,5vw,70px)', color:'var(--cream)', fontWeight:300, marginBottom:16, textShadow:'0 2px 18px rgba(0,0,0,0.6)' }}>{title}</h1>
        <p style={{ color:'rgba(245,240,232,0.92)', fontSize:16, maxWidth:520, margin:'0 auto', textShadow:'0 1px 12px rgba(0,0,0,0.65)' }}>{subtitle}</p>
      </div>
    </div>
  )
}

// ─── Carrousel de plantes ─────────────────────────────────────────────────────
const HERO_PHOTOS = [
  { url: salicairePhoto,        label:'Salicaire en fleur' },
  { url: paysagePhoto,          label:'Les prairies de la ferme' },
  { url: passiflorePhoto,       label:'Passiflore en fleur' },
  { url: jardinPhoto,           label:'Récolte au jardin médicinal' },
  { url: mielRemplissagePhoto,  label:'Miel de la ferme' },
  { url: chevalBlancPhoto,      label:'Les chevaux de la ferme' },
  { url: laineEtagerePhoto,     label:'Laines filées à la ferme' },
]


const TESTIMONIALS = [
  { name:'Claudia Carvalho', loc:'', stars:5,
    text:'J\'ai consulté Agnès en juin dernier pour un problème de kyste de Bartholin. Grâce à ses conseils — notamment l\'application d\'huile de ricin — j\'ai pu éviter une opération. Son approche naturelle, douce et efficace m\'a beaucoup aidée. J\'apprécie également la qualité des produits qu\'elle propose, en particulier la "Synergie Fleurs", que j\'utilise toujours avec plaisir et confiance. Une professionnelle attentive, bienveillante et compétente que je recommande sincèrement.' },
  { name:'Chany Partage', loc:'', stars:5,
    text:'Je souhaite remercier Agnès pour sa disponibilité. En octobre 2024, je l\'ai consultée pour un problème de santé et elle m\'a bien conseillée. Si son projet aboutit, je pourrai venir prendre des cours de cuisine saine et profiter des activités qu\'elle proposera, j\'imagine, dans la nature.' },
  { name:'Myriam Roillet', loc:'', stars:5,
    text:'Agnès est une bonne praticienne, toujours de bon conseil ! Ses produits sont excellents. Grâce à son baume Hélichryse Italicum, que de bleus guéris et bosses disparues.' },
  { name:'Talia Hope', loc:'', stars:5,
    text:'Agnès sait faire preuve d\'écoute et de professionnalisme. Son accueil chaleureux et le temps qu\'elle consacre à chacun donnent de la valeur et de la qualité à chacune de ses prises en charge.' },
  { name:'Patrick Mabialah', loc:'', stars:5,
    text:'Arrivé sur le domaine de L\'Oasis en Fleurs, bien affaibli par une affection à la gorge, Agnès m\'a concocté une boisson à base d\'huile essentielle. Je suis reparti le lendemain requinqué et bien soulagé.' },
  { name:'Derya', loc:'', stars:5,
    text:'J\'ai commandé deux produits et je suis satisfaite. L\'anti-chute cheveux et le baume anti-âge. Je ne perds plus mes cheveux et ma peau est lisse.' },
]

function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = TESTIMONIALS.length

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setCurrent(c => (c + 1) % total), 5000)
    return () => clearInterval(t)
  }, [paused, total])

  const t = TESTIMONIALS[current]

  return (
    <section style={{ background:'var(--lt-bg)', padding:'100px 32px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
      <div style={{ maxWidth:860, margin:'0 auto', textAlign:'center' }}>
        <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(32px,4vw,50px)', color:'var(--lt-ink)', fontWeight:400, letterSpacing:'-0.02em', marginBottom:60 }}>
          Ce qu'ils en disent
        </h2>

        {/* Carte active */}
        <div style={{ position:'relative', minHeight:260 }}>
          {TESTIMONIALS.map((item, i) => (
            <div key={i} style={{
              position: i === 0 ? 'relative' : 'absolute',
              inset: 0,
              opacity: i === current ? 1 : 0,
              transition: 'opacity 0.7s ease',
              pointerEvents: i === current ? 'auto' : 'none',
            }}>
              {/* Grand guillemet décoratif */}
              <div style={{ fontFamily:'Vollkorn,serif', fontSize:120, color:'var(--primary)', opacity:0.12,
                lineHeight:1, marginBottom:-40, userSelect:'none' }}>"</div>

              <p style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(18px,2.5vw,24px)',
                fontStyle:'italic', lineHeight:1.8, color:'var(--lt-ink)', marginBottom:40, maxWidth:700, margin:'0 auto 40px' }}>
                {item.text}
              </p>

              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <div style={{ display:'flex', gap:2, marginBottom:4 }}>
                  {[...Array(item.stars)].map((_,j)=><span key={j} style={{ color:'var(--primary)', fontSize:14 }}>★</span>)}
                </div>
                <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:14, color:'var(--lt-ink)' }}>{item.name}</p>
                <p style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'var(--lt-ink-muted)' }}>{item.loc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dots + flèches */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, marginTop:48 }}>
          <button onClick={() => setCurrent(c => (c - 1 + total) % total)}
            style={{ background:'none', border:'1.5px solid var(--moss)', color:'var(--moss)',
              width:36, height:36, fontSize:20, display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='var(--moss)'; (e.currentTarget as HTMLElement).style.color='white' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='none'; (e.currentTarget as HTMLElement).style.color='var(--moss)' }}>‹</button>
          <div style={{ display:'flex', gap:8 }}>
            {TESTIMONIALS.map((_,i) => (
              <button key={i} onClick={() => setCurrent(i)}
                style={{ width: i===current ? 24 : 8, height:8,
                  background: i===current ? 'var(--gold)' : 'rgba(74,103,65,0.25)',
                  border:'none', transition:'all 0.4s', borderRadius:4 }}/>
            ))}
          </div>
          <button onClick={() => setCurrent(c => (c + 1) % total)}
            style={{ background:'none', border:'1.5px solid var(--moss)', color:'var(--moss)',
              width:36, height:36, fontSize:20, display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='var(--moss)'; (e.currentTarget as HTMLElement).style.color='white' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='none'; (e.currentTarget as HTMLElement).style.color='var(--moss)' }}>›</button>
        </div>

        {/* Inviter à laisser un avis Google */}
        <div style={{ textAlign:'center', marginTop:44 }}>
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer"
            className="btn-primary" style={{ textDecoration:'none' }}>
            ★ Laisser un avis Google
          </a>
          <p style={{ fontFamily:'Barlow,sans-serif', fontSize:13, color:'var(--lt-ink-muted)', marginTop:14 }}>
            Votre retour aide beaucoup Agnès — merci !
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Accroche animée ─────────────────────────────────────────────────────────
const ACCROCHE = `Les Naturels de la Source est un lieu d'accueil thérapeutique et de ressourcement pour toute personne qui souhaite bénéficier d'un temps en pleine nature, de soins de santé au travers de la phytothérapie et de la relation d'aide, d'une nourriture saine avec des fruits et légumes cultivés sur place sans engrais chimique.`

function AccrocheSection() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const words = el.querySelectorAll<HTMLSpanElement>('.accroche-word')
    const ctx = gsap.context(() => {
      gsap.fromTo(words,
        { opacity: 0, y: 18 },
        {
          opacity: 1, y: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.04,
          scrollTrigger: {
            trigger: el,
            start: 'top 78%',
            toggleActions: 'play none none none',
          },
        }
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} style={{ background:'var(--surface)', padding:'100px 32px' }}>
      <div style={{ maxWidth:860, margin:'0 auto', textAlign:'center' }}>
        <p style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(18px,2.2vw,28px)',
          fontWeight:400, lineHeight:1.8, color:'var(--ink)' }}>
          {ACCROCHE.split(' ').map((word, i) => (
            <span key={i} className="accroche-word" style={{ display:'inline-block', marginRight:'0.28em', opacity:0 }}>
              {word}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}

// ─── Pages ───────────────────────────────────────────────────────────────────
function PageAccueil({ setPage, onRdv }: { setPage: (p:string)=>void, onRdv: ()=>void }) {
  useScrollAnimation()
  const [heroIdx, setHeroIdx] = useState(0)
  const heroContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setHeroIdx(c => (c + 1) % HERO_PHOTOS.length), 4500)
    return () => clearInterval(t)
  }, [])

  // Entrée en scène du héros — stagger GSAP
  useEffect(() => {
    const el = heroContentRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const items = Array.from(el.querySelectorAll('[data-ha]'))
    // Set all to invisible except the line (hidden via scaleX)
    gsap.set([items[0], items[1], items[3], ...items.slice(4)], { opacity: 0 })
    gsap.set(items[2], { scaleX: 0, opacity: 0, transformOrigin: 'left center' })
    const tl = gsap.timeline({ delay: 0.35 })
    tl.fromTo(items[0], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' })
      .fromTo(items[1], { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.25')
      .fromTo(items[2], { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 0.8, duration: 0.45, ease: 'power3.out' }, '-=0.15')
      .fromTo(items[3], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.1')
      .fromTo(items.slice(4), { opacity: 0, y: 8 }, { opacity: 1, y: 0, stagger: 0.12, duration: 0.45, ease: 'power2.out' }, '-=0.15')
    return () => { tl.kill() }
  }, [])

  return (
    <div>
      {/* ── Héros plein-cadre ─────────────────────────────────────────────── */}
      <section className="hero-fullbleed">
        {/* Photos cycliques en fond */}
        {HERO_PHOTOS.map((photo, i) => (
          <div key={i} style={{
            position:'absolute', inset:0,
            opacity: i === heroIdx ? 1 : 0,
            transition: 'opacity 1.6s ease',
            willChange: 'opacity',
          }}>
            <img src={photo.url} alt={photo.label}
              style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}/>
          </div>
        ))}
        {/* Léger dégradé à gauche uniquement (derrière le texte) — les photos restent claires à droite */}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(105deg, oklch(0.10 0.015 65 / 0.55) 0%, oklch(0.10 0.015 65 / 0.22) 40%, transparent 66%)' }}/>

        {/* Contenu texte */}
        <div className="hero-fullbleed-content">
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(24px, 5vw, 80px)', width:'100%' }}>
            <div ref={heroContentRef} style={{ maxWidth:580 }}>
              <p data-ha="tag" style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:4, color:'var(--primary)',
                marginBottom:24, textTransform:'uppercase', fontWeight:500, textShadow:'0 1px 10px rgba(0,0,0,0.6)' }}>
                Phytothérapie Artisanale · Bresse
              </p>
              <h1 data-ha="h1" style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(46px,5.5vw,84px)', fontWeight:400,
                color:'oklch(0.95 0.008 78)', lineHeight:1.05, marginBottom:28, letterSpacing:'-0.02em',
                textShadow:'0 2px 20px rgba(0,0,0,0.55)' }}>
                La nature au<br/><em style={{ fontStyle:'italic' }}>cœur du soin</em>
              </h1>
              <div data-ha="line" style={{ width:36, height:1, background:'var(--primary)', marginBottom:32, opacity:0.8 }}/>
              <p data-ha="para" style={{ fontFamily:'Barlow,sans-serif', color:'oklch(0.93 0.008 78 / 0.72)', fontSize:17,
                lineHeight:1.85, marginBottom:48, maxWidth:440, fontWeight:300, textShadow:'0 1px 12px rgba(0,0,0,0.5)' }}>
                Agnès Gilliet exerce la phytothérapie depuis plus de 20 ans.
                Elle a fondé Les Naturels de la Source il y a 15 ans.
              </p>
              <button data-ha="cta" onClick={() => setPage('boutique')} className="btn-primary">Découvrir la Boutique</button>
              <button data-ha="cta" onClick={onRdv} className="btn-outline" style={{ marginLeft:14, color:'var(--cream)', borderColor:'rgba(245,240,232,0.9)', background:'rgba(255,255,255,0.12)', backdropFilter:'blur(2px)', textShadow:'0 1px 8px rgba(0,0,0,0.5)' }}>Consultation Gratuite</button>
            </div>
          </div>
        </div>

        {/* Indicateurs */}
        <div style={{ position:'absolute', bottom:36, left:'50%', transform:'translateX(-50%)', zIndex:2, display:'flex', gap:6 }}>
          {HERO_PHOTOS.map((_,i) => (
            <button key={i} onClick={() => setHeroIdx(i)}
              style={{ width: i===heroIdx ? 24 : 6, height:6, padding:0,
                background: i===heroIdx ? 'var(--primary)' : 'oklch(0.93 0.008 78 / 0.30)',
                border:'none', borderRadius:3, transition:'all 0.4s' }}/>
          ))}
        </div>
        {/* Légende photo */}
        <p style={{ position:'absolute', bottom:40, right:'clamp(24px, 5vw, 80px)', zIndex:2,
          fontFamily:'Barlow,sans-serif', fontSize:10, letterSpacing:3, textTransform:'uppercase',
          color:'oklch(0.93 0.008 78 / 0.38)', fontStyle:'italic' }}>
          {HERO_PHOTOS[heroIdx].label}
        </p>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section style={{ background:'var(--surface)', padding:'72px 32px', borderBottom:'1px solid oklch(0.93 0.008 78 / 0.05)' }}>
        <div className="resp-stats" style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40, textAlign:'center' }}>
          {[
            { to:20, suffix:'+', label:"ans d'expertise" },
            { to:500, suffix:'+', label:'clients accompagnés' },
            { to:100, suffix:'%', label:'naturel & local' },
          ].map(({ to, suffix, label }, i) => (
            <div key={i} className="fade-up" style={{ transitionDelay:`${i*0.15}s` }}>
              <div className="stat-number"><CountUp to={to} suffix={suffix} /></div>
              <p style={{ fontFamily:'Barlow,sans-serif', fontSize:13, letterSpacing:2, textTransform:'uppercase',
                color:'var(--brown-light)', marginTop:8 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ── Phrase d'accroche ────────────────────────────────────────────── */}
      <AccrocheSection />

      {/* ── Origine de l'enseigne ────────────────────────────────────────── */}
      <section style={{ background:'var(--lt-bg)', padding:'100px 32px' }}>
        <div style={{ maxWidth:720, margin:'0 auto', textAlign:'center' }} className="fade-up">
          <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(26px,3vw,40px)', fontWeight:400,
            color:'var(--ink)', letterSpacing:'-0.02em', marginBottom:40 }}>
            Comment est née cette enseigne ?
          </h2>
          <p style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(16px,1.8vw,22px)', fontWeight:400,
            color:'var(--ink-muted)', lineHeight:1.85, fontStyle:'italic', marginBottom:32 }}>
            Naturels, au pluriel, la nature est tellement vaste, regorge de myriades de beauté,
            forêts, plantes, fleurs, animaux, roches, pierres précieuses, rivières, ruisseaux,
            torrents, cascades, sources d'eau !
          </p>
          <p style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(20px,2.2vw,28px)', fontWeight:500,
            color:'var(--primary)', letterSpacing:'0.04em', marginBottom:32 }}>
            Source !
          </p>
          <p style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(16px,1.8vw,22px)', fontWeight:400,
            color:'var(--ink-muted)', lineHeight:1.85, fontStyle:'italic' }}>
            Ma source à moi, celui qui a créé toutes ces merveilles qu'il met à notre disposition
            à chaque instant de notre vie !
          </p>
          <div style={{ width:48, height:1, background:'var(--primary)', margin:'48px auto 0', opacity:0.6 }}/>
        </div>
      </section>

      {/* ── Portrait Agnès ────────────────────────────────────────────────── */}
      <section style={{ background:'var(--lt-bg)', padding:'100px 32px' }}>
      <div className="resp-portrait" style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
        <div className="fade-left">
          <div style={{ aspectRatio:'1/1', position:'relative', overflow:'hidden', maxWidth:260, margin:'0 auto' }}>
            {/* Photo réelle d'Agnès */}
            <img
              src={agnesPhoto}
              alt="Agnès Gilliet, phyto-aromathérapeute"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 20%',
                display: 'block',
              }}
            />
            {/* Overlay dégradé en bas pour le texte */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(61,46,30,0.85) 0%, rgba(61,46,30,0.3) 45%, transparent 70%)',
            }}/>
            {/* Encadrement doré décoratif */}
            <div style={{
              position: 'absolute', inset: 12,
              border: '1px solid rgba(201,168,76,0.4)',
              pointerEvents: 'none',
            }}/>
            <div style={{
              position: 'absolute', top: 20, right: 20,
              width: 50, height: 50,
              border: '1px solid rgba(201,168,76,0.35)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}/>
            {/* Nom en bas */}
            <div style={{ position:'absolute', bottom:28, left:0, right:0, textAlign:'center' }}>
              <p style={{ fontFamily:'Vollkorn,serif', color:'var(--cream)', fontSize:24, fontWeight:600, marginBottom:4 }}>Agnès Gilliet</p>
              <p style={{ fontFamily:'Barlow,sans-serif', color:'var(--gold)', fontSize:11, letterSpacing:3, textTransform:'uppercase' }}>Phyto-Aromathérapeute</p>
            </div>
          </div>
        </div>
        <div className="fade-right">
          <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(32px,4vw,52px)', fontWeight:400, color:'var(--lt-ink)', lineHeight:1.15, marginBottom:24, letterSpacing:'-0.02em' }}>
            Une passion transmise<br/><em style={{ fontStyle:'italic' }}>de mon héritage</em>
          </h2>
          <div style={{ width:36, height:1, background:'var(--primary)', marginBottom:28, opacity:0.7 }}/>
          <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:300, fontSize:16, lineHeight:1.9, color:'var(--lt-ink-muted)', marginBottom:20 }}>
            Formée en phyto-aromathérapie et diplômée en psychothérapie,
            Agnès exerce depuis plus de 20 ans. Elle a fondé Les Naturels de la Source
            il y a 15 ans, et accompagne
            ses clients avec une approche globale, alliant plantes médicinales
            et écoute thérapeutique.
          </p>
          <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:300, fontSize:16, lineHeight:1.9, color:'var(--lt-ink-muted)', marginBottom:40 }}>
            Sa ferme abrite un jardin médicinal de 2 hectares, une miellerie,
            des brebis à laine et des chevaux.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              'Étude en médecine holistique pendant 12 ans',
              'Diplômée en psychothérapie',
              'Formée en phyto-aromathérapie',
              'Formée en équithérapie',
              'Formée en apithérapie',
            ].map((t,i)=>(
              <div key={i} style={{ display:'flex', gap:14, alignItems:'center' }}>
                <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--primary)', flexShrink:0, opacity:0.8 }}/>
                <span style={{ fontFamily:'Barlow,sans-serif', fontSize:14, color:'var(--lt-ink-muted)', fontWeight:300 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </section>

      {/* ── Univers produits ──────────────────────────────────────────────── */}
      <section style={{ background:'var(--surface)', padding:'100px 32px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(36px,4vw,58px)', color:'var(--ink)', fontWeight:400, letterSpacing:'-0.02em' }}>
              Six univers de bienfaits
            </h2>
          </div>
          <div className="resp-univers" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2 }}>
            {[
              { title:'Phytothérapie', sub:'Tisanes · Alcoolatures · Macérats' },
              { title:'Huiles & Hydrolats', sub:'HE · Macérats huileux · Eaux florales' },
              { title:'Baumes & Synergies', sub:'Roll-on · Baumes · Crèmes' },
              { title:'Savonnerie', sub:'Savons obtenus par saponification à froid' },
              { title:'Miellerie', sub:'Miel toutes fleurs · Cires' },
              { title:'Soins Animaux', sub:'Équins · Canins · Laines' },
            ].map((u: { title: string; sub: string }, i)=>(
              <button key={i} onClick={() => setPage('boutique')}
                className="fade-up"
                style={{ transitionDelay:`${i*0.1}s`, position:'relative', overflow:'hidden',
                  height:220, border:'none', cursor:'pointer', textAlign:'left', padding:0 }}
                onMouseEnter={e => { (e.currentTarget.querySelector('.univ-img') as HTMLElement).style.transform='scale(1.08)' }}
                onMouseLeave={e => { (e.currentTarget.querySelector('.univ-img') as HTMLElement).style.transform='scale(1)' }}>
                {/* Photo de fond */}
                <img className="univ-img" src={IMG.univers[i]} alt={u.title}
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%',
                    objectFit:'cover', transition:'transform 0.6s ease' }}/>
                {/* Overlay sombre dégradé */}
                <div style={{ position:'absolute', inset:0,
                  background:'linear-gradient(to top, rgba(30,20,10,0.85) 0%, rgba(30,20,10,0.35) 60%, transparent 100%)' }}/>
                {/* Texte */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'24px 28px' }}>
                  <h3 style={{ fontFamily:'Vollkorn,serif', color:'oklch(0.95 0.006 78)', fontSize:22, fontWeight:500, marginBottom:4 }}>{u.title}</h3>
                  <p style={{ fontFamily:'Barlow,sans-serif', color:'oklch(0.78 0.010 75)', fontSize:12, fontWeight:300 }}>{u.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {TESTIMONIALS.length > 0 && <TestimonialsCarousel/>}

      {/* ── CTA strip ─────────────────────────────────────────────────────── */}
      <section style={{ background:'oklch(0.50 0.075 150)', padding:'96px 32px', textAlign:'center' }}>
        <div className="fade-up">
          <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(32px,4vw,58px)', color:'var(--cream)', fontWeight:400, letterSpacing:'-0.02em', marginBottom:20 }}>
            Consultation découverte<br/><em style={{ color:'oklch(0.90 0.085 85)', fontWeight:400 }}>offerte — 15 minutes</em>
          </h2>
          <p style={{ fontFamily:'Barlow,sans-serif', color:'rgba(245,240,232,0.88)', fontSize:16, fontWeight:300, maxWidth:580, margin:'0 auto 48px', lineHeight:1.7 }}>
            Partagez vos besoins avec Agnès. Sans engagement, en visio ou en présentiel à la ferme.
          </p>
          <button onClick={onRdv} className="btn-primary" style={{ fontSize:13, letterSpacing:'2px' }}>
            Réserver ma consultation gratuite
          </button>
        </div>
      </section>
    </div>
  )
}

// Carrousel automatique des coloris sur la carte pelote (défile sans clic ; pause au survol)
function PeloteCardCarousel() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIdx(i => (i + 1) % PELOTE_COLORS.length), 1800)
    return () => clearInterval(t)
  }, [paused])
  return (
    <div style={{ position:'absolute', inset:0 }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {PELOTE_COLORS.map((c, i) => (
        <img key={c.key} src={c.img} alt={`Pelote — ${c.label}`} loading="lazy"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
            opacity: i === idx ? 1 : 0, transition:'opacity 0.8s ease' }}/>
      ))}
      <div style={{ position:'absolute', bottom:10, left:10, background:'rgba(28,74,58,0.82)', color:'#F4EDDC',
        fontSize:10, letterSpacing:1, padding:'3px 9px', borderRadius:12, fontFamily:'Barlow,sans-serif' }}>
        {PELOTE_COLORS[idx].label}
      </div>
      <div style={{ position:'absolute', bottom:12, right:10, display:'flex', gap:4 }}>
        {PELOTE_COLORS.map((_, i) => (
          <span key={i} style={{ width:5, height:5, borderRadius:'50%',
            background: i === idx ? 'var(--gold)' : 'rgba(255,255,255,0.55)', transition:'background 0.3s' }}/>
        ))}
      </div>
    </div>
  )
}

// Diaporama des savons artisanaux de la savonnerie Mille Bulles
function SavonnerieCarousel() {
  const soaps = SAVONNERIE_SOAPS
  const n = soaps.length
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduce = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useEffect(() => {
    if (paused || reduce || n <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % n), 3400)
    return () => clearInterval(t)
  }, [paused, reduce, n])
  if (n === 0) return null
  const go = (d: number) => setIdx(i => (i + d + n) % n)
  const cur = soaps[idx]
  const arrow = (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute', top: '50%', [side]: 12, transform: 'translateY(-50%)',
    width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
    background: 'rgba(28,74,58,0.72)', color: '#F4EDDC', fontSize: 20, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(2px)', transition: 'background 0.25s',
  })
  return (
    <div style={{ marginTop: 44 }}>
      <p style={{ fontFamily: 'Barlow,sans-serif', fontSize: 14, fontWeight: 300, color: 'var(--lt-ink-muted)', marginBottom: 18 }}>
        Chaque pain est façonné et découpé à la main. Découvrez quelques-unes de nos créations&nbsp;:
      </p>
      <div
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        style={{
          position: 'relative', width: '100%', height: 'clamp(280px, 44vw, 440px)',
          borderRadius: 18, overflow: 'hidden', background: '#FAF7F1',
          border: '1px solid oklch(0.42 0.085 150 / 0.14)',
        }}>
        <AnimatePresence initial={false}>
          <motion.img
            key={cur.slug} src={cur.img} alt={`Savon ${cur.label}`} loading="lazy"
            initial={reduce ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
            transition={{ duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </AnimatePresence>
        {/* Nom du savon */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'rgba(28,74,58,0.86)', color: '#F4EDDC', padding: '8px 18px',
          borderRadius: 20, fontFamily: 'Vollkorn,serif', fontSize: 18, fontWeight: 500, letterSpacing: 0.3,
        }}>
          {cur.label}
        </div>
        {n > 1 && (
          <>
            <button aria-label="Savon précédent" style={arrow('left')} onClick={() => go(-1)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(28,74,58,0.92)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(28,74,58,0.72)')}>‹</button>
            <button aria-label="Savon suivant" style={arrow('right')} onClick={() => go(1)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(28,74,58,0.92)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(28,74,58,0.72)')}>›</button>
            <div style={{ position: 'absolute', bottom: 20, right: 18, display: 'flex', gap: 6 }}>
              {soaps.map((s, i) => (
                <button key={s.slug} aria-label={`Voir ${s.label}`} onClick={() => setIdx(i)}
                  style={{
                    width: i === idx ? 20 : 8, height: 8, borderRadius: 4, border: 'none', padding: 0, cursor: 'pointer',
                    background: i === idx ? 'var(--gold)' : 'rgba(255,255,255,0.6)', transition: 'width 0.3s, background 0.3s',
                  }}/>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PageBoutique({ cart, setCart, addToast, onOpenCart, onRdv, setPage, initialCategory }: {
  cart: CartItem[], setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
  addToast: (m:string)=>void, onOpenCart: ()=>void, onRdv: ()=>void, setPage: (p:string)=>void, initialCategory?: string
}) {
  useScrollAnimation()
  const [activeCategory, setActiveCategory] = useState(initialCategory || 'Tout')
  const [expandedDesc, setExpandedDesc] = useState(false)
  const [drawerProduct, setDrawerProduct] = useState<Product|null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerQty, setDrawerQty] = useState(1)
  const [peloteColor, setPeloteColor] = useState(0)
  const [peloteAuto, setPeloteAuto] = useState(true)
  const [variantIdx, setVariantIdx] = useState(0)
  const [lightboxImg, setLightboxImg] = useState<string|null>(null)
  const [stock, setStock] = useState<Record<number, number>>({})

  // Lecture des stocks depuis le Google Sheets d'Agnès (colonne "stock", 0 = épuisé).
  // Chargement par balise <script> (JSONP gviz) : fonctionne aussi en fichier local (bundle),
  // là où un fetch classique serait bloqué par la sécurité du navigateur.
  // En cas d'échec (hors-ligne, tableau inaccessible), tous les produits restent disponibles.
  useEffect(() => {
    const SHEET_ID = '1-jK2Hmfm6pOdTcJNDwtZIE4LZXTVqlo7DNrZV23BnOM'
    const cb = '__stockCb_' + Date.now()
    const script = document.createElement('script')
    const cleanup = () => { delete (window as any)[cb]; script.remove() }
    ;(window as any)[cb] = (resp: any) => {
      try {
        const map: Record<number, number> = {}
        for (const row of resp?.table?.rows || []) {
          const pid = Number(row?.c?.[0]?.v)
          const st = Number(row?.c?.[row.c.length - 1]?.v)
          if (Number.isFinite(pid) && Number.isFinite(st)) map[pid] = st
        }
        setStock(map)
      } catch {}
      cleanup()
    }
    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json;responseHandler:${cb}&gid=0&_=${Date.now()}`
    script.onerror = cleanup
    document.body.appendChild(script)
    return cleanup
  }, [])
  const isSoldOut = (id: number) => stock[id] === 0
  // Les savons ne sont pas encore fabriqués : on affiche « En fabrication » plutôt qu'« Épuisé »
  const soldOutLabel = (p: Product) => p.category === 'Savons' ? 'En fabrication' : 'Épuisé'

  useEffect(() => { setExpandedDesc(false) }, [activeCategory])

  // Fermeture de la visionneuse plein écran avec la touche Échap
  useEffect(() => {
    if (!lightboxImg) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxImg(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxImg])

  const filtered = (activeCategory === 'Tout' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory))
    // Baume calendula : on ne montre que la variante représentative (les autres grammages se choisissent dans le détail)
    .filter(p => !HIDDEN_VARIANT_IDS.includes(p.id))
    // Produits avec photo en premier, sans photo ensuite (ordre d'origine conservé dans chaque groupe)
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (PRODUCT_IMAGES[b.p.id] ? 1 : 0) - (PRODUCT_IMAGES[a.p.id] ? 1 : 0) || a.i - b.i)
    .map(x => x.p)

  const addToCart = useCallback((product: Product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id===product.id ? {...i,qty:i.qty+qty} : i)
      return [...prev, {...product,qty}]
    })
    addToast(`✓ ${product.name} ajouté au panier`)
  }, [setCart, addToast])

  const openDrawer = (p: Product) => { setDrawerProduct(p); setDrawerQty(1); setPeloteColor(0); setPeloteAuto(true); setVariantIdx(0); setDrawerOpen(true) }
  const isPelote = !!drawerProduct && drawerProduct.id === PELOTE_ID
  const drawerImg = drawerProduct ? (isPelote ? PELOTE_COLORS[peloteColor].img : PRODUCT_IMAGES[drawerProduct.id]) : undefined

  // Défilement automatique des coloris de la pelote dans le détail, tant qu'on n'a pas choisi une couleur
  useEffect(() => {
    if (!drawerOpen || !isPelote || !peloteAuto) return
    const t = setInterval(() => setPeloteColor(c => (c + 1) % PELOTE_COLORS.length), 1900)
    return () => clearInterval(t)
  }, [drawerOpen, isPelote, peloteAuto])

  // Produits à formats multiples : le produit "à acheter" suit le format sélectionné
  // (prix/unité + ajout au panier), tandis que le reste du détail (nom, description, ingrédients) reste unifié.
  const variantGroup = drawerProduct ? variantGroupFor(drawerProduct.id) : undefined
  const productVariants = (variantGroup ?? []).map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean) as Product[]
  const buyProduct = ((productVariants.length ? productVariants[variantIdx] : drawerProduct) || drawerProduct) as Product

  const cartTotal = cart.reduce((s,i) => s+i.price*i.qty, 0)
  const cartCount = cart.reduce((s,i) => s+i.qty, 0)

  return (
    <div>
      <HeroBanner
        img={boutiqueHeroPhoto}
        tag="Boutique Artisanale"
        title="Boutique & Soins"
        subtitle="Préparations artisanales issues de notre ferme. Chaque produit est formulé, fabriqué et conditionné par Agnès à la ferme."
      />

      {/* Filter bar */}
      <div className="filter-bar">
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 32px', display:'flex', gap:8, overflowX:'auto' }}>
          {CATEGORIES.map(c => (
            <button key={c} className={`filter-tab ${activeCategory===c?'active':''}`}
              onClick={() => { setActiveCategory(c); setExpandedDesc(false) }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {activeCategory !== 'Tout' && CATEGORY_DESCRIPTIONS[activeCategory] && (() => {
        const full = CATEGORY_DESCRIPTIONS[activeCategory]
        const dotIdx = full.indexOf('. ')
        const accroche = dotIdx > -1 ? full.slice(0, dotIdx + 1) : full
        const rest = dotIdx > -1 ? full.slice(dotIdx + 2) : ''
        const emojis: Record<string,string> = {
          'Phytembryothérapie':'🌱','Huiles Essentielles':'💧','Hydrolats':'🫧',
          'Synergies':'✨','Tisanes & Plantes':'🌿','Baumes':'🏺','Savons':'🧼','Miellerie':'🍯'
        }
        const emoji = emojis[activeCategory] || '🌿'
        // « Mille Bulles » et « Naturels de la Source » en écriture manuscrite (équivalent Monotype Corsiva)
        const scriptWords = (text: string): React.ReactNode =>
          text.split(/(Mille Bulles|Naturels de la Source)/g).map((part, i) =>
            part === 'Mille Bulles' || part === 'Naturels de la Source'
              ? <span key={i} style={{ fontFamily:'"Petit Formal Script",cursive', fontStyle:'normal' }}>{part}</span>
              : part
          )
        return (
          <div style={{ background:'var(--surface-raised)', borderTop:`1px solid oklch(0.42 0.085 150 / 0.12)`, borderBottom:`1px solid oklch(0.42 0.085 150 / 0.12)` }}>
            <div style={{ maxWidth:860, margin:'0 auto', padding:'56px 32px' }}>
              <p style={{ fontFamily:'Barlow,sans-serif', fontSize:10, letterSpacing:2.5, textTransform:'uppercase', color:'var(--forest)', fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20 }}>{emoji}</span>
                <span>{activeCategory}</span>
              </p>
              <p style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(22px,2.6vw,30px)', fontStyle:'italic', fontWeight:400, color:'var(--ink)', lineHeight:1.7, marginBottom: rest ? 28 : 0 }}>
                {scriptWords(accroche)}
              </p>
              {rest && (
                <>
                  <button onClick={() => setExpandedDesc(o => !o)}
                    style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none',
                      fontFamily:'Barlow,sans-serif', fontSize:12, fontWeight:600, letterSpacing:1.5,
                      textTransform:'uppercase', color:'var(--forest)', cursor:'pointer', marginTop:4, padding:0 }}>
                    <span>{expandedDesc ? 'Réduire' : 'En savoir plus'}</span>
                    <span style={{ fontSize:16, transition:'transform 0.3s', display:'inline-block',
                      transform: expandedDesc ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </button>
                  <div style={{ overflow:'hidden', maxHeight: expandedDesc ? '600px' : '0',
                    transition:'max-height 0.5s cubic-bezier(0.16,1,0.3,1)', opacity: expandedDesc ? 1 : 0,
                    transitionProperty:'max-height, opacity' }}>
                    <div style={{ width:36, height:2, background:'var(--primary)', margin:'24px 0', opacity:0.7 }}/>
                    <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:300, fontSize:18, lineHeight:1.95, color:'var(--lt-ink-muted)' }}>
                      {scriptWords(rest)}
                    </p>
                  </div>
                </>
              )}
              {activeCategory === 'Savons' && <SavonnerieCarousel/>}
            </div>
          </div>
        )
      })()}

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'48px 32px' }}>
        {/* Product grid */}
        <div className="product-grid">
          {filtered.map((p, i) => (
            <div key={p.id} className="product-card fade-up" style={{ transitionDelay:`${(i%4)*0.1}s` }}>
              {/* Image area */}
              <div style={{ background: i%3===0?'var(--moss)':i%3===1?'var(--brown)':'#6b5a3e',
                height:180, display:'flex', alignItems:'center', justifyContent:'center',
                position:'relative', cursor:'pointer', overflow:'hidden' }}
                onClick={() => openDrawer(p)}>
                {p.id === PELOTE_ID
                  ? <PeloteCardCarousel/>
                  : PRODUCT_IMAGES[p.id]
                  ? <img src={PRODUCT_IMAGES[p.id]} alt={p.name} loading="lazy"
                      style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <span style={{ fontSize:56 }}>{p.emoji}</span>}
                {p.badge && !isSoldOut(p.id) && (
                  <div style={{ position:'absolute', top:12, left:12, background:'var(--gold)',
                    color:'var(--brown)', padding:'3px 10px', fontSize:10, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>
                    {p.badge}
                  </div>
                )}
                {isSoldOut(p.id) && (
                  <div style={{ position:'absolute', inset:0, background:'oklch(0.25 0.02 150 / 0.5)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ background:'var(--brown)', color:'white', padding:'6px 16px',
                      fontFamily:'Barlow,sans-serif', fontSize:12, fontWeight:700, letterSpacing:2, textTransform:'uppercase', whiteSpace:'nowrap' }}>
                      {soldOutLabel(p)}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ padding:'20px 20px 16px' }}>
                <p style={{ fontFamily:'Barlow,sans-serif', fontSize:10, letterSpacing:2, color:'var(--gold)',
                  textTransform:'uppercase', marginBottom:6 }}>{p.category}</p>
                <h3 style={{ fontFamily:'Vollkorn,serif', fontSize:20, fontWeight:500,
                  color:'var(--brown)', marginBottom:8, lineHeight:1.3 }}
                  onClick={() => openDrawer(p)} className="cursor-pointer">{p.name}</h3>
                <p style={{ fontSize:13, color:'var(--brown-light)', marginBottom:16, lineHeight:1.6 }}>
                  {p.description.slice(0,80)}…
                </p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <span style={{ fontFamily:'Vollkorn,serif', fontSize:24, fontWeight:600, color:'var(--brown)' }}>
                      {p.price}€
                    </span>
                    <span style={{ fontSize:12, color:'var(--brown-light)', marginLeft:4 }}>{p.unit}</span>
                  </div>
                  <button onClick={() => addToCart(p)} disabled={isSoldOut(p.id)}
                    style={{ width:36, height:36, background: isSoldOut(p.id)?'var(--brown-light)':'var(--moss)',
                      border:'none', color:'white', fontSize:22, display:'flex', alignItems:'center',
                      justifyContent:'center', borderRadius:10, transition:'all 0.2s',
                      cursor: isSoldOut(p.id)?'not-allowed':'pointer', opacity: isSoldOut(p.id)?0.5:1 }}
                    onMouseEnter={e=>{ if(!isSoldOut(p.id)) (e.target as HTMLElement).style.background='var(--moss-light)' }}
                    onMouseLeave={e=>{ if(!isSoldOut(p.id)) (e.target as HTMLElement).style.background='var(--moss)' }}>
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lien vers consultation */}
        <div style={{ textAlign:'center', marginTop:80, paddingBottom:20 }}>
          <button onClick={() => setPage('consultation')}
            style={{ background:'none', border:'none', fontFamily:'Barlow,sans-serif', fontSize:14,
              color:'var(--moss)', letterSpacing:0.5, textDecoration:'underline', textUnderlineOffset:5,
              cursor:'pointer', transition:'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color='var(--gold)')}
            onMouseLeave={e => (e.currentTarget.style.color='var(--moss)')}>
            Plus d'informations sur les consultations →
          </button>
        </div>

        {/* Bouton panier flottant */}
        {cartCount > 0 && (
          <button onClick={() => onOpenCart()}
            style={{ position:'fixed', bottom:32, right:32, background:'var(--forest-dark)', color:'var(--cream)',
              border:'none', padding:'16px 24px', boxShadow:'0 16px 48px rgba(61,46,30,0.35)',
              zIndex:200, display:'flex', alignItems:'center', gap:16, transition:'all 0.3s' }}
            onMouseEnter={e => (e.currentTarget.style.background='var(--moss)')}
            onMouseLeave={e => (e.currentTarget.style.background='var(--brown)')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, opacity:0.7, marginBottom:2 }}>
                {cartCount} article{cartCount>1?'s':''}
              </p>
              <p style={{ fontFamily:'Vollkorn,serif', fontSize:20, fontWeight:600 }}>{cartTotal}€</p>
            </div>
            <span style={{ fontFamily:'Barlow,sans-serif', fontSize:12, fontWeight:600, letterSpacing:1,
              textTransform:'uppercase', borderLeft:'1px solid rgba(245,240,232,0.3)', paddingLeft:16 }}>
              Voir →
            </span>
          </button>
        )}
      </div>

      {/* Drawer */}
      {/* Visionneuse plein écran — affiche la photo produit entière */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={() => setLightboxImg(null)}
            style={{ position:'fixed', inset:0, zIndex:100000, background:'rgba(20,14,8,0.93)',
              display:'flex', alignItems:'center', justifyContent:'center', padding:'4vh 4vw', cursor:'zoom-out' }}>
            <motion.img src={lightboxImg} alt="Aperçu du produit"
              initial={{ scale: 0.94 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22,1,0.36,1] }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain',
                boxShadow:'0 24px 70px rgba(0,0,0,0.55)', cursor:'default' }}/>
            <button onClick={() => setLightboxImg(null)} aria-label="Fermer l'aperçu"
              style={{ position:'absolute', top:24, right:28, background:'rgba(255,255,255,0.14)', color:'#fff',
                border:'none', width:44, height:44, fontSize:26, borderRadius:'50%', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`drawer-overlay ${drawerOpen?'open':''}`} onClick={() => setDrawerOpen(false)}/>
      <div className={`drawer-panel ${drawerOpen?'open':''}`}>
        {drawerProduct && (
          <div>
            <div style={{ background: drawerImg ? '#EDE6D6' : (PRODUCTS.indexOf(drawerProduct)%3===0?'var(--moss)':'var(--brown)'),
              height:200, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
              {drawerImg
                ? <img src={drawerImg} alt={drawerProduct.name}
                    onClick={() => drawerImg && setLightboxImg(drawerImg)}
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', cursor:'zoom-in' }}/>
                : <span style={{ fontSize:80 }}>{drawerProduct.emoji}</span>}
              {drawerImg && (
                <button onClick={() => drawerImg && setLightboxImg(drawerImg)}
                  style={{ position:'absolute', bottom:12, left:12, background:'rgba(28,74,58,0.85)', color:'#F4EDDC',
                    border:'none', padding:'6px 13px', fontSize:11.5, letterSpacing:0.4, borderRadius:20, cursor:'zoom-in',
                    display:'flex', alignItems:'center', gap:6, fontFamily:'Barlow,sans-serif' }}>
                  <span style={{ fontSize:14 }}>⤢</span> Voir la photo en grand
                </button>
              )}
              <button onClick={()=>setDrawerOpen(false)}
                style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.2)',
                  border:'none', color:'white', width:36, height:36, fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>
                ×
              </button>
            </div>
            <div style={{ padding:'32px 32px 120px' }}>
              <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:2, color:'var(--gold)',
                textTransform:'uppercase', marginBottom:8 }}>{drawerProduct.category}</p>
              <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:30, fontWeight:500, color:'var(--brown)', marginBottom:8 }}>
                {drawerProduct.name}
              </h2>
              <p style={{ fontFamily:'Vollkorn,serif', fontSize:28, fontWeight:300, color:'var(--moss)', marginBottom:24 }}>
                {buyProduct.price}€ <span style={{ fontSize:14, color:'var(--brown-light)' }}>{buyProduct.unit}</span>
              </p>
              {productVariants.length > 1 && (
                <div style={{ marginBottom:26 }}>
                  <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:12, letterSpacing:1.5, textTransform:'uppercase', color:'var(--brown)', marginBottom:12 }}>
                    {productVariants.some(v => /ml/i.test(v.unit)) ? 'Contenance' : 'Grammage'}
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
                    {productVariants.map((v, i) => {
                      const active = i === variantIdx
                      return (
                        <button key={v.id} onClick={() => setVariantIdx(i)}
                          style={{ padding:'10px 18px', cursor:'pointer', fontFamily:'Barlow,sans-serif', fontSize:14, fontWeight:600,
                            color: active ? 'white' : 'var(--brown)', background: active ? 'var(--moss)' : 'transparent',
                            border: `1.5px solid ${active ? 'var(--moss)' : 'var(--brown-light)'}`, borderRadius:8, transition:'all 0.15s' }}>
                          {v.unit} — {v.price}€
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {isPelote && (
                <div style={{ marginBottom:26 }}>
                  <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:12, letterSpacing:1.5, textTransform:'uppercase', color:'var(--brown)', marginBottom:12 }}>
                    Coloris : <span style={{ color:'var(--moss)', textTransform:'none', letterSpacing:0, fontWeight:500 }}>{PELOTE_COLORS[peloteColor].label}</span>
                  </p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:11 }}>
                    {PELOTE_COLORS.map((c, i) => (
                      <button key={c.key} onClick={() => { setPeloteColor(i); setPeloteAuto(false) }} aria-label={c.label} title={c.label}
                        style={{ width:34, height:34, borderRadius:'50%', background:c.swatch, cursor:'pointer', padding:0,
                          outline: i===peloteColor ? '2px solid var(--moss)' : 'none', outlineOffset:2,
                          border:'2px solid rgba(255,255,255,0.85)', boxShadow:'0 1px 4px rgba(0,0,0,0.18)', transition:'transform 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.transform='scale(1.12)')}
                        onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}/>
                    ))}
                  </div>
                </div>
              )}
              {(() => {
                const isNotABenefit = (s: string) =>
                  /^(Macérât|Macérat|Extrait\s+sans|À\s+appliquer|Application\s+externe|Huile\s+essentielle|Boswellia|CT\s+)/i.test(s) ||
                  /concentré\s+en\s+flacon|en\s+flacon\s+verre|100%\s+pure\s+et\s+naturelle|Usage\s+externe\s+uniquement|de\s+référence|essentielle\s+puissante|Savon\s+artisanal\s+Mille-Bulles|Mille\s+Bulles|savonnerie\s+artisanale|par\s+Les\s+Naturels\s+de\s+la\s+Source|Distillation\s+par\s+vapeur|sans\s+conservateur/i.test(s)
                const benefits = drawerProduct.benefits.length > 0
                  ? drawerProduct.benefits
                  : drawerProduct.description.split(/\.\s+/).map(s => s.replace(/\.$/, '').trim()).filter(s => s && !isNotABenefit(s))
                const sections: [string, string[]][] = []
                if (drawerProduct.ingredients.length > 0) sections.push(['Ingrédients', drawerProduct.ingredients])
                if (benefits.length > 0) sections.push(['Bienfaits', benefits])
                return sections.map(([label, items]) => (
                  <div key={label} style={{ marginBottom:24 }}>
                    <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:12, letterSpacing:1.5,
                      textTransform:'uppercase', color:'var(--brown)', marginBottom:10 }}>{label}</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {items.map(it => (
                        <div key={it} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                          <span style={{ color:'var(--moss)', flexShrink:0, marginTop:1 }}>✦</span>
                          <span style={{ fontSize:13, color:'var(--brown-light)', lineHeight:1.6 }}>{it}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              })()}

              {drawerProduct.usage && (
                <div style={{ marginBottom:32 }}>
                  <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:12, letterSpacing:1.5,
                    textTransform:'uppercase', color:'var(--brown)', marginBottom:10 }}>Mode d'utilisation</p>
                  <p style={{ fontSize:14, lineHeight:1.8, color:'var(--brown-light)', background:'var(--cream-dark)', padding:16 }}>
                    {drawerProduct.usage}
                  </p>
                </div>
              )}

              {drawerProduct.category === 'Huiles Essentielles' && (
                <div style={{ marginBottom:32 }}>
                  <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:12, letterSpacing:1.5,
                    textTransform:'uppercase', color:'var(--brown)', marginBottom:10 }}>Conditionnement</p>
                  <p style={{ fontSize:14, lineHeight:1.8, color:'var(--brown-light)' }}>
                    Flacon verre ambré de {drawerProduct.unit.replace(/(\d)\s*ml/i, '$1 ml')}
                  </p>
                </div>
              )}

              {isSoldOut(buyProduct.id) ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:16,
                  padding:'16px', background:'var(--cream-dark)', border:'1px solid var(--brown-light)' }}>
                  <span style={{ fontFamily:'Barlow,sans-serif', fontWeight:700, fontSize:13, letterSpacing:2,
                    textTransform:'uppercase', color:'var(--brown)' }}>{buyProduct.category === 'Savons' ? 'En fabrication — bientôt disponible' : 'Épuisé — bientôt de retour'}</span>
                </div>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                    <button className="qty-btn" onClick={()=>setDrawerQty(q=>Math.max(1,q-1))}>−</button>
                    <span style={{ width:44, textAlign:'center', fontFamily:'Vollkorn,serif', fontSize:20 }}>{drawerQty}</span>
                    <button className="qty-btn" onClick={()=>setDrawerQty(q=>q+1)}>+</button>
                  </div>
                  <button className="btn-moss" style={{ flex:1, textAlign:'center' }}
                    onClick={() => { addToCart(buyProduct, drawerQty); setDrawerOpen(false) }}>
                    Ajouter au panier — {buyProduct.price * drawerQty}€
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PageContact({ addToast, setPage }: { addToast: (m:string)=>void, setPage:(p:string)=>void }) {
  useScrollAnimation()
  const [form, setForm] = useState({ nom:'', email:'', message:'' })
  const [sent, setSent] = useState(false)

  const handleSubmit = () => {
    if (!form.nom || !form.email || !form.message) return
    setSent(true)
    addToast('✓ Message envoyé ! Agnès vous répondra sous 48h.')
    setForm({ nom:'', email:'', message:'' })
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <div>
      <HeroBanner
        img="https://images.pexels.com/photos/5480236/pexels-photo-5480236.jpeg?auto=compress&cs=tinysrgb&w=1400"
        tag="Une question ? Un renseignement ?"
        title="Nous contacter"
        subtitle="Agnès répond à tous les messages personnellement, sous 48h."
      />

      <section className="resp-contact" style={{ padding:'80px 32px', maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr 1.4fr', gap:48, alignItems:'start' }}>

        {/* ── Carte (1re colonne) ────────────────────────────────────────── */}
        <div className="fade-left">
          <h3 style={{ fontFamily:'Vollkorn,serif', fontSize:22, color:'var(--lt-ink)', fontWeight:400,
            letterSpacing:'-0.01em', marginBottom:20 }}>
            Nous trouver
          </h3>
          <div style={{ position:'relative', width:'100%', paddingBottom:'100%', overflow:'hidden' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2747.4687263675482!2d5.176860176927791!3d46.47903037110881!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47f330ac675147df%3A0x70dd4ea070c95c5e!2s320%20Les%20Boulati%C3%A8res%2C%2001560%20Curciat-Dongalon!5e0!3m2!1sfr!2sfr!4v1781185694809!5m2!1sfr!2sfr"
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }}
              allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'var(--lt-ink-muted)',
            marginTop:12, fontWeight:300, lineHeight:1.6 }}>
            320 chemin des Boulatières<br/>01560 Curciat-Dongalon
          </p>
        </div>

        {/* Infos */}
        <div className="fade-left">
          <h2 style={{ fontFamily:'"Petit Formal Script",cursive', fontSize:44, color:'var(--lt-ink)', fontWeight:400, letterSpacing:'0.01em', marginBottom:32 }}>
            Les Naturels de la Source
          </h2>

          {([
            { icon:'📍', label:'Adresse', value:'320 chemin des Boulatières\n01560 Curciat-Dongalon' },
            { icon:'📞', label:'Téléphone', value:'06 64 34 86 87' },
            { icon:'✉️', label:'Email', value:'contact@lesnaturelsdelasource.com' },
            { icon:'📘', label:'Facebook', value:'facebook.com/agnes.gilliet', link:'https://www.facebook.com/agnes.gilliet' },
            { icon:'🕐', label:'Horaires', value:'Lun–Jeu : 9h–18h\nVendredi : 9h–12h' },
          ] as Array<{ icon:string; label:string; value:string; link?:string }>).map(({ icon, label, value, link }) => (
            <div key={label} style={{ display:'flex', gap:16, marginBottom:28, alignItems:'flex-start' }}>
              <span style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{icon}</span>
              <div>
                <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5, textTransform:'uppercase',
                  color:'var(--gold)', marginBottom:4 }}>{label}</p>
                {link
                  ? <a href={link} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:15, color:'var(--moss)', lineHeight:1.7, textDecoration:'underline', textUnderlineOffset:3 }}>{value}</a>
                  : <p style={{ fontSize:15, color:'var(--brown-light)', lineHeight:1.7, whiteSpace:'pre-line' }}>{value}</p>}
              </div>
            </div>
          ))}

          {/* Séparateur */}
          <div style={{ width:60, height:1, background:'var(--gold)', margin:'32px 0' }}/>

          <p style={{ fontFamily:'Vollkorn,serif', fontStyle:'italic', fontSize:17, color:'var(--brown-light)', lineHeight:1.8 }}>
            "Chaque question mérite une réponse attentive. N'hésitez pas à me contacter pour tout renseignement sur les plantes, les soins ou les stages."
          </p>
          <p style={{ fontFamily:'Barlow,sans-serif', fontSize:12, letterSpacing:1, color:'var(--gold)', marginTop:12 }}>— Agnès Gilliet</p>
        </div>

        {/* Formulaire */}
        <div className="fade-right">
          {sent ? (
            <div style={{ paddingTop:40 }}>
              <div style={{ width:32, height:1, background:'var(--forest)', marginBottom:28 }}/>
              <p style={{ fontFamily:'Vollkorn,serif', fontStyle:'italic', fontSize:22,
                color:'var(--lt-ink)', lineHeight:1.6, marginBottom:12 }}>
                Message bien reçu.
              </p>
              <p style={{ fontFamily:'Barlow,sans-serif', fontSize:14, color:'var(--lt-ink-muted)', fontWeight:300 }}>
                Agnès vous répondra personnellement sous 48h.
              </p>
            </div>
          ) : (
            <>
              {[
                { field:'nom', label:'Nom', type:'text' },
                { field:'email', label:'Email', type:'email' },
              ].map(({ field, label, type }) => (
                <div key={field} style={{ marginBottom:32 }}>
                  <label style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5,
                    textTransform:'uppercase', color:'var(--lt-ink-muted)', display:'block', marginBottom:10 }}>
                    {label}
                  </label>
                  <input type={type} value={(form as any)[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    style={{ width:'100%', background:'transparent', border:'none',
                      borderBottom:'1px solid oklch(0.42 0.085 150 / 0.25)',
                      padding:'8px 0', fontSize:15, color:'var(--lt-ink)', outline:'none',
                      boxSizing:'border-box', transition:'border-color 0.2s', fontFamily:'Barlow,sans-serif' }}
                    onFocus={e => (e.target.style.borderBottomColor='var(--forest)')}
                    onBlur={e => (e.target.style.borderBottomColor='oklch(0.42 0.085 150 / 0.25)')}/>
                </div>
              ))}

              <div style={{ marginBottom:40 }}>
                <label style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5,
                  textTransform:'uppercase', color:'var(--lt-ink-muted)', display:'block', marginBottom:10 }}>
                  Message
                </label>
                <textarea value={form.message} rows={5}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Votre question ou demande…"
                  style={{ width:'100%', background:'transparent', border:'none',
                    borderBottom:'1px solid oklch(0.42 0.085 150 / 0.25)',
                    padding:'8px 0', fontSize:14, color:'var(--lt-ink)', outline:'none',
                    resize:'none', boxSizing:'border-box', lineHeight:1.8,
                    transition:'border-color 0.2s', fontFamily:'Barlow,sans-serif', fontWeight:300 }}
                  onFocus={e => (e.target.style.borderBottomColor='var(--forest)')}
                  onBlur={e => (e.target.style.borderBottomColor='oklch(0.42 0.085 150 / 0.25)')}/>
              </div>

              <p style={{ fontSize:12, color:'var(--lt-ink-muted)', lineHeight:1.6, marginBottom:16 }}>
                Vos données sont utilisées uniquement pour répondre à votre demande.{' '}
                <button onClick={() => setPage('mentions')}
                  style={{ background:'none', border:'none', padding:0, font:'inherit',
                    color:'var(--forest)', textDecoration:'underline', cursor:'pointer' }}>
                  En savoir plus
                </button>.
              </p>

              <button className="btn-moss" style={{ fontSize:12, letterSpacing:'1.5px' }}
                onClick={handleSubmit}>
                Envoyer
              </button>
            </>
          )}
        </div>

      </section>
    </div>
  )
}

function PageConsultation({ onRdv }: { onRdv: ()=>void }) {
  useScrollAnimation()
  return (
    <div>
      <HeroBanner
        img="https://images.pexels.com/photos/5480036/pexels-photo-5480036.jpeg?auto=compress&cs=tinysrgb&w=1400"
        tag="Accompagnement personnalisé"
        title="Consultation"
        subtitle="Agnès vous accompagne avec une approche holistique et personnalisée, en phytothérapie et aromathérapie clinique."
      />
      {/* Agnès vous accueille */}
      <section style={{ padding:'72px 32px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap:'clamp(28px,4vw,56px)', alignItems:'center' }}>
          <div className="fade-up">
            <img src={agnesBureauPhoto} alt="Agnès dans son bureau de consultation, à la ferme"
              style={{ width:'100%', borderRadius:16, display:'block', boxShadow:'0 22px 55px rgba(28,74,58,0.18)' }}/>
          </div>
          <div className="fade-up" style={{ transitionDelay:'0.1s' }}>
            <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:2.5, textTransform:'uppercase', color:'var(--gold)', fontWeight:600, marginBottom:16 }}>
              Bienvenue
            </p>
            <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(30px,4vw,46px)', color:'var(--lt-ink)', fontWeight:400, letterSpacing:'-0.02em', lineHeight:1.15, marginBottom:22 }}>
              Agnès vous accueille
            </h2>
            <p style={{ fontFamily:'Barlow,sans-serif', fontSize:17, lineHeight:1.85, color:'var(--lt-ink-muted)', marginBottom:18 }}>
              Phyto-aromathérapeute depuis plus de 20 ans, Agnès vous reçoit dans son bureau, à la ferme en Bresse, pour un accompagnement personnalisé et bienveillant.
            </p>
            <p style={{ fontFamily:'Barlow,sans-serif', fontSize:17, lineHeight:1.85, color:'var(--lt-ink-muted)', marginBottom:32 }}>
              Elle prend le temps de vous écouter — votre terrain, votre mode de vie, vos besoins — pour élaborer avec vous des solutions naturelles, en phytothérapie et aromathérapie.
            </p>
            <button onClick={onRdv} className="btn-primary">Prendre rendez-vous</button>
          </div>
        </div>
      </section>

      {/* Offres */}
      <section style={{ padding:'80px 32px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(32px,4vw,50px)', color:'var(--lt-ink)', fontWeight:400, letterSpacing:'-0.02em' }}>
            Nos formules de consultation
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap:24 }}>
          {[
            { title:'Consultation Découverte', duration:'15 min', price:'Offerte', highlight:true,
              desc:'Premier contact pour échanger sur votre situation, vos besoins et les solutions naturelles adaptées. Sans engagement.',
              includes:['Échange sur votre santé globale','Présentation de l\'approche phyto-aromatique','Recommandations initiales','Sans engagement'] },
            { title:'Consultation Complète', duration:'1h', price:'85€',
              desc:'Bilan approfondi pour un accompagnement global, alliant plantes médicinales et écoute thérapeutique.',
              includes:['Anamnèse complète','Bilan énergétique','Protocole phyto sur mesure','Suivi par email 1 mois'] },
            { title:'Consultation de suivi', duration:'30 min', price:'50€',
              desc:'Suivi de séances de phyto-aromathérapie et ajustements selon vos retours.',
              includes:['Protocole phyto sur mesure','Conseils hygiène de vie','Suivi par email 1 mois'] },
          ].map((c,i) => (
            <div key={i} className="fade-up" style={{ transitionDelay:`${i*0.1}s`,
              border: c.highlight ? 'none' : '1px solid rgba(74,103,65,0.15)',
              background: c.highlight ? 'var(--moss)' : 'white',
              borderRadius: 16, padding:'40px', display:'flex', flexDirection:'column', gap:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:2, textTransform:'uppercase',
                    color: c.highlight ? 'rgba(245,240,232,0.6)' : 'var(--gold)', marginBottom:6 }}>{c.duration}</p>
                  <h3 style={{ fontFamily:'Vollkorn,serif', fontSize:26, fontWeight:500,
                    color: c.highlight ? 'var(--cream)' : 'var(--brown)' }}>{c.title}</h3>
                </div>
                <div style={{ fontFamily:'Vollkorn,serif', fontSize:38, fontWeight:300,
                  color: c.highlight ? 'var(--gold)' : 'var(--moss)' }}>{c.price}</div>
              </div>
              <p style={{ fontSize:14, lineHeight:1.8, color: c.highlight ? 'rgba(245,240,232,0.75)' : 'var(--brown-light)', marginBottom:24 }}>
                {c.desc}
              </p>
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 32px', display:'flex', flexDirection:'column', gap:8 }}>
                {c.includes.map(item => (
                  <li key={item} style={{ display:'flex', gap:10, alignItems:'flex-start',
                    fontSize:13, color: c.highlight ? 'rgba(245,240,232,0.8)' : 'var(--brown-light)' }}>
                    <span style={{ color:'var(--gold)', flexShrink:0, marginTop:1 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={onRdv}
                style={{ marginTop:'auto', padding:'14px 28px', border: c.highlight ? '1.5px solid var(--gold)' : 'none',
                  background: c.highlight ? 'transparent' : 'var(--moss)', color: c.highlight ? 'var(--gold)' : 'var(--cream)',
                  fontFamily:'Barlow,sans-serif', fontSize:12, fontWeight:600, letterSpacing:1.5,
                  textTransform:'uppercase', transition:'all 0.3s', alignSelf:'flex-start' }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--gold)'; e.currentTarget.style.color='var(--brown)' }}
                onMouseLeave={e => { e.currentTarget.style.background=c.highlight?'transparent':'var(--moss)'; e.currentTarget.style.color=c.highlight?'var(--gold)':'var(--cream)' }}>
                Prendre rendez-vous →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Déroulement */}
      <section style={{ background:'var(--lt-surface)', padding:'80px 32px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(30px,4vw,48px)', color:'var(--lt-ink)', fontWeight:400, letterSpacing:'-0.02em', marginBottom:60 }}>
            Le déroulement d'une consultation
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap:32 }}>
            {[
              { n:'01', label:'Prise de RDV', desc:'En ligne, par téléphone ou email. En présentiel à la ferme ou en visio.' },
              { n:'02', label:'Bilan global', desc:'Anamnèse complète : terrain, antécédents, mode de vie, alimentation.' },
              { n:'03', label:'Protocole', desc:'Agnès élabore votre protocole personnalisé avec les plantes adaptées.' },
              { n:'04', label:'Suivi', desc:'Accompagnement par email et ajustements selon vos retours.' },
            ].map((s,i) => (
              <div key={i} className="fade-up" style={{ transitionDelay:`${i*0.1}s` }}>
                <div style={{ fontFamily:'Vollkorn,serif', fontSize:48, fontWeight:300, color:'var(--gold)', opacity:0.5, marginBottom:12 }}>{s.n}</div>
                <h3 style={{ fontFamily:'Vollkorn,serif', fontSize:20, color:'var(--brown)', marginBottom:10 }}>{s.label}</h3>
                <p style={{ fontSize:13, color:'var(--brown-light)', lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section style={{ background:'var(--forest-dark)', padding:'80px 32px', textAlign:'center' }}>
        <div className="fade-up">
          <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(32px,4vw,52px)', color:'var(--cream)', fontWeight:300, marginBottom:16 }}>
            Commencez par une consultation<br/><em style={{ color:'var(--gold)' }}>découverte gratuite</em>
          </h2>
          <p style={{ color:'rgba(245,240,232,0.7)', fontSize:16, marginBottom:40, maxWidth:500, margin:'0 auto 40px' }}>
            15 minutes offertes pour faire connaissance avec Agnès et définir ensemble votre parcours naturel.
          </p>
          <button onClick={onRdv} className="btn-primary">Prendre rendez-vous maintenant</button>
        </div>
      </section>
    </div>
  )
}

// ─── Sections « La Ferme » ────────────────────────────────────────────────────
const FERME_PHOTO_MODULES = import.meta.glob('./assets/photos/ferme/**/*.jpg', { eager: true, import: 'default' }) as Record<string, string>
function fermeGallery(section: string): string[] {
  return Object.keys(FERME_PHOTO_MODULES)
    .filter(p => p.includes(`/ferme/${section}/`)).sort()
    .map(p => FERME_PHOTO_MODULES[p])
}

interface FermeSection { key: string; emoji: string; name: string; count: string; desc: string; long: string[]; boutiqueCat?: string }
const FERME_SECTIONS: FermeSection[] = [
  { key:'jardin', emoji:'🌿', name:'Jardin médicinal', count:'2 hectares', boutiqueCat:'Tisanes & Plantes',
    desc:'Plantes médicinales cultivées sans engrais chimique, récoltées à maturité pour préserver leurs principes actifs.',
    long:[
      'Cultivé sur 2 hectares sans engrais chimique ni pesticide, notre jardin médicinal rassemble une grande diversité de plantes aromatiques, médicinales et mellifères.',
      'Chaque plante est récoltée à maturité, au moment où sa concentration en principes actifs est la plus forte, puis séchée à l\'air libre ou transformée sur place — en tisanes, macérâts, hydrolats et huiles essentielles.',
    ] },
  { key:'brebis', emoji:'🐑', name:'Brebis Sardes', count:'8 brebis', boutiqueCat:'Créations laines',
    desc:'Laine utilisée dans nos soins et vendue brute ou filée. Tonte printanière, teinture aux plantes.',
    long:[
      'Nous élevons 8 brebis Sardes, une race rustique.',
      'Leur toison, tondue au printemps, est utilisée dans nos créations en laine et vendue brute ou filée. Nous la teignons avec les plantes du jardin.',
      'Le troupeau est veillé par Ninja, un berger de Bosnie-Herzégovine au poil soyeux, gardien attentif des animaux de la ferme.',
    ] },
  { key:'laine', emoji:'🧶', name:'Laine & Créations', count:'Filature artisanale', boutiqueCat:'Créations laines',
    desc:'Toisons transformées en fil puis en pulls, écharpes, plaids — au rouet, au tissage, au tricot main.',
    long:[
      'Le travail de la laine est une activité lancée en 2018, ouverte au public depuis l\'hiver 2019. Nous transformons les toisons de nos animaux — brebis Sardes, mérinos d\'Arles, alpaga suri, texel bleu, Gotland, Wensleydale et le mohair de nos chèvres — en fil, puis en créations.',
      'Tout se fait de façon artisanale : filage au rouet, tissage, tricot main. Le fil devient pulls, écharpes, châles, capes et plaids ; la laine est aussi vendue en écheveaux et pelotes.',
    ] },
  { key:'miellerie', emoji:'🐝', name:'Miellerie', count:'6 ruches', boutiqueCat:'Miellerie',
    desc:'Race Buckfast, ruches sédentaires. Miel toutes fleurs, cire pour nos baumes et soins cosmétiques.',
    long:[
      'Notre miellerie compte 6 ruches d\'abeilles Buckfast, sédentaires. Elles butinent librement les fleurs sauvages et médicinales de la ferme et des prairies de la Bresse.',
      'Le miel, toutes fleurs, est extrait et mis en pot directement à la ferme. Non chauffé, il conserve tous ses enzymes, pollens et arômes. La cire récoltée sert à nos baumes et soins cosmétiques.',
    ] },
  { key:'chevaux', emoji:'🐴', name:'Chevaux Pure Race Espagnole', count:'3 chevaux',
    desc:'Soins phytothérapeutiques et aromathérapeutiques sur place, dans le respect du rythme de chaque cheval.',
    long:[
      'Trois chevaux de Pure Race Espagnole (PRE) vivent à la ferme, dans le respect du rythme et du tempérament de chacun.',
      'Ils bénéficient de soins phytothérapeutiques et aromathérapeutiques sur place — une approche naturelle et douce du bien-être animal.',
    ] },
]

function FermeCategoryCard({ section, photos, delay, onOpen }: {
  section: FermeSection, photos: string[], delay: number, onOpen: () => void
}) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = photos.length

  useEffect(() => {
    if (paused || total <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setCurrent(c => (c + 1) % total), 4500)
    return () => clearInterval(t)
  }, [paused, total])

  return (
    <div className="product-card fade-up" style={{ transitionDelay:`${delay}s`, cursor:'pointer' }}
      onClick={onOpen}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>
      <div style={{ position:'relative', height:180, overflow:'hidden' }}>
        {photos.map((url, i) => (
          <img key={i} src={url} alt={section.name}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
              opacity: i===current ? 1 : 0, transition:'opacity 1s ease' }}/>
        ))}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(to top, rgba(20,30,15,0.55) 0%, transparent 55%)' }}/>
        <span style={{ position:'absolute', top:14, left:14, fontSize:28 }}>{section.emoji}</span>
        <span style={{ position:'absolute', bottom:12, right:12, background:'rgba(28,74,58,0.85)', color:'#F4EDDC',
          fontFamily:'Barlow,sans-serif', fontSize:10.5, letterSpacing:0.4, padding:'5px 11px', borderRadius:20,
          display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontSize:12 }}>⤢</span> {total} photo{total>1?'s':''}
        </span>
      </div>
      <div style={{ padding:'20px 22px 22px' }}>
        <h3 style={{ fontFamily:'Vollkorn,serif', fontSize:21, fontWeight:500, color:'var(--brown)', marginBottom:4, lineHeight:1.3 }}>{section.name}</h3>
        {section.count && <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5, color:'var(--gold)', textTransform:'uppercase', marginBottom:10 }}>{section.count}</p>}
        <p style={{ fontSize:13.5, color:'var(--brown-light)', lineHeight:1.7, marginBottom:12 }}>{section.desc}</p>
        <span style={{ fontFamily:'Barlow,sans-serif', fontSize:12, fontWeight:600, letterSpacing:0.3, color:'var(--forest)' }}>
          En savoir plus &amp; voir les photos →
        </span>
      </div>
    </div>
  )
}

function PageFerme({ addToast, setPage }: { addToast: (m:string)=>void, setPage:(p:string, cat?:string)=>void }) {
  useScrollAnimation()
  const [openSection, setOpenSection] = useState<FermeSection|null>(null)
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number }|null>(null)

  useEffect(() => {
    if (!openSection && !lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (lightbox) setLightbox(null); else setOpenSection(null); return }
      if (!lightbox) return
      if (e.key === 'ArrowRight') setLightbox(l => l && ({ ...l, index: (l.index + 1) % l.photos.length }))
      if (e.key === 'ArrowLeft')  setLightbox(l => l && ({ ...l, index: (l.index - 1 + l.photos.length) % l.photos.length }))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openSection, lightbox])

  return (
    <div>
      <HeroBanner
        img={fermeHeroPhoto}
        tag="Au cœur de la Bresse"
        title="La Ferme"
        subtitle="Un écosystème vivant en Bourgogne, où plantes médicinales, animaux à laine, abeilles et chevaux coexistent en harmonie."
      />

      {/* Bienvenue — travail de la laine */}
      <div style={{ background:'var(--surface-raised)', borderBottom:`1px solid oklch(0.42 0.085 150 / 0.12)` }}>
        <div style={{ maxWidth:860, margin:'0 auto', padding:'56px 32px' }}>
          <p style={{ fontFamily:'Barlow,sans-serif', fontSize:10, letterSpacing:2.5, textTransform:'uppercase', color:'var(--forest)', fontWeight:600, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:20 }}>🧶</span>
            <span>Bienvenue à la ferme</span>
          </p>
          <p style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(22px,2.6vw,30px)', fontStyle:'italic', fontWeight:400, color:'var(--ink)', lineHeight:1.7, marginBottom:28 }}>
            Une nouvelle activité a été mise en place : le travail de la laine.
          </p>
          <div style={{ width:36, height:2, background:'var(--primary)', marginBottom:24, opacity:0.7 }}/>
          <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:300, fontSize:18, lineHeight:1.95, color:'var(--lt-ink-muted)' }}>
            Nous élevons des brebis Sardes et je travaille les toisons de différents animaux à laine comme l'alpaga, le texel bleu, la laine de brebis Gotland et de brebis Wensleydale, et le mohair de nos chèvres.
            <br/><br/>
            Le but est de transformer les toisons en fil et du fil en diverses créations : pulls, écharpes, capes, plaids, mais aussi simplement la vente de laine en écheveaux ou pelotes — le tout de façon artisanale, au rouet, au tissage, au tricot main…
          </p>
        </div>
      </div>

      {/* Ce qui vit à la ferme — grille unifiée, une seule fois chaque rubrique */}
      <section style={{ background:'var(--lt-surface)', padding:'80px 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:60 }}>
            <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(32px,4vw,50px)', color:'var(--lt-ink)', fontWeight:400, letterSpacing:'-0.02em' }}>
              Ce qui vit à la ferme
            </h2>
          </div>
          <div className="resp-animals" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:20 }}>
            {FERME_SECTIONS.map((s, i) => (
              <FermeCategoryCard key={s.key} section={s} photos={fermeGallery(s.key)} delay={i*0.1}
                onOpen={() => setOpenSection(s)}/>
            ))}
          </div>
        </div>
      </section>

      {/* Modale détail d'une rubrique de la ferme */}
      <AnimatePresence>
        {openSection && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.22 }}
            onClick={() => setOpenSection(null)}
            style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(20,14,8,0.55)', backdropFilter:'blur(3px)',
              display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'5vh 20px', overflowY:'auto' }}>
            <motion.div initial={{ opacity:0, y:24, scale:0.98 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:20, scale:0.98 }}
              transition={{ duration:0.28, ease:[0.22,1,0.36,1] }}
              onClick={e => e.stopPropagation()}
              style={{ background:'var(--cream, #F4EDDC)', borderRadius:16, maxWidth:960, width:'100%',
                boxShadow:'0 30px 80px rgba(0,0,0,0.4)', overflow:'hidden', marginBottom:40 }}>
              <div style={{ background:'#1C4A3A', padding:'26px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <span style={{ fontSize:34 }}>{openSection.emoji}</span>
                  <div>
                    <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:26, fontWeight:500, color:'#F4EDDC', margin:0 }}>{openSection.name}</h2>
                    <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5, textTransform:'uppercase', color:'#C9A06A', margin:'4px 0 0' }}>{openSection.count}</p>
                  </div>
                </div>
                <button onClick={() => setOpenSection(null)} aria-label="Fermer"
                  style={{ background:'rgba(255,255,255,0.14)', border:'none', color:'#fff', width:40, height:40, borderRadius:'50%', fontSize:22, cursor:'pointer', flexShrink:0, lineHeight:1 }}>×</button>
              </div>
              <div style={{ padding:'28px 32px 34px' }}>
                {openSection.long.map((para, i) => (
                  <p key={i} style={{ fontFamily:'Barlow,sans-serif', fontSize:15.5, lineHeight:1.8, color:'var(--brown, #4E4636)', marginBottom:14 }}>{para}</p>
                ))}
                {openSection.boutiqueCat && (
                  <button onClick={() => { const c = openSection.boutiqueCat!; setOpenSection(null); setPage('boutique', c) }}
                    className="btn-primary" style={{ marginTop:8 }}>
                    Voir « {openSection.boutiqueCat} » en boutique →
                  </button>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:10, marginTop:22 }}>
                  {fermeGallery(openSection.key).map((url, i, arr) => (
                    <button key={i} onClick={() => setLightbox({ photos: arr, index: i })}
                      style={{ padding:0, border:'none', cursor:'zoom-in', borderRadius:10, overflow:'hidden', aspectRatio:'1', background:'#EDE6D6' }}>
                      <img src={url} alt={`${openSection.name} — photo ${i+1}`} loading="lazy"
                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.4s ease' }}
                        onMouseEnter={e => (e.currentTarget.style.transform='scale(1.06)')}
                        onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}/>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visionneuse plein écran — photo entière, navigable */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}
            onClick={() => setLightbox(null)}
            style={{ position:'fixed', inset:0, zIndex:100000, background:'rgba(20,14,8,0.93)',
              display:'flex', alignItems:'center', justifyContent:'center', padding:'4vh 4vw', cursor:'zoom-out' }}>
            <motion.img key={lightbox.index} src={lightbox.photos[lightbox.index]} alt="Aperçu"
              initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.2, ease:[0.22,1,0.36,1] }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', boxShadow:'0 24px 70px rgba(0,0,0,0.55)', cursor:'default' }}/>

            {lightbox.photos.length > 1 && (
              <>
                <button aria-label="Photo précédente"
                  onClick={e => { e.stopPropagation(); setLightbox(l => l && ({ ...l, index:(l.index - 1 + l.photos.length) % l.photos.length })) }}
                  style={{ position:'absolute', left:'clamp(12px,3vw,40px)', top:'50%', transform:'translateY(-50%)',
                    background:'rgba(255,255,255,0.12)', color:'#fff', border:'none', width:54, height:54, borderRadius:'50%',
                    fontSize:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1, paddingBottom:4 }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.24)')}
                  onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,0.12)')}>‹</button>
                <button aria-label="Photo suivante"
                  onClick={e => { e.stopPropagation(); setLightbox(l => l && ({ ...l, index:(l.index + 1) % l.photos.length })) }}
                  style={{ position:'absolute', right:'clamp(12px,3vw,40px)', top:'50%', transform:'translateY(-50%)',
                    background:'rgba(255,255,255,0.12)', color:'#fff', border:'none', width:54, height:54, borderRadius:'50%',
                    fontSize:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1, paddingBottom:4 }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.24)')}
                  onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,0.12)')}>›</button>
                <div style={{ position:'absolute', bottom:26, left:'50%', transform:'translateX(-50%)',
                  fontFamily:'Barlow,sans-serif', fontSize:13, letterSpacing:1, color:'#F4EDDC',
                  background:'rgba(0,0,0,0.35)', padding:'6px 14px', borderRadius:20 }}>
                  {lightbox.index + 1} / {lightbox.photos.length}
                </div>
              </>
            )}

            <button onClick={() => setLightbox(null)} aria-label="Fermer l'aperçu"
              style={{ position:'absolute', top:24, right:28, background:'rgba(255,255,255,0.14)', color:'#fff', border:'none', width:44, height:44, fontSize:26, borderRadius:'50%', cursor:'pointer', lineHeight:1 }}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Miellerie */}
      <section style={{ padding:'80px 32px', background:'var(--forest-dark)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap:48, alignItems:'center' }}>
          <div className="fade-left">
            <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(30px,3.5vw,48px)', color:'var(--ink)', fontWeight:400, letterSpacing:'-0.02em', marginBottom:24 }}>
              La miellerie<br/>de L'Oasis
            </h2>
            <div style={{ width:60, height:2, background:'var(--primary)', marginBottom:28 }}/>
            <p style={{ color:'rgba(245,240,232,0.75)', fontSize:15, lineHeight:1.8, marginBottom:24 }}>
              Nos 6 ruches sont positionnées au cœur de la ferme pour
              capturer la diversité florale de la Bresse. Chaque récolte est unique,
              reflet des saisons et des floraisons.
            </p>
            <button onClick={() => setPage('boutique')} className="btn-primary">
              Découvrir nos miels en boutique →
            </button>
          </div>
          <div className="fade-right" style={{ background:'rgba(245,240,232,0.05)', border:'1px solid rgba(201,168,76,0.2)',
            padding:48, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:96, marginBottom:24 }}>🍯</span>
            <p style={{ fontFamily:'Vollkorn,serif', fontSize:20, color:'var(--cream)', textAlign:'center', fontStyle:'italic', lineHeight:1.6 }}>
              "L'abeille est le thermomètre de la biodiversité.
              Protéger nos ruches, c'est protéger notre terrain médicinal."
            </p>
            <p style={{ fontFamily:'Barlow,sans-serif', color:'var(--gold)', fontSize:12, letterSpacing:1, marginTop:16 }}>— Agnès Gilliet</p>
          </div>
        </div>
      </section>

    </div>
  )
}

function PageStages({ addToast, setPage }: { addToast: (m:string)=>void, setPage:(p:string)=>void }) {
  useScrollAnimation()
  const [stageForm, setStageForm] = useState<number|null>(null)
  const [formData, setFormData] = useState({ nom:'', email:'', tel:'', message:'' })

  const handleSubmit = (stageId: number) => {
    if (!formData.nom || !formData.email) return
    addToast(`✓ Inscription au stage reçue ! Agnès vous contactera sous 48h.`)
    setStageForm(null)
    setFormData({ nom:'', email:'', tel:'', message:'' })
  }

  return (
    <div>
      <HeroBanner
        img={stagesHeroPhoto}
        imgPos="center 22%"
        tag="Apprendre par le vivant"
        title="Stages & Formations"
        subtitle="Des journées et week-ends pour apprendre à connaître les plantes, les ruches et les savoir-faire de la ferme, avec Agnès."
      />

      <section style={{ padding:'80px 32px', background:'var(--lt-bg)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap:24 }}>
            {STAGES.map((s,i) => (
              <div key={s.id} className="stage-card fade-up" style={{ transitionDelay:`${i*0.1}s` }}>
                <span style={{ fontSize:36, display:'block', marginBottom:16 }}>{s.emoji}</span>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <h3 style={{ fontFamily:'Vollkorn,serif', fontSize:22, color:'var(--brown)', lineHeight:1.3, flex:1 }}>{s.title}</h3>
                </div>
                <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'var(--moss)', color:'#F4EDDC',
                    padding:'6px 13px', fontSize:13, fontWeight:600, borderRadius:20, fontFamily:'Barlow,sans-serif', letterSpacing:0.3 }}>
                    <span style={{ fontSize:14 }}>⏱</span> {s.duration}
                  </span>
                  <span style={{ background:'var(--cream-dark)', padding:'5px 10px', fontSize:11, color:'var(--brown-light)', borderRadius:20 }}>{s.places} places</span>
                </div>
                <p style={{ fontSize:14, color:'var(--brown-light)', lineHeight:1.7, marginBottom:8 }}>{s.description}</p>
                <p style={{ fontFamily:'Barlow,sans-serif', fontSize:12, color:'var(--moss)', fontStyle:'italic', marginBottom:24 }}>{s.date}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:'Vollkorn,serif', fontSize:28, color:'var(--moss)', fontWeight:600 }}>{s.price}€</span>
                  <button onClick={() => setStageForm(s.id)} className="btn-moss" style={{ padding:'10px 20px', fontSize:12 }}>
                    S'inscrire
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign:'center', maxWidth:780, margin:'52px auto 0', fontFamily:'Barlow,sans-serif',
            fontSize:14, color:'var(--brown-light)', lineHeight:1.85 }}>
            Chaque stage réunit de 3 à 7 participants (jusqu'à 10 pour le jeûne et les randonnées). Des stages
            « à la carte » sont aussi possibles sur 3 jours maximum — contactez Agnès pour construire le programme
            qui vous ressemble.
          </p>

          {/* Inviter les stagiaires à laisser un avis Google */}
          <div style={{ textAlign:'center', marginTop:40 }}>
            <p style={{ fontFamily:'Barlow,sans-serif', fontSize:14, color:'var(--brown-light)', marginBottom:16 }}>
              Vous avez participé à un stage ?
            </p>
            <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer"
              className="btn-primary" style={{ textDecoration:'none' }}>
              ★ Laisser un avis Google
            </a>
          </div>
        </div>
      </section>

      {/* Stage Form Modal */}
      <div className={`modal-overlay ${stageForm!==null?'open':''}`} onClick={()=>setStageForm(null)}>
        <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ padding:48 }}>
          {stageForm && (() => {
            const stage = STAGES.find(s=>s.id===stageForm)!
            return (<>
              <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:28, color:'var(--brown)', marginBottom:4 }}>
                Inscription — {stage.title}
              </h2>
              <p style={{ fontSize:13, color:'var(--brown-light)', marginBottom:32 }}>{stage.date} · {stage.price}€</p>
              {(['nom','email','tel'] as const).map(field => (
                <div key={field} style={{ marginBottom:20 }}>
                  <label style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5, textTransform:'uppercase',
                    color:'var(--brown-light)', display:'block', marginBottom:6 }}>
                    {field==='nom'?'Nom complet *':field==='email'?'Email *':'Téléphone'}
                  </label>
                  <input type={field==='email'?'email':'text'} value={(formData as any)[field]}
                    onChange={e=>setFormData(p=>({...p,[field]:e.target.value}))}
                    style={{ width:'100%', background:'transparent', padding:'10px 0', fontSize:15,
                      color:'var(--brown)', outline:'none', boxSizing:'border-box',
                      border:'none', borderBottom:'1.5px solid rgba(74,103,65,0.3)' }}/>
                </div>
              ))}
              <div style={{ marginBottom:28 }}>
                <label style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5, textTransform:'uppercase',
                  color:'var(--brown-light)', display:'block', marginBottom:6 }}>Message / Questions</label>
                <textarea value={formData.message} onChange={e=>setFormData(p=>({...p,message:e.target.value}))}
                  rows={3} style={{ width:'100%', background:'var(--cream-dark)', border:'none', padding:12,
                    fontSize:14, color:'var(--brown)', outline:'none', resize:'none', boxSizing:'border-box' }}/>
              </div>
              <p style={{ fontSize:11, color:'var(--brown-light)', lineHeight:1.6, marginBottom:16 }}>
                Vos données sont utilisées uniquement pour traiter votre inscription.{' '}
                <button onClick={() => setPage('mentions')}
                  style={{ background:'none', border:'none', padding:0, font:'inherit',
                    color:'var(--moss)', textDecoration:'underline', cursor:'pointer' }}>
                  En savoir plus
                </button>.
              </p>
              <div style={{ display:'flex', gap:12 }}>
                <button className="btn-moss" style={{ flex:1 }} onClick={() => handleSubmit(stageForm)}>
                  Confirmer l'inscription
                </button>
                <button onClick={()=>setStageForm(null)}
                  style={{ padding:'13px 20px', border:'1.5px solid var(--moss)', background:'transparent',
                    color:'var(--moss)', fontSize:12, fontWeight:600, letterSpacing:1 }}>
                  Annuler
                </button>
              </div>
            </>)
          })()}
        </div>
      </div>
    </div>
  )
}

function ModalRdv({ open, onClose, addToast }: { open:boolean, onClose:()=>void, addToast:(m:string)=>void }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ nom:'', email:'', tel:'', type:'Consultation Découverte (15min offerte)', message:'' })

  const handleSubmit = () => {
    if (!form.nom || !form.email) return
    addToast('✓ Votre demande de RDV a bien été envoyée ! Agnès vous recontacte sous 24h.')
    onClose()
    setStep(1)
    setForm({ nom:'', email:'', tel:'', type:'Consultation Découverte (15min offerte)', message:'' })
  }

  if (!open) return null
  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()} style={{ padding:0, overflow:'hidden' }}>
        <div style={{ background:'var(--moss)', padding:'32px 40px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:2, color:'rgba(245,240,232,0.7)', textTransform:'uppercase', marginBottom:8 }}>
                Consultation gratuite
              </p>
              <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:32, color:'var(--cream)', fontWeight:400 }}>
                Prendre rendez-vous
              </h2>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'white',
              width:36, height:36, fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:20 }}>
            {[1,2].map(n => (
              <div key={n} style={{ height:3, flex:1, background: step>=n ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                transition:'background 0.3s' }}/>
            ))}
          </div>
        </div>
        <div style={{ padding:'36px 40px 40px' }}>
          {step === 1 ? (
            <>
              <h3 style={{ fontFamily:'Vollkorn,serif', fontSize:22, color:'var(--brown)', marginBottom:24 }}>
                Vos coordonnées
              </h3>
              {[{field:'nom',label:'Nom complet *'},{field:'email',label:'Email *'},{field:'tel',label:'Téléphone'}].map(({field,label}) => (
                <div key={field} style={{ marginBottom:20 }}>
                  <label style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5, textTransform:'uppercase',
                    color:'var(--brown-light)', display:'block', marginBottom:6 }}>{label}</label>
                  <input type={field==='email'?'email':'text'} value={(form as any)[field]}
                    onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}
                    style={{ width:'100%', background:'transparent',
                      padding:'10px 0', fontSize:15, color:'var(--brown)', outline:'none', border:'none',
                      borderBottom:'1.5px solid rgba(74,103,65,0.25)', boxSizing:'border-box' }}/>
                </div>
              ))}
              <button className="btn-moss" style={{ width:'100%', marginTop:8 }}
                onClick={() => { if(form.nom&&form.email) setStep(2) }}>
                Continuer →
              </button>
            </>
          ) : (
            <>
              <h3 style={{ fontFamily:'Vollkorn,serif', fontSize:22, color:'var(--brown)', marginBottom:24 }}>
                Type de consultation
              </h3>
              <div style={{ marginBottom:20 }}>
                <label style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5, textTransform:'uppercase',
                  color:'var(--brown-light)', display:'block', marginBottom:8 }}>Consultation souhaitée</label>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {['Consultation Découverte (15min — offerte)','Consultation Complète (1h — 85€)','Consultation de suivi (30min — 50€)'].map(t => (
                    <label key={t} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                      background: form.type===t ? 'rgba(74,103,65,0.08)' : 'transparent',
                      border: `1.5px solid ${form.type===t ? 'var(--moss)' : 'rgba(74,103,65,0.15)'}`,
                      cursor:'pointer', transition:'all 0.2s' }}>
                      <input type="radio" name="type" value={t} checked={form.type===t}
                        onChange={()=>setForm(p=>({...p,type:t}))} style={{ accentColor:'var(--moss)' }}/>
                      <span style={{ fontFamily:'Barlow,sans-serif', fontSize:13, color:'var(--brown)' }}>{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:28 }}>
                <label style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5, textTransform:'uppercase',
                  color:'var(--brown-light)', display:'block', marginBottom:6 }}>Message (facultatif)</label>
                <textarea value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}
                  rows={3} placeholder="Décrivez brièvement votre situation..."
                  style={{ width:'100%', background:'var(--cream-dark)', border:'none', padding:12,
                    fontSize:14, color:'var(--brown)', outline:'none', resize:'none', boxSizing:'border-box' }}/>
              </div>
              <p style={{ fontSize:11, color:'var(--brown-light)', lineHeight:1.6, marginBottom:16 }}>
                Vos données sont utilisées uniquement pour traiter votre demande de rendez-vous (voir nos mentions légales).
              </p>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={()=>setStep(1)} style={{ padding:'13px 20px', border:'1.5px solid var(--moss)',
                  background:'transparent', color:'var(--moss)', fontSize:12, fontWeight:600, letterSpacing:1 }}>
                  ← Retour
                </button>
                <button className="btn-moss" style={{ flex:1 }} onClick={handleSubmit}>
                  Envoyer ma demande ✓
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mentions légales ─────────────────────────────────────────────────────────
function PageMentions({ setPage }: { setPage:(p:string)=>void }) {
  useScrollAnimation()
  const sections = [
    { title:'1. Éditeur du site', content:`L'Oasis en Fleurs\nAgnès Gilliet — Phyto-aromathérapeute\n320 chemin des Boulatières, 01560 Curciat-Dongalon\nTél. : 06 64 34 86 87\nEmail : contact@lesnaturelsdelasource.com` },
    { title:'2. Hébergement', content:`Ce site est hébergé par Netlify, Inc.\n44 Montgomery Street, Suite 300, San Francisco, CA 94104 — USA\nwww.netlify.com` },
    { title:'3. Propriété intellectuelle', content:`L'ensemble du contenu de ce site (textes, photos, descriptions, visuels) est la propriété exclusive d'Agnès Gilliet — L'Oasis en Fleurs. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.` },
    { title:'4. Conditions générales de vente', content:`Les produits sont fabriqués artisanalement par Agnès Gilliet à la ferme. Les commandes sont passées via le formulaire en ligne et font l'objet d'une confirmation sous 24 h par email.\n\nLivraison : les produits sont expédiés en Colissimo ou remis en main propre à la ferme. Les frais de port sont communiqués lors de la confirmation de commande.\n\nDroit de rétractation : conformément à la législation en vigueur, vous disposez de 14 jours à compter de la réception pour exercer votre droit de rétractation, sauf pour les produits personnalisés ou les denrées périssables.\n\nRèglement des litiges : en cas de litige, une solution amiable sera recherchée avant tout recours judiciaire.` },
    { title:'5. Données personnelles (RGPD)', content:`Les données collectées via les formulaires du site (nom, email, téléphone, message) sont utilisées uniquement pour répondre à vos demandes, sur la base de l'intérêt légitime à traiter votre contact. Elles sont conservées 3 ans à compter de notre dernier échange, puis supprimées.\n\nLors d'une commande, votre nom, votre email et votre adresse de livraison sont transmis à nos prestataires techniques, nécessaires à l'exécution du contrat (article 6.1.b du RGPD) :\n— Stripe (paiement en ligne), société américaine certifiée PCI-DSS,\n— Resend (envoi de l'email de confirmation), société américaine.\nCes transferts hors Union Européenne sont encadrés par les clauses contractuelles types de la Commission européenne. Les données de commande sont conservées le temps nécessaire à la gestion de la commande et aux obligations comptables légales (10 ans).\n\nCe site est hébergé par Netlify, Inc. (États-Unis) — voir section 2.\n\nConformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données. Pour exercer ces droits : contact@lesnaturelsdelasource.com. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).\n\nAucun cookie de traçage ou publicitaire n'est utilisé sur ce site. Le panier d'achat utilise le stockage local de votre navigateur, strictement nécessaire au fonctionnement du site.` },
  ]
  return (
    <div style={{ background:'var(--lt-bg)', minHeight:'100vh' }}>
      <div style={{ maxWidth:820, margin:'0 auto', padding:'120px 32px 80px' }}>
        <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:2.5, textTransform:'uppercase', color:'var(--forest)', fontWeight:600, marginBottom:16 }}>Informations légales</p>
        <h1 style={{ fontFamily:'Vollkorn,serif', fontSize:'clamp(30px,4vw,50px)', fontWeight:400, color:'var(--ink)', letterSpacing:'-0.02em', marginBottom:16, lineHeight:1.1 }}>
          Mentions légales & CGV
        </h1>
        <div style={{ width:36, height:2, background:'var(--primary)', marginBottom:56 }}/>
        {sections.map(({ title, content }) => (
          <div key={title} style={{ marginBottom:48 }}>
            <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:22, fontWeight:500, color:'var(--ink)', marginBottom:16 }}>{title}</h2>
            <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:300, fontSize:16, lineHeight:1.9, color:'var(--lt-ink-muted)', whiteSpace:'pre-line' }}>{content}</p>
            <div style={{ height:1, background:'oklch(0.42 0.085 150 / 0.12)', marginTop:40 }}/>
          </div>
        ))}
        <button onClick={() => setPage('accueil')}
          style={{ fontFamily:'Barlow,sans-serif', fontSize:12, letterSpacing:1.5, color:'var(--forest)', background:'none', border:'none', textTransform:'uppercase', display:'flex', alignItems:'center', gap:8, marginTop:16, paddingBottom:2, borderBottom:'1px solid var(--forest)', cursor:'pointer' }}>
          ← Retour à l'accueil
        </button>
      </div>
    </div>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer({ setPage }: { setPage:(p:string)=>void }) {
  return (
    <footer style={{ background:'var(--forest-dark)', padding:'64px 32px 32px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        <div className="resp-footer" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:60, marginBottom:60 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <LeafIcon size={24}/>
              <span style={{ fontFamily:'"Petit Formal Script",cursive', fontSize:28, color:'var(--cream)', fontWeight:400 }}>
                Les Naturels de la Source
              </span>
            </div>
            <p style={{ fontSize:14, color:'rgba(245,240,232,0.6)', lineHeight:1.8, maxWidth:300 }}>
              Ferme phytothérapeutique artisanale en Bresse. Plantes médicinales, soins naturels et stages immersifs.
            </p>
            <p style={{ fontSize:13, color:'var(--gold)', marginTop:20 }}>📍 320 chemin des Boulatières, 01560 Curciat-Dongalon</p>
            <p style={{ fontSize:13, color:'rgba(245,240,232,0.5)', marginTop:4 }}>📞 06 64 34 86 87</p>
            <p style={{ fontSize:13, color:'rgba(245,240,232,0.5)', marginTop:4 }}>✉️ contact@lesnaturelsdelasource.com</p>
          </div>
          {[
            { title:'Navigation', links:[['accueil','Accueil'],['boutique','Boutique & Soins'],['ferme','La Ferme'],['stages','Les Stages'],['consultation','Consultation']] },
            { title:'Soins', links:[['boutique','Phytothérapie'],['boutique','Aromathérapie'],['consultation','Consultation'],['stages','Stages']] },
            { title:'La Ferme', links:[['ferme','Jardin médicinal'],['ferme','Miellerie'],['ferme','Animaux'],['ferme','Laines & fibres']] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:11, letterSpacing:2, textTransform:'uppercase',
                color:'var(--gold)', marginBottom:20 }}>{title}</p>
              {links.map(([page,label]) => (
                <button key={label} onClick={()=>setPage(page)}
                  style={{ display:'block', background:'none', border:'none', fontFamily:'Barlow,sans-serif',
                    fontSize:14, color:'rgba(245,240,232,0.6)', marginBottom:10, padding:0,
                    transition:'color 0.2s', textAlign:'left' }}
                  onMouseEnter={e=>((e.target as HTMLElement).style.color='var(--cream)')}
                  onMouseLeave={e=>((e.target as HTMLElement).style.color='rgba(245,240,232,0.6)')}>
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid rgba(245,240,232,0.1)', paddingTop:28, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
            <p style={{ fontSize:12, color:'rgba(245,240,232,0.4)', margin:0 }}>
              © 2026 Les Naturels de la Source — Agnès Gilliet. Tous droits réservés.
            </p>
            <button onClick={()=>setPage('mentions')}
              style={{ background:'none', border:'none', fontSize:12, color:'rgba(245,240,232,0.4)', textDecoration:'underline', fontFamily:'Barlow,sans-serif', padding:0, cursor:'pointer' }}>
              Mentions légales & CGV
            </button>
          </div>
          <p style={{ fontSize:12, color:'rgba(245,240,232,0.4)', margin:0 }}>
            Fait avec 🌿 en Bresse
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({ open, onClose, cart, setCart }: {
  open: boolean, onClose: ()=>void,
  cart: CartItem[], setCart: React.Dispatch<React.SetStateAction<CartItem[]>>,
}) {
  const [step, setStep] = useState<'cart'|'order'|'redirecting'>('cart')
  const [note, setNote] = useState('')
  const [checkoutError, setCheckoutError] = useState<string|null>(null)

  const total = cart.reduce((s,i) => s+i.price*i.qty, 0)
  const count = cart.reduce((s,i) => s+i.qty, 0)

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev
      .map(i => i.id===id ? {...i, qty: i.qty+delta} : i)
      .filter(i => i.qty > 0)
    )
  }
  const remove = (id: number) => setCart(prev => prev.filter(i => i.id!==id))
  const clear = () => setCart([])

  const handleCheckout = async () => {
    setCheckoutError(null)
    setStep('redirecting')
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, qty: i.qty })),
          note: note || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'out_of_stock') {
          const product = cart.find(i => i.id === data.productId)
          setCheckoutError(`Rupture de stock${product ? ` pour "${product.name}"` : ''} — il n'en reste que ${data.available ?? 0} en stock. Merci d'ajuster la quantité.`)
        } else if (data.error === 'stock_check_unavailable') {
          setCheckoutError('Impossible de vérifier le stock pour le moment. Merci de réessayer dans quelques instants.')
        } else {
          setCheckoutError('Une erreur est survenue. Merci de réessayer.')
        }
        setStep('order')
        return
      }
      window.location.href = data.url
    } catch {
      setCheckoutError('Connexion impossible. Vérifiez votre connexion et réessayez.')
      setStep('order')
    }
  }

  // reset step quand on ferme
  const handleClose = () => { onClose(); setTimeout(() => setStep('cart'), 400) }

  return (
    <>
      <div className={`drawer-overlay ${open?'open':''}`} onClick={handleClose}/>
      <div className={`drawer-panel ${open?'open':''}`} style={{ display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ background:'var(--forest-dark)', padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:2, color:'rgba(245,240,232,0.6)', textTransform:'uppercase', marginBottom:4 }}>
              {step==='cart' ? `${count} article${count>1?'s':''}` : step==='order' ? 'Récapitulatif' : 'Paiement sécurisé'}
            </p>
            <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:26, color:'var(--cream)', fontWeight:400 }}>
              {step==='cart' ? 'Mon Panier' : step==='order' ? 'Finaliser la commande' : 'Redirection…'}
            </h2>
          </div>
          <button onClick={handleClose} style={{ background:'rgba(255,255,255,0.1)', border:'none',
            color:'white', width:36, height:36, fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {/* Étape 1 — liste panier */}
        {step === 'cart' && (
          <>
            <div style={{ flex:1, overflowY:'auto', padding:'24px 32px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 0' }}>
                  <span style={{ fontSize:52, display:'block', marginBottom:16 }}>🛒</span>
                  <p style={{ fontFamily:'Vollkorn,serif', fontSize:22, color:'var(--brown-light)' }}>Votre panier est vide</p>
                  <p style={{ fontSize:13, color:'var(--brown-light)', marginTop:8 }}>Ajoutez des produits depuis la boutique</p>
                </div>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} style={{ display:'flex', gap:16, paddingBottom:20, marginBottom:20,
                      borderBottom:'1px solid rgba(74,103,65,0.12)', alignItems:'flex-start' }}>
                      {/* Emoji vignette */}
                      <div style={{ width:64, height:64, background:'var(--moss)', flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                        {item.emoji}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontFamily:'Vollkorn,serif', fontSize:17, fontWeight:500,
                          color:'var(--brown)', marginBottom:2, lineHeight:1.3 }}>{item.name}</p>
                        <p style={{ fontFamily:'Barlow,sans-serif', fontSize:11, color:'var(--gold)',
                          letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>{item.category}</p>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          {/* Qty */}
                          <div style={{ display:'flex', alignItems:'center', gap:0 }}>
                            <button className="qty-btn" style={{ width:28, height:28, fontSize:16 }}
                              onClick={() => updateQty(item.id, -1)}>−</button>
                            <span style={{ width:36, textAlign:'center', fontFamily:'Vollkorn,serif', fontSize:18, color:'var(--brown)' }}>
                              {item.qty}
                            </span>
                            <button className="qty-btn" style={{ width:28, height:28, fontSize:16 }}
                              onClick={() => updateQty(item.id, 1)}>+</button>
                          </div>
                          {/* Prix ligne */}
                          <span style={{ fontFamily:'Vollkorn,serif', fontSize:20, fontWeight:600, color:'var(--brown)' }}>
                            {item.price * item.qty}€
                          </span>
                        </div>
                      </div>
                      {/* Supprimer */}
                      <button onClick={() => remove(item.id)}
                        style={{ background:'none', border:'none', color:'rgba(61,46,30,0.3)',
                          fontSize:18, padding:'4px', transition:'color 0.2s', flexShrink:0 }}
                        onMouseEnter={e => (e.currentTarget.style.color='#c0392b')}
                        onMouseLeave={e => (e.currentTarget.style.color='rgba(61,46,30,0.3)')}>
                        ✕
                      </button>
                    </div>
                  ))}
                  <button onClick={clear}
                    style={{ background:'none', border:'none', fontSize:12, color:'rgba(61,46,30,0.4)',
                      textDecoration:'underline', fontFamily:'Barlow,sans-serif', letterSpacing:0.5, marginTop:4 }}>
                    Vider le panier
                  </button>
                </>
              )}
            </div>

            {/* Footer récap */}
            {cart.length > 0 && (
              <div style={{ padding:'24px 32px', borderTop:'1px solid rgba(74,103,65,0.15)', background:'white', flexShrink:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontFamily:'Barlow,sans-serif', fontSize:13, color:'var(--brown-light)' }}>Sous-total</span>
                  <span style={{ fontFamily:'Vollkorn,serif', fontSize:18, color:'var(--brown)' }}>{total}€</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                  <span style={{ fontFamily:'Barlow,sans-serif', fontSize:13, color:'var(--brown-light)' }}>Livraison (France)</span>
                  <span style={{ fontFamily:'Barlow,sans-serif', fontSize:13, color:'var(--moss)' }}>
                    Calculée à l'étape suivante
                  </span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20,
                  paddingTop:12, borderTop:'1.5px solid var(--brown)' }}>
                  <span style={{ fontFamily:'Vollkorn,serif', fontSize:20, fontWeight:600, color:'var(--brown)' }}>Total</span>
                  <span style={{ fontFamily:'Vollkorn,serif', fontSize:26, fontWeight:600, color:'var(--moss)' }}>{total}€</span>
                </div>
                <button className="btn-moss" style={{ width:'100%', textAlign:'center' }}
                  onClick={() => setStep('order')}>
                  Passer la commande →
                </button>
              </div>
            )}
          </>
        )}

        {/* Étape 2 — formulaire */}
        {step === 'order' && (
          <>
            <div style={{ flex:1, overflowY:'auto', padding:'28px 32px' }}>
              {/* Récap commande */}
              <div style={{ background:'var(--cream-dark)', padding:'16px 20px', marginBottom:28 }}>
                {cart.map(i => (
                  <div key={i.id} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'var(--brown-light)' }}>{i.name} × {i.qty}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--brown)' }}>{i.price*i.qty}€</span>
                  </div>
                ))}
                <div style={{ borderTop:'1px solid rgba(74,103,65,0.2)', marginTop:10, paddingTop:10,
                  display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:'Barlow,sans-serif', fontWeight:600, fontSize:13 }}>Total</span>
                  <span style={{ fontFamily:'Vollkorn,serif', fontSize:20, fontWeight:700, color:'var(--moss)' }}>{total}€</span>
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={{ fontFamily:'Barlow,sans-serif', fontSize:11, letterSpacing:1.5,
                  textTransform:'uppercase', color:'var(--brown-light)', display:'block', marginBottom:6 }}>
                  Message / Note de commande (facultatif)
                </label>
                <textarea value={note} rows={3}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Allergies, précisions, message pour Agnès…"
                  style={{ width:'100%', background:'var(--cream-dark)', border:'none', padding:12,
                    fontSize:14, color:'var(--brown)', outline:'none', resize:'none', boxSizing:'border-box' }}/>
              </div>

              {checkoutError && (
                <div style={{ background:'rgba(192,57,43,0.08)', border:'1px solid rgba(192,57,43,0.3)',
                  padding:'12px 16px', marginBottom:16, fontSize:13, color:'#c0392b' }}>
                  {checkoutError}
                </div>
              )}

              <p style={{ fontSize:11, color:'var(--brown-light)', lineHeight:1.7, marginBottom:4 }}>
                🔒 Paiement sécurisé par carte bancaire via Stripe. Votre email et votre adresse de livraison
                vous seront demandés sur la page de paiement.
              </p>
            </div>

            <div style={{ padding:'20px 32px', borderTop:'1px solid rgba(74,103,65,0.15)', background:'white', flexShrink:0, display:'flex', gap:12 }}>
              <button onClick={() => setStep('cart')}
                style={{ padding:'13px 20px', border:'1.5px solid var(--moss)', background:'transparent',
                  color:'var(--moss)', fontSize:12, fontWeight:600, letterSpacing:1, flexShrink:0 }}>
                ← Retour
              </button>
              <button className="btn-moss" style={{ flex:1, textAlign:'center' }} onClick={handleCheckout}>
                Procéder au paiement →
              </button>
            </div>
          </>
        )}

        {/* Étape 3 — redirection vers Stripe */}
        {step === 'redirecting' && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:48, textAlign:'center' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(74,103,65,0.1)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, marginBottom:24 }}>
              🔒
            </div>
            <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:26, color:'var(--moss)', marginBottom:12 }}>
              Redirection vers le paiement sécurisé…
            </h2>
            <p style={{ fontSize:14, color:'var(--brown-light)', lineHeight:1.8, maxWidth:320 }}>
              Vous allez être redirigé(e) vers la page de paiement Stripe.
            </p>
          </div>
        )}
      </div>
    </>
  )
}

const CART_STORAGE_KEY = 'oasis-en-fleurs-cart'

export default function App() {
  const [page, setPage] = useState('accueil')
  // Persisté en localStorage : un vrai paiement Stripe fait quitter puis revenir sur le site
  // (succès ou annulation), ce qui réinitialiserait sinon le panier en mémoire.
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [toasts, setToasts] = useState<string[]>([])
  const [rdvOpen, setRdvOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [showConstruction, setShowConstruction] = useState(() => {
    try { return !sessionStorage.getItem('construction_seen') } catch { return true }
  })
  const dismissConstruction = () => {
    setShowConstruction(false)
    try { sessionStorage.setItem('construction_seen', '1') } catch {}
  }
  const [showThanks, setShowThanks] = useState(false)
  const [boutiqueCat, setBoutiqueCat] = useState('Tout')
  const navigate = (p: string, cat: string = 'Tout') => { setBoutiqueCat(cat); setPage(p); window.scrollTo(0,0) }
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const cursorRingRef = useRef<HTMLDivElement>(null)
  const ringPos = useRef({ x: 0, y: 0 })

  const cartCount = cart.reduce((s,i) => s+i.qty, 0)

  const addToast = useCallback((msg: string) => {
    setToasts(prev => [...prev, msg])
    setTimeout(() => setToasts(prev => prev.slice(1)), 3200)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch {
      // stockage indisponible (navigation privée, quota…) : on continue sans persister
    }
  }, [cart])

  // Retour depuis Stripe Checkout (succès ou annulation) — cf. success_url / cancel_url
  // dans netlify/functions/create-checkout-session.ts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const commande = params.get('commande')
    if (commande === 'succes') {
      setCart([])
      setShowThanks(true)
    } else if (commande === 'annulee') {
      addToast('Paiement annulé — votre panier a été conservé.')
    }
    if (commande) {
      params.delete('commande')
      const newSearch = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''))
    }
  }, [addToast])

  // Cursor
  useEffect(() => {
    const moveDot = (e: MouseEvent) => {
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = e.clientX + 'px'
        cursorDotRef.current.style.top = e.clientY + 'px'
      }
    }
    const moveRing = () => {
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = ringPos.current.x + 'px'
        cursorRingRef.current.style.top = ringPos.current.y + 'px'
      }
    }
    const trackMouse = (e: MouseEvent) => {
      moveDot(e)
      ringPos.current.x += (e.clientX - ringPos.current.x) * 0.15
      ringPos.current.y += (e.clientY - ringPos.current.y) * 0.15
    }
    let raf: number
    const animate = () => { moveRing(); raf = requestAnimationFrame(animate) }
    window.addEventListener('mousemove', trackMouse)
    raf = requestAnimationFrame(animate)

    // Le survol ne s'active que sur les éléments cliquables (délégation, couvre aussi le contenu dynamique)
    const interactiveSel = 'a, button, [role="button"], input, textarea, select, label, .cursor-pointer'
    const onOver = (e: Event) => {
      if ((e.target as Element).closest?.(interactiveSel)) document.body.classList.add('cursor-hover')
    }
    const onOut = (e: Event) => {
      if ((e.target as Element).closest?.(interactiveSel)) document.body.classList.remove('cursor-hover')
    }
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    return () => {
      window.removeEventListener('mousemove', trackMouse)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      cancelAnimationFrame(raf)
    }
  }, [page])

  return (
    <>
      {/* Pop-up : site en construction */}
      <AnimatePresence>
        {showConstruction && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}
            onClick={dismissConstruction}
            style={{ position:'fixed', inset:0, zIndex:5000, background:'rgba(20,14,8,0.6)', backdropFilter:'blur(4px)',
              display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
            <motion.div initial={{ opacity:0, y:20, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:16, scale:0.97 }}
              transition={{ duration:0.3, ease:[0.22,1,0.36,1] }} onClick={e => e.stopPropagation()}
              style={{ background:'var(--cream, #F4EDDC)', borderRadius:18, maxWidth:440, width:'100%', overflow:'hidden',
                boxShadow:'0 30px 80px rgba(0,0,0,0.4)', textAlign:'center' }}>
              <div style={{ background:'#1C4A3A', padding:'26px 28px 22px' }}>
                <div style={{ fontSize:38, marginBottom:8 }}>🚧</div>
                <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:24, fontWeight:500, color:'#F4EDDC', margin:0 }}>Site en construction</h2>
              </div>
              <div style={{ padding:'26px 28px 30px' }}>
                <p style={{ fontFamily:'Barlow,sans-serif', fontSize:15.5, lineHeight:1.7, color:'var(--brown, #4E4636)', marginBottom:20 }}>
                  Notre site est encore en cours de construction. Pour toute information, n'hésitez pas à contacter Agnès directement — elle se fera un plaisir de vous répondre.
                </p>
                <div style={{ background:'rgba(28,74,58,0.06)', borderRadius:12, padding:'16px 18px', marginBottom:22 }}>
                  <a href="tel:+33664348687" style={{ display:'block', fontFamily:'Barlow,sans-serif', fontSize:16, fontWeight:600, color:'var(--forest, #1C4A3A)', textDecoration:'none', marginBottom:8 }}>📞 06 64 34 86 87</a>
                  <a href="mailto:contact@lesnaturelsdelasource.com" style={{ display:'block', fontFamily:'Barlow,sans-serif', fontSize:15, color:'var(--forest, #1C4A3A)', textDecoration:'none' }}>✉️ contact@lesnaturelsdelasource.com</a>
                </div>
                <button onClick={dismissConstruction} className="btn-primary" style={{ width:'100%' }}>
                  Continuer la visite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pop-up : merci + demande d'avis après paiement */}
      <AnimatePresence>
        {showThanks && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.25 }}
            onClick={() => setShowThanks(false)}
            style={{ position:'fixed', inset:0, zIndex:5000, background:'rgba(20,14,8,0.6)', backdropFilter:'blur(4px)',
              display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
            <motion.div initial={{ opacity:0, y:20, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:16, scale:0.97 }}
              transition={{ duration:0.3, ease:[0.22,1,0.36,1] }} onClick={e => e.stopPropagation()}
              style={{ background:'var(--cream, #F4EDDC)', borderRadius:18, maxWidth:460, width:'100%', overflow:'hidden',
                boxShadow:'0 30px 80px rgba(0,0,0,0.4)', textAlign:'center' }}>
              <div style={{ background:'#1C4A3A', padding:'26px 28px 22px' }}>
                <div style={{ fontSize:38, marginBottom:8 }}>🌿</div>
                <h2 style={{ fontFamily:'Vollkorn,serif', fontSize:24, fontWeight:500, color:'#F4EDDC', margin:0 }}>Merci pour votre commande&nbsp;!</h2>
              </div>
              <div style={{ padding:'26px 28px 30px' }}>
                <p style={{ fontFamily:'Barlow,sans-serif', fontSize:15.5, lineHeight:1.7, color:'var(--brown, #4E4636)', marginBottom:16 }}>
                  Votre commande est confirmée — vous allez recevoir un email de confirmation.
                </p>
                <p style={{ fontFamily:'Barlow,sans-serif', fontSize:15.5, lineHeight:1.7, color:'var(--brown, #4E4636)', marginBottom:24 }}>
                  Le site est encore en construction et <strong>votre avis compte énormément</strong>. Une suggestion, un détail à améliorer, quelque chose qui manque&nbsp;? Dites-le-nous, ça nous aide à faire mieux.
                </p>
                <a href="mailto:contact@lesnaturelsdelasource.com?subject=Mon%20avis%20sur%20le%20site&body=Bonjour%20Agn%C3%A8s%2C%0A%0AVoici%20mes%20suggestions%20pour%20le%20site%20%3A%0A%0A"
                  className="btn-primary" style={{ display:'block', width:'100%', textDecoration:'none', boxSizing:'border-box', marginBottom:12 }}
                  onClick={() => setShowThanks(false)}>
                  Partager une suggestion
                </a>
                <button onClick={() => setShowThanks(false)}
                  style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'Barlow,sans-serif', fontSize:13.5, color:'var(--brown-light, #7a6f5c)', textDecoration:'underline' }}>
                  Continuer la visite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom cursor */}
      <div id="cursor-dot" ref={cursorDotRef}/>
      <div id="cursor-ring" ref={cursorRingRef}/>

      <Navbar page={page} setPage={navigate} cartCount={cartCount} onRdv={() => setRdvOpen(true)} onOpenCart={() => setCartOpen(true)}/>

      <main>
        {page === 'accueil' && <PageAccueil setPage={navigate} onRdv={() => setRdvOpen(true)}/>}
        {page === 'boutique' && <PageBoutique cart={cart} setCart={setCart} addToast={addToast} onOpenCart={() => setCartOpen(true)} onRdv={() => setRdvOpen(true)} setPage={navigate} initialCategory={boutiqueCat}/>}
        {page === 'ferme' && <PageFerme addToast={addToast} setPage={navigate}/>}
        {page === 'stages' && <PageStages addToast={addToast} setPage={navigate}/>}
        {page === 'consultation' && <PageConsultation onRdv={() => setRdvOpen(true)}/>}
        {page === 'contact' && <PageContact addToast={addToast} setPage={navigate}/>}
        {page === 'mentions' && <PageMentions setPage={navigate}/>}
      </main>

      <Footer setPage={navigate}/>

      <ModalRdv open={rdvOpen} onClose={() => setRdvOpen(false)} addToast={addToast}/>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart}/>
      <ToastContainer toasts={toasts}/>
    </>
  )
}
