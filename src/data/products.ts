// Catalogue produits — source unique de vérité, partagée entre le frontend (src/App.tsx)
// et les Netlify Functions de paiement (netlify/functions/create-checkout-session.ts).
// Ne jamais faire confiance à un prix envoyé par le client : toujours relire le prix ici.

export interface Product {
  id: number
  name: string
  category: string
  price: number
  unit: string
  description: string
  ingredients: string[]
  benefits: string[]
  usage: string
  emoji: string
  badge?: string
}

const P = (id:number, name:string, category:string, price:number, unit:string, emoji:string, description:string, badge?:string): Product =>
  ({ id, name, category, price, unit, emoji, description, ingredients:[], benefits:[], usage:'', badge })

const BOURGEON_INGREDIENTS = ['Bourgeons frais', 'Glycérine végétale biologique', 'Eau de source', 'Alcool de céréales biologiques']

export const PRODUCTS: Product[] = [
  // ── Phytembryothérapie ────────────────────────────────────────────────────
  {...P(1,'Bourgeons d\'aubépine','Phytembryothérapie',24,'Flacon 30ml','🌿','Sédatif du système nerveux, protecteur cardiovasculaire. Combat les troubles du sommeil, la fragilité émotionnelle et l\'angoisse.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(2,'Bourgeons d\'églantier','Phytembryothérapie',24,'Flacon 30ml','🌿','Macérât de bourgeons d\'églantier concentré en flacon verre.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(3,'Bourgeons de châtaignier','Phytembryothérapie',24,'Flacon 30ml','🌿','Macérât glycériné de bourgeons de châtaignier concentré. Stimule le système lymphatique.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(4,'Bourgeons de chêne','Phytembryothérapie',24,'Flacon 30ml','🌿','Macérât glycériné de bourgeons de chêne concentré. Tonique général, favorise la circulation.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(5,'Bourgeons de frêne','Phytembryothérapie',24,'Flacon 30ml','🌿','Puissant stimulant du système rénal, draineur. Soulage le système ostéoarticulaire et élimine les toxines, notamment l\'acide urique.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(6,'Détente Elixirs','Phytembryothérapie',24,'Flacon 50ml','💫','Apaise, combat le stress et les troubles du sommeil.','Bestseller'), ingredients:['Extrait d\'aubépine','Extrait de mélisse','Extrait de pavot de Californie','Macérat de bourgeons de tilleul']},
  {...P(7,'Extrait d\'echinacea purpurea','Phytembryothérapie',18.9,'Flacon 30ml','🌸','Immunostimulant reconnu, actif sur les affections virales et bactériennes. Sans alcool.'), ingredients:['Fleurs et feuilles d\'echinacea purpurea','Eau de source','Glycérine végétale biologique']},
  {...P(8,'Macérât de bourgeons de cassissier','Phytembryothérapie',24,'Flacon 50ml','🫐','Le plus grand des draineurs. Renforce les défenses immunitaires, aide à lutter contre les allergies et la fatigue.','Bestseller'), ingredients:BOURGEON_INGREDIENTS},
  {...P(9,'Macérât de bourgeons de genévrier','Phytembryothérapie',24,'Flacon 30ml','🌿','Draine, purifie, régénère le foie, désinfecte les voies urinaires.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(10,'Macérât de bourgeons de hêtre','Phytembryothérapie',24,'Flacon 30ml','🌿','Stimule les défenses immunitaires, lutte contre les infections.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(11,'Macérât de bourgeons de marronnier d\'inde','Phytembryothérapie',24,'Flacon 30ml','🌿','Tonique veineux. Vertus astringentes et anti-inflammatoires, tonifie les parois veineuses, prévient la rétention d\'eau.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(12,'Macérât de bourgeons de myrtillier','Phytembryothérapie',24,'Flacon 30ml','🫐','Anti-diarrhéique, restaure la flore intestinale, favorise l\'assimilation du sucre. Action sur la microcirculation rétinienne et cérébrale.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(13,'Macérât de bourgeons de sapin pectiné','Phytembryothérapie',24,'Flacon 30ml','🌲','Stimulant des fonctions respiratoires et de l\'appétit, des fonctions intellectuelles. Lutte contre la fatigue, anti-radicalaire et anti-oxydant.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(14,'Macérât de bourgeons de Tilleul','Phytembryothérapie',24,'Flacon 30ml','🌼','Apaisant du système nerveux, aide à l\'endormissement, détend et lutte contre les angoisses.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(15,'Macérât de bourgeons de figuier','Phytembryothérapie',24,'Flacon 30ml','🍃','Calmant et rééquilibrant du système nerveux. Action bénéfique sur les troubles digestifs liés au stress.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(16,'Macérât de bourgeons d\'érable commun','Phytembryothérapie',24,'Flacon 30ml','🍂','Régulateur du métabolisme, anti-inflammatoire. Draineur hépatique et biliaire, contribue à un meilleur métabolisme des lipides et du cholestérol.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(17,'Macérât de bourgeons de cornouiller sanguin','Phytembryothérapie',24,'Flacon 30ml','🌿','Facilite la circulation du sang dans les artères, abaisse la tension artérielle.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(18,'Macérât de bourgeons de framboisier','Phytembryothérapie',24,'Flacon 30ml','🍓','Réduit les spasmes utérins, régule les fonctions ovariennes, favorise l\'équilibre des cycles féminins.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(19,'Macérât de bourgeons de noisetier','Phytembryothérapie',24,'Flacon 30ml','🌿','Stimule l\'oxygénation des tissus pulmonaires, draineur pulmonaire. Anti-inflammatoire circulatoire. Agit sur insomnies, nervosité et fatigue.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(20,'Macérât de bourgeons de noyer','Phytembryothérapie',24,'Flacon 30ml','🌿','Renforce la flore intestinale et les défenses naturelles. Soutient le pancréas, antiparasitaire.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(21,'Macérât de bourgeons de pin sylvestre','Phytembryothérapie',24,'Flacon 30ml','🌲','Désinfectant des voies respiratoires, antiseptique, anti-inflammatoire, stimulant, reminéralisant et tonique.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(22,'Macérât de bourgeons de ronce','Phytembryothérapie',24,'Flacon 30ml','🌿','Régénère et oxygène les tissus défectueux pulmonaires. Contribue à l\'oxygénation des tissus articulaires. Léger effet phyto-œstrogénique.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(23,'Macérât de bourgeons de vigne','Phytembryothérapie',24,'Flacon 30ml','🍇','Propriétés circulatoires, lutte contre les déformations articulaires.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(24,'Macérât de jeunes pousses d\'olivier','Phytembryothérapie',24,'Flacon 30ml','🫒','Permet de diminuer le taux de cholestérol et de triglycérides. Fait baisser la glycémie.'), ingredients:BOURGEON_INGREDIENTS},
  {...P(25,'Synergie circulatoire','Synergies',24,'Flacon 30ml','❤️','À visée circulatoire veineuse et lymphatique.','Synergie'), ingredients:['Macérat de bourgeons de marronnier d\'Inde','Macérat de bourgeons de châtaignier','Macérat de bourgeons de chêne']},
  {...P(26,'Synergie Immun\'Air','Synergies',24,'Flacon 30ml','🛡️','Antivirale : puissante action anti-infectieuse et immunostimulante.','Synergie'), ingredients:['HE de niaouli','HE d\'origan compact','HE de cannelle de Ceylan','HE de tea tree (Melaleuca alternifolia)']},
  {...P(27,'Synergie\'Air','Synergies',24,'Flacon 30ml','🌬️','À visée respiratoire : stimulant, draineur et régénérant pulmonaire.','Synergie'), ingredients:['Macérat de bourgeons de noisetier','Macérat de bourgeons de ronce','Macérat de bourgeons de sapin pectiné','Macérat de bourgeons de pin sylvestre']},

  // ── Huiles Essentielles ───────────────────────────────────────────────────
  {...P(28,'HE Citron','Huiles Essentielles',6.8,'15ml','🍋','Huile essentielle de citron 100% pure et naturelle biologique.'), ingredients:['Huile essentielle 100% de citron'], usage:'Externe et voie orale'},
  {...P(29,'HE Poivre noir','Huiles Essentielles',12.9,'15ml','🌶️','Échauffe les muscles, antalgique et tonique. Propriétés anticatarrhales, expectorantes et fluidifiantes. Stimule le cuir chevelu.'), ingredients:['Huile essentielle 100% de poivre noir'], usage:'Externe et voie orale'},
  {...P(30,'HE Niaouli','Huiles Essentielles',9.8,'15ml','🌿','Immunostimulante, antibactérienne, anti-catarrhale, expectorante, antifongique et antivirale puissante.'), ingredients:['Huile essentielle 100% de niaouli'], usage:'Externe et voie orale'},
  {...P(31,'HE Cèdre d\'atlas','Huiles Essentielles',8.9,'15ml','🌲','Lipolytique et anti-cellulite, apaisante et cicatrisante. Régule la circulation du sang et de la lymphe.'), ingredients:['Huile essentielle 100% de cèdre de l\'Atlas'], usage:'Externe et voie orale'},
  {...P(32,'HE Eucalyptus globulus','Huiles Essentielles',6.8,'15ml','🌿','Libère les voies respiratoires basses. 100% pure et naturelle.'), ingredients:['Huile essentielle 100% d\'eucalyptus globulus'], usage:'Externe et voie orale'},
  {...P(33,'HE Romarin officinal','Huiles Essentielles',9.8,'15ml','🌿','CT Cinéole. Stimule la mémoire, anti-infectieuse respiratoire, expectorante et stimulante.'), ingredients:['Huile essentielle 100% de romarin officinal CT cinéole'], usage:'Externe et voie orale'},
  {...P(34,'HE Sarriette des montagnes','Huiles Essentielles',14.9,'15ml','🌿','Anti-infectieuse majeure, anti-fongique. Tonifiante générale et immunitaire. Soutien aux sphères digestive, respiratoire et urinaire.'), ingredients:['Huile essentielle 100% de sarriette des montagnes'], usage:'Externe et voie orale'},
  {...P(35,'HE Serpolet','Huiles Essentielles',9.4,'5ml','🌿','Antibactérienne, antivirale, antiparasitaire, antifongique, antiseptique, antispasmodique et expectorante.'), ingredients:['Huile essentielle 100% de serpolet'], usage:'Externe et voie orale'},
  {...P(36,'HE Encens d\'Inde','Huiles Essentielles',19.8,'15ml','🕯️','Boswellia serrata. Propriétés anti-inflammatoire, anxiolytique, expectorante et antalgique confirmées par des études.'), ingredients:['Huile essentielle 100% d\'encens d\'Inde (Boswellia serrata)'], usage:'Externe et voie orale'},
  {...P(37,'HE Eucalyptus citriodora','Huiles Essentielles',7.9,'15ml','🌿','Antidouleur, anti-infectieuse, anti-inflammatoire musculaire et articulaire. Insectifuge. Usage externe uniquement.'), ingredients:['Huile essentielle 100% d\'eucalyptus citriodora'], usage:'Externe uniquement'},
  {...P(38,'HE Origan compact','Huiles Essentielles',10.8,'15ml','🌿','Utile contre les troubles hivernaux, infections (cystites, mycoses). Virus, bactéricide. Huile essentielle puissante.'), ingredients:['Huile essentielle 100% d\'origan compact'], usage:'Externe et voie orale'},
  {...P(39,'HE Ylang-ylang','Huiles Essentielles',22.8,'15ml','🌸','Tonique florale. Son parfum détend et apporte bien-être. Équilibrante et régénérante, excellente pour la peau.'), ingredients:['Huile essentielle 100% d\'ylang-ylang'], usage:'Externe et voie orale'},
  {...P(40,'HE Bois de Hô','Huiles Essentielles',8.2,'15ml','🌿','Stimulation immunitaire et bienfaits anti-infectieux. En diffusion, pause stimulante et anti-stress. Régénération cutanée.'), ingredients:['Huile essentielle 100% de bois de Hô'], usage:'Externe et voie orale'},
  {...P(41,'HE Cajeput','Huiles Essentielles',5.9,'15ml','💧','Antidouleur, anti-infectieuse, antiseptique, décongestionnant veineux, expectorante, stimulante immunitaire.'), ingredients:['Huile essentielle 100% de cajeput'], usage:'Externe et voie orale'},
  {...P(42,'HE Camphrier','Huiles Essentielles',8.9,'15ml','🌿','CT Cinéole. Tonique général, stimulante, expectorante. Stimule les défenses immunitaires et active la circulation.'), ingredients:['Huile essentielle 100% de camphrier CT cinéole'], usage:'Externe uniquement'},
  {...P(43,'HE Cannelle feuille','Huiles Essentielles',11.5,'15ml','🍂','Efficace contre infections intestinales, urinaires, buccales et cutanées. Impuissance masculine. Somnolence, asthénies.'), ingredients:['Huile essentielle 100% de cannelle (feuille)'], usage:'Externe et voie orale'},
  {...P(44,'HE Carotte sauvage','Huiles Essentielles',15.9,'8ml','🥕','Nettoie et draine le foie et les reins. Régénérante hépatique, complémentaire en cas d\'hépatite virale ou cirrhose.'), ingredients:['Huile essentielle 100% de carotte sauvage'], usage:'Externe et voie orale'},
  {...P(45,'HE Cyprès','Huiles Essentielles',11.9,'15ml','🌲','Tonifiante veineuse, stimulante lymphatique. Jambes lourdes, varices, hémorroïdes. Toux et perte de la voix.'), ingredients:['Huile essentielle 100% de cyprès'], usage:'Externe et voie orale'},
  {...P(46,'HE Gaulthérie couchée','Huiles Essentielles',8.9,'15ml','🌿','Détente, contracture musculaire, préparation au sport.'), ingredients:['Huile essentielle 100% de gaulthérie couchée'], usage:'Externe uniquement'},
  {...P(47,'HE Genévrier','Huiles Essentielles',10.9,'15ml','🌿','Huile essentielle biologique 100% pure et naturelle.'), ingredients:['Huile essentielle 100% de genévrier'], usage:'Externe et voie orale'},
  {...P(48,'HE Géranium rosat','Huiles Essentielles',10.9,'15ml','🌸','Acné, brûlure, eczéma, plaie, impétigo, vergetures. Mycoses cutanées, gynécologiques et digestives.'), ingredients:['Huile essentielle 100% de géranium rosat'], usage:'Externe et voie orale'},
  {...P(49,'HE Laurier noble','Huiles Essentielles',9.8,'5ml','🌿','Huile essentielle biologique de laurier noble 100% pure et naturelle.'), ingredients:['Huile essentielle 100% de laurier noble'], usage:'Externe et voie orale'},
  {...P(50,'HE Lavande aspic','Huiles Essentielles',12.8,'15ml','💜','Apaise les brûlures et irritations de la peau, cicatrisante.'), ingredients:['Huile essentielle 100% de lavande aspic'], usage:'Externe et voie orale'},
  {...P(51,'HE Lavande vraie','Huiles Essentielles',10.8,'15ml','💜','Huile essentielle biologique 100% pure et naturelle. La lavande de référence.'), ingredients:['Huile essentielle 100% de lavande vraie'], usage:'Externe et voie orale'},
  {...P(52,'HE Marjolaine à coquille','Huiles Essentielles',12.5,'15ml','🌿','Équilibre et régule le système nerveux. Diminue la tension. Apaise la douleur.'), ingredients:['Huile essentielle 100% de marjolaine à coquille'], usage:'Externe et voie orale'},
  {...P(53,'HE Menthe poivrée','Huiles Essentielles',12.6,'15ml','🌿','Apaise les nausées et les maux de tête. Stimulante digestive.'), ingredients:['Huile essentielle 100% de menthe poivrée'], usage:'Externe et voie orale'},
  {...P(54,'HE Pin sylvestre','Huiles Essentielles',10.6,'15ml','🌲','Stimulant des surrénales. Dynamisme physique et vitalité intellectuelle.'), ingredients:['Huile essentielle 100% de pin sylvestre'], usage:'Externe et voie orale'},
  {...P(55,'HE Tea tree','Huiles Essentielles',8.9,'15ml','🌿','Antibactérienne, antifongique, anti-inflammatoire, antiparasitaire, antivirale, immunostimulante.'), ingredients:['Huile essentielle 100% de tea tree'], usage:'Externe et voie orale'},

  // ── Hydrolats ─────────────────────────────────────────────────────────────
  P(56,'Hydrolat d\'hélichryse italienne','Hydrolats',10,'50ml','🌼','Anti-hématomes, favorise la résorption des bleus. Excellent pour les peaux matures et acnéiques.'),
  P(57,'Hydrolat de basilic sacré','Hydrolats',12,'50ml','🌿','Plante adaptogène : augmente la capacité de notre corps à s\'adapter au stress. Fortifie l\'immunité, soulage les problèmes digestifs.'),
  P(58,'Hydrolat de bleuet','Hydrolats',10,'50ml','💙','Action spécifique pour les yeux. Adoucissant, calme les irritations et gonflements.'),
  P(59,'Hydrolat de carotte sauvage','Hydrolats',10,'200ml','🥕','Excellent régénérant cellulaire idéal pour les peaux matures. Revitalise les peaux ternes et apaise les irritations.'),
  P(60,'Hydrolat de cassis','Hydrolats',10,'200ml','🫐','Diurétique, digestif, anti-inflammatoire articulaire. Antioxydant. Stimule l\'immunité.'),
  P(61,'Hydrolat de Cataire citronnée','Hydrolats',14,'500ml','🌿','Anti-inflammatoire, calmante, sédative. Blépharites, conjonctivites, antiviral. Calme la digestion. Aide à harmoniser la ménopause.'),
  P(62,'Hydrolat de coriandre','Hydrolats',10,'200ml','🌿','Stimule la digestion, combat les ballonnements. Apaise les brûlures d\'estomac. Lutte contre les infections virales et bactériennes.'),
  P(63,'Hydrolat de géranium rosat','Hydrolats',10,'200ml','🌸','Apaisant, régénérant, cicatrisant.'),
  P(64,'Hydrolat de grande camomille','Hydrolats',10,'200ml','🌼','Apaisant, décongestionnant, adoucissant. En interne, soulage le foie et apaise les inflammations digestives.'),
  P(65,'Hydrolat de lavande vraie','Hydrolats',10,'200ml','💜','Apaisant, adoucissant, favorise l\'endormissement et la détente. Distillation par vapeur d\'eau, sans conservateur.'),
  P(66,'Hydrolat de livèche','Hydrolats',14,'500ml','🌿','Digestif, antispasmodique. Diurétique, élimine l\'acide urique. Excellent anti-inflammatoire dans l\'arthrite et les rhumatismes.'),
  P(67,'Hydrolat de menthe poivrée','Hydrolats',10,'200ml','🌿','Grande fraîcheur. Digestif, rafraîchissant.'),
  P(68,'Hydrolat de rose de Provins','Hydrolats',10,'200ml','🌹','Adoucissant, régénérant. Distillation par vapeur d\'eau, sans conservateur.'),
  P(69,'Hydrolat de sauge officinale','Hydrolats',14,'500ml','🌿','Régénérant et antioxydant. Purifiant, équilibrant, régule la transpiration excessive. Embellisseur capillaire.'),
  P(70,'Hydrolat de tanaisie annuelle','Hydrolats',10,'200ml','🌿','Aide à lutter contre les parasites intestinaux. Tonique et stimulant des organes digestifs.'),

  // ── Synergies ─────────────────────────────────────────────────────────────
  {...P(71,'O\'Verlin','Synergies',24,'Flacon 30ml','🌿','Synergie antiparasitaire.','Synergie'), ingredients:['HE de thym à thymol','HE de cannelle feuilles','HE de tea tree','HE de menthe poivrée','Coque de noix verte','Camomille allemande'], usage:'Voie orale.'},
  P(72,'Sibo\'Lin','Synergies',28,'Flacon 30ml','🌿','Complexe d\'huiles essentielles pour réguler la prolifération bactérienne dans l\'intestin grêle. Apaise les ballonnements et améliore la digestion.','Synergie'),
  {...P(73,'Synergie Aphtes & Mycoses','Synergies',14,'Flacon 15ml','💧','Contre les aphtes et les mycoses.','Synergie'), usage:'À appliquer directement sur l\'aphte, 2 à 3 fois par jour.'},
  {...P(74,'Synergie hydrolat équilibrante','Synergies',14,'Flacon 500ml','💧','Apaise, détend, équilibre le système nerveux et prépare au sommeil.','Synergie'), ingredients:['Hydrolat de lavande vraie','Hydrolat de grande camomille','Hydrolat de mélisse officinale','Hydrolat de géranium rosat']},
  {...P(75,'Synergie HE Verrue & Sarcoïde','Synergies',16,'Flacon 15ml','💧','Traitement des verrues et sarcoïdes. Déconseillé aux enfants de moins de 7 ans.','Synergie'), usage:'À appliquer directement sur la verrue, 2 à 3 fois par jour jusqu\'à disparition.'},

  // ── Tisanes & Plantes ─────────────────────────────────────────────────────
  P(76,'Achillée millefeuille','Tisanes & Plantes',5,'25g','🌿','Stimule l\'appétit, soulage les troubles digestifs, les douleurs menstruelles et les spasmes abdominaux. Cicatrisant en usage externe.'),
  P(77,'Alchémille','Tisanes & Plantes',5,'25g','🌿','Propriétés dites lutéiniques, proche de la progestérone. Astringente, antihémorragique, cicatrisante, anti-oxydante.'),
  P(79,'Synergie Articulations','Synergies',6,'25g','🦴','Soulage, désenflamme, libère les articulations douloureuses et entretient la bonne mobilité.','Synergie'),
  P(80,'Bourrache','Tisanes & Plantes',5,'25g','🌿','Puissant dépuratif qui nettoie l\'organisme en profondeur en le débarrassant de ses toxines.'),
  P(81,'Camomille allemande','Tisanes & Plantes',5,'25g','🌼','Douce pour le foie et les intestins.'),
  P(82,'Camomille romaine','Tisanes & Plantes',6.5,'25g','🌼','Tonique, stimulante, stomachique, antispasmodique, analgésique et fébrifuge. En externe : antiseptique et anti-inflammatoire.'),
  {...P(83,'Synergie Détente','Synergies',6,'25g','💫','Mélange de plantes à visée relaxante.','Synergie'), ingredients:['Aubépine','Lavande','Rose de Provins','Tilleul']},
  {...P(84,'Synergie Détente','Synergies',11,'50g','💫','Synergie de plantes pour favoriser la détente et éliminer le stress.','Synergie'), ingredients:['Aubépine','Lavande','Tilleul','et autres plantes']},
  P(85,'Épilobe à petites fleurs','Tisanes & Plantes',5.9,'25g','🌿','Très efficace pour réguler les problèmes de prostate. Cultivée sur la propriété, sans pesticides. Récolte manuelle, séchage naturel.','Local'),
  {...P(86,'Synergie Équilibre hormonal','Synergies',6,'25g','🌸','Équilibrant sur le système hormonal.','Synergie'), ingredients:['Alchémille des Alpes','Achillée millefeuille','Feuille de framboisier','Sauge','Bourrache','Rose de Provins']},

  // ── Baumes ────────────────────────────────────────────────────────────────
  {...P(87,'Baume à l\'arnica','Baumes',9.8,'30g','🏺','Apaise les coups, les bosses et les courbatures.'), ingredients:['Macérat oléique d\'arnica biologique','Cire d\'abeille','HE de cyprès biologique','HE de genévrier biologique']},
  {...P(88,'Baume Acné','Baumes',16,'30g','🏺','Assainit, purifie, cicatrise et hydrate profondément.'), ingredients:['Macérat de calendula','Macérat de millepertuis','Huile de nigelle bio','Hydrolat de lavande','HE de tea tree','HE de pamplemousse','HE de camomille romaine']},
  {...P(89,'Baume Acné Rosacée','Baumes',18,'30g','🏺','Atténue les rougeurs, apaise et décongestionne.'), ingredients:['Macérat de calendula','Macérat de millepertuis','Macérat d\'hélichryse','Beurre de karité','Hydrolat de rose de Provins','HE de carotte','HE de lavande sauvage','HE de camomille romaine','HE de géranium bourbon','HE de cyprès']},
  {...P(90,'Baume Anti dermite répulsif insectes','Baumes',24,'180g','🏺','Calme les démangeaisons, éloigne les insectes, formule cicatrisante.'), ingredients:['Macérat de calendula','Macérat de camomille','Beurre de karité','Cire d\'abeille','HE de géranium rosat','HE de lavande','HE de carotte','HE de palmarosa','HE d\'eucalyptus citriodora','HE de cajeput']},
  {...P(92,'Baume calendula','Baumes',14,'30g','🌼','Irritations, coups de soleil, cicatrisation, régénérant.'), ingredients:['Macérat de calendula sur huile d\'olive biologique','HE de lavande vraie','Cire d\'abeille']},
  {...P(93,'Baume BomHémo','Baumes',18,'30g','🏺','Traitement des hémorroïdes.'), ingredients:['Macérat d\'achillée millefeuille','Macérat d\'hélichryse italienne','HE de lavande','HE de carotte sauvage','HE de camomille','HE de palmarosa','HE de genévrier','Cire d\'abeille'], usage:'Application externe, 1 à 2 fois par jour.'},
  {...P(94,'Baume calendula','Baumes',32,'100g','🌼','Baume de calendula régénérant et cicatrisant.'), ingredients:['Fleurs de calendula cultivées sans engrais chimique','Huile d\'olive biologique']},
  {...P(136,'Baume calendula','Baumes',26,'60g','🌼','Baume de calendula régénérant et cicatrisant.'), ingredients:['Macérat de calendula sur huile d\'olive biologique','HE de lavande vraie','Cire d\'abeille']},
  {...P(95,'Baume couperose et rougeurs diffuses','Baumes',16,'30g','🌸','Décongestionnant, calmant, adoucissant.'), ingredients:['Macérat de calendula','Macérat de camomille','Macérat d\'hélichryse','Beurre de karité','HE de cyprès','HE d\'hélichryse','HE de romarin à verbénone','HE de camomille romaine']},
  P(96,'Baume d\'hélichrysum italicum','Baumes',14,'30g','💙','Coups, bosses, mauvaise circulation sanguine.'),
  {...P(97,'Baume féminité','Baumes',24,'30g','🌸','Irritation, sécheresse vaginale, pertes blanches.'), ingredients:['Beurre de karité','Macérat de calendula','Beurre de cacao cru','Huile de calophyllum','HE de tea tree','HE de bois de Hô','HE de sauge sclarée','HE d\'origan compact','HE de thym à thymol','HE de palmarosa'], usage:'Usage interne.'},
  {...P(98,'Baume Karité calendula','Baumes',16,'30g','🏺','Nourrit et protège les peaux sèches et sensibles. Idéal pour les lèvres sèches.'), ingredients:['Beurre de karité','Macérat de fleurs de calendula','Cire d\'abeille','HE d\'Ylang ylang']},
  {...P(99,'Baume verrue sarcoïde','Baumes',16,'30g','🏺','Très concentré en huiles essentielles. Déconseillé aux femmes enceintes et aux enfants de moins de 7 ans.'), usage:'À appliquer chaque jour sur la verrue jusqu\'à disparition.'},

  // ── Savons — Mille Bulles, la savonnerie artisanale de la Source ──
  {...P(100,'Savon au calendula et lavande vraie','Savons',4,'100g','🧼','Savon doux au calendula et à la lavande vraie. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Beurre de coco','Beurre de karité','Huile d\'olive','Macérat de calendula','HE de lavande vraie']},
  {...P(101,'Savon citron et romarin','Savons',7,'150g','🧼','Purifiant et rafraîchissant. Mille Bulles, la savonnerie artisanale de la Source.'), ingredients:['Beurre de coco bio','Beurre de karité bio','Huile d\'olive bio','Zeste de citron','Feuilles de romarin officinal']},
  {...P(102,'Savon à l\'écorce d\'orange','Savons',4,'100g','🧼','Très doux pour les peaux sensibles du visage et du corps, peaux acnéiques ou à tendance eczéma. Mille Bulles, la savonnerie artisanale de la Source.'), ingredients:['100% huile d\'olive biologique','Zeste d\'orange']},
  {...P(103,'Savon à l\'huile d\'argan et Ylang ylang','Savons',5,'100g','🧼','Actif sur les peaux grasses et acnéiques, anti-inflammatoire et protecteur — savon traitant, très doux. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'argan','HE d\'Ylang ylang']},
  {...P(104,'Savon à l\'huile de carotte','Savons',5,'100g','🧼','Savon bonne mine à la carotte. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile de carotte','HE de carotte']},
  {...P(105,'Savon à l\'huile de coco','Savons',5,'100g','🧼','Savon doux à l\'huile de coco. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile de coco']},
  {...P(106,'Savon à l\'huile de jojoba et Ylang ylang','Savons',5,'100g','🧼','Savon nourrissant au jojoba et à l\'Ylang ylang. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile de jojoba','Beurre de karité','Beurre de coco','HE d\'Ylang ylang']},
  {...P(107,'Savon à l\'huile de millepertuis','Savons',5,'100g','🧼','Savon apaisant à l\'huile de millepertuis. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'olive','Huile de millepertuis']},
  {...P(108,'Savon à l\'huile de rose musquée','Savons',5,'100g','🧼','Savon régénérant à la rose musquée. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Beurre de coco','Huile d\'olive biologique','Huile de rosier muscat','Feuilles de rose de Provins']},
  {...P(125,'Savon Vulcano','Savons',5,'100g','🧼','Savon purifiant au charbon végétal et à l\'argile rouge, parfumé au lemongrass. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'olive','Beurre de karité','Huile de coco','Huile de carthame','HE de lemongrass','Argile rouge','Charbon végétal']},
  {...P(126,'Savon Carrotin','Savons',5,'100g','🧼','Savon bonne mine au jus de carotte, à l\'huile de noisette et à l\'argile rouge. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'olive','Beurre de karité','Huile de coco','Jus de carotte','Huile de noisette','Argile rouge','HE de cèdre d\'Atlas','HE d\'orange','HE de géranium']},
  {...P(127,'Savon Douceur Miel','Savons',5,'100g','🧼','Savon doux et nourrissant au miel, à la cire d\'abeille et à la rose. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'olive','Beurre de karité','Huile de coco','Cire d\'abeille','Miel','Poudre de rose séchée','Curcuma']},
  {...P(128,'Savon Lavandou','Savons',5,'100g','🧼','Savon relaxant au lavandin, délicatement teinté d\'oxyde minéral bleu. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'olive','Beurre de karité','Huile de coco','HE de lavandin','Oxyde minéral bleu']},
  {...P(129,'Savon Grain de Café','Savons',5,'100g','🧼','Savon gommant aux grains de café, huile de jojoba, orange et thym. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'olive','Beurre de karité','Huile de coco','Huile de jojoba','HE d\'orange','HE de thym','Café']},
  {...P(130,'Savon Canelange','Savons',5,'100g','🧼','Savon chaleureux et gourmand à la cannelle et à l\'orange. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'olive','Beurre de karité','Huile de coco','Huile de sésame','HE d\'orange','HE de cannelle','Cannelle en poudre']},
  {...P(131,'Savon Menthus','Savons',5,'100g','🧼','Savon tonifiant et frais à la menthe, l\'eucalyptus et trois argiles. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'olive','Beurre de karité','Huile de coco','HE de menthe','HE d\'eucalyptus globulus','HE de cèdre','Argile rouge','Argile verte','Argile jaune']},
  {...P(132,'Savon Patchou','Savons',5,'100g','🧼','Savon envoûtant au patchouli, cèdre d\'Atlas et huile de bourrache. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'olive','Beurre de karité','Huile de coco','Huile de bourrache','HE de patchouli','HE de cèdre d\'Atlas','HE d\'orange','Argile blanche','Argile rouge']},
  {...P(133,'Savon à l\'huile d\'avocat','Savons',5,'100g','🧼','Savon nourrissant à l\'huile d\'avocat. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile d\'avocat','Beurre de coco','Beurre de karité','Huile d\'olive']},
  {...P(134,'Savon huile de Nigelle & rosier musquée','Savons',5,'100g','🧼','Savon régénérant à l\'huile de nigelle et de rose musquée. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Huile de nigelle','Huile de rosier muscat','Beurre de coco','Beurre de karité','Huile d\'olive']},
  {...P(135,'Savon son d\'avoine & argile blanche','Savons',5,'100g','🧼','Savon doux et légèrement exfoliant au son d\'avoine et à l\'argile blanche. Mille Bulles, la savonnerie artisanale de la Source.','Mille-Bulles'), ingredients:['Son d\'avoine','Argile blanche','Beurre de coco','Beurre de karité','Huile d\'olive']},

  // ── Miellerie ────────────────────────────────────────────────────────────
  {...P(109,'Traitement Anti varroa','Miellerie',9,'Flacon 50ml','🐝','Traitement naturel pour ruches. Correspond au traitement de 2 ruches.'), ingredients:['HE d\'eucalyptus smithii','Camphre','HE de menthe poivrée mitcham','HE de thym (thymol et thujanol)','Alcool']},
  {...P(111,'Miel Toutes Fleurs','Miellerie',9,'Pot 500g','🍯','Miel toutes fleurs récolté auprès de nos 6 ruches Buckfast sédentaires. Non chauffé, il conserve tous ses enzymes, pollens et arômes.'), ingredients:['Miel toutes fleurs 100% pur'], usage:'À tartiner, à diluer dans une boisson chaude, ou tel quel à la cuillère.'},
  {...P(112,'Miel Toutes Fleurs','Miellerie',16,'Pot 1kg','🍯','Le même miel toutes fleurs de la ferme, en grand format. Récolté auprès de nos 6 ruches Buckfast, reflet des floraisons sauvages et médicinales de la Bresse.'), ingredients:['Miel toutes fleurs 100% pur'], usage:'À tartiner, à diluer dans une boisson chaude, ou tel quel à la cuillère.'},

  // ── Tisanes (12ème produit manquant) ─────────────────────────────────────
  {...P(110,'Détente Elixirs','Tisanes & Plantes',24,'Flacon 50ml','💫','Apaise, combat le stress et les troubles du sommeil.'), ingredients:['Extrait d\'aubépine','Extrait de mélisse','Extrait de pavot de Californie','Macérat de bourgeons de tilleul']},

  // ── Laine ─────────────────────────────────────────────────────────────────
  // Prix réels repris de l'ancien site (loasisenfleurs.com). Créations = pièces uniques tricotées main.
  // Pelotes : 8 coloris au même prix, regroupés sur une fiche (photo = coloris Naturel).
  {...P(113,'Pelote 25 g — Mohair & Soie','Laine',10.6,'25 g · 125 m','🧶','Fil à tricoter artisanal 77% mohair (Super Kids) et 23% soie — pelote de 25 g / 125 m. Coloris disponibles : Naturel, Rubis, Bordeaux, Potiron, Lagon, Émeraude.'), ingredients:['77% mohair (Super Kids)','23% soie']},
  // Créations avec photo :
  P(114,'Étole mohair et soie','Laine',140,'Pièce unique','🧶','Étole tricotée main en double fil de mohair et soie, bord festonné au crochet. Légère, chaude et enveloppante.','Fait main'),
  P(115,'Écharpe alpaga huacaya — Naturel','Laine',80,'Pièce unique','🧶','Écharpe tricotée main en alpaga huacaya, coloris naturel. Douce, chaude et légère.','Fait main'),
  P(116,'Écharpe mohair et soie — Rouge & Fushia','Laine',110,'Pièce unique','🧶','Écharpe tricotée main en double fil de mohair et soie, tons rouge rubis et rose fushia. Chaude et légère.','Fait main'),
  P(118,'Pull sans manche mohair et soie — Rubis','Laine',110,'Pièce unique','🧶','Pull sans manche tricoté main en mohair et soie, coloris rubis. Ouvert sur les côtés, se noue par cordelettes.','Fait main'),
  P(119,'Pull mohair et soie','Laine',170,'Taille 36/38','🧶','Pull manches longues tricoté main en mohair et soie. Chaud, léger et aérien.','Fait main'),
  P(120,'Pull tunique mohair et soie','Laine',118,'Taille 36 à 40','🧶','Pull tunique long tricoté main en mohair et soie, à porter en robe.','Fait main'),
  // Pièces du catalogue sans photo pour l'instant (emoji en attendant) :
  P(121,'Écharpe à pointe poitrine — Naturel','Laine',110,'Pièce unique','🧶','Écharpe longue en Super Kids mohair et soie, avec pointe sur la poitrine. Coloris naturel.','Fait main'),
  P(122,'Écharpe mohair, soie & mérinos — Rose poudrée','Laine',118,'Pièce unique','🧶','Écharpe à plastron, mélange mohair kids, soie et mérinos. Coloris rose poudrée.','Fait main'),
  P(123,'Écharpe tissée main','Laine',139,'2 m × 40 cm','🧶','Écharpe en Super Kids mohair et soie, tissée main. Tons prune, potiron et anis.','Fait main'),
  P(124,'Pull alpaga huacaya — Naturel','Laine',240,'Taille 36 à 40','🧶','Pull 100% alpaga huacaya, filé et tricoté main. Coloris naturel.','Fait main'),
]
