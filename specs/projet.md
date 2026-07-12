# Commande en ligne réelle — L'Oasis en Fleurs

## Objectif

Aujourd'hui, le bouton "Commander" de la boutique affiche un message de succès factice et vide le panier, mais n'envoie réellement rien : aucun paiement n'a lieu, Agnès n'est jamais prévenue. L'objectif est de remplacer ce parcours simulé par une vraie commande en ligne : le client paie réellement, l'argent arrive sur le compte d'Agnès, Agnès est prévenue automatiquement, et le stock se met à jour sans intervention manuelle.

## Besoins exacts

- **Paiement** : intégration de Stripe (compte déjà existant chez Agnès, statut auto-entrepreneur/entreprise avec compte bancaire pro) pour encaisser réellement les commandes passées sur le site.
- **TVA** : Agnès facture la TVA sur ses ventes. Le taux exact est à confirmer avec elle avant la configuration de Stripe.
- **Livraison** : expédition postale en France uniquement (la vente directe à la ferme existe mais reste marginale, hors périmètre prioritaire). Agnès a déjà une grille de frais de port issue de son activité existante — à récupérer auprès d'elle avant la mise en prod.
- **Gestion des stocks** :
  - Le stock est géré dans un tableau Google Sheets (une colonne "stock" par produit), qu'Agnès modifie elle-même directement — aucune nouvelle interface ni mot de passe à apprendre.
  - Le site lit ce tableau pour savoir, au moment de l'achat, si un produit est disponible.
  - Après un paiement réussi, le stock du produit acheté est décrémenté automatiquement dans le tableau, sans action d'Agnès.
- **Notification de commande** : à chaque commande payée, un email automatique est envoyé à `contact@loasisenfleurs.com` avec le détail de la commande (produits, quantités, montant) et l'adresse de livraison du client.
- **Hébergement** : le site est déjà en ligne sur Netlify, actuellement sur le plan gratuit avec un nom de domaine temporaire. Le passage au plan payant / nom de domaine définitif se fera une fois le site finalisé.
- **Calendrier** : pas de deadline fixée. Ce chantier peut avancer en parallèle de l'ajout des photos produits (sujet séparé, en attente).

## Cas limites

- **Rupture de stock** : si un produit est à 0 (ou que sa disponibilité ne peut pas être vérifiée), l'achat doit être **bloqué avant le paiement**, avec un message d'erreur clair affiché au client.
- **Concurrence** : si deux clients tentent d'acheter le dernier exemplaire au même moment, la vérification du stock doit se faire en temps réel au moment du paiement pour empêcher la survente.
- **Tableau Google Sheets indisponible** : si le tableau ne répond pas au moment où un client passe en caisse (panne, problème réseau), l'achat est **bloqué par sécurité** et un message d'erreur est affiché — on ne laisse jamais passer une commande sans vérification du stock.
- **Annulation / remboursement** : géré manuellement par Agnès depuis son tableau de bord Stripe (remboursement +, si besoin, remise à jour manuelle du stock dans le tableau). Cas jugé rare ; aucune fonctionnalité dédiée n'est nécessaire sur le site pour cette première version.

## Définition de "terminé"

Un test de commande réel et complet, de bout en bout :
1. Un paiement (petit montant) est effectué sur le site via Stripe et confirmé comme arrivé sur le compte d'Agnès.
2. Le stock du produit acheté diminue correctement et automatiquement dans le tableau Google Sheets.
3. L'email de notification de commande arrive bien à `contact@loasisenfleurs.com`, avec les bons détails (produits, quantités, montant, adresse de livraison).

## Points à confirmer avec Agnès avant mise en prod

- Grille exacte des frais de port (montants, éventuel seuil de livraison gratuite).
- Taux de TVA exact à appliquer dans Stripe.
