# 🗺️ La Base — Tableau de bord des chantiers

> Source de vérité unique. On coche au fur et à mesure.
> Légende statut : ✅ Fait · 🔜 À faire · 🏗️ En cours · 👤 Action Tom (manuel)
> Effort : S (petit) · M (moyen) · L (gros) · Impact : ⭐ → ⭐⭐⭐⭐⭐
> Dernière mise à jour : 2026-06-01

---

## 🅰️ Fidélité / Rétention

| # | Chantier | Impact | Effort | Statut |
|---|----------|:------:|:------:|:------:|
| A1 | **Mini-palier cadeau accessible** (ex. 100 XP = 1 boost) — effet "goût" dès la 1ère visite | ⭐⭐⭐⭐ | S | ✅ |
| A2 | **Défis / missions hebdo** ("commande 2× → +100 XP", "commande 3× → +250 XP") — LE levier de fréquence | ⭐⭐⭐⭐⭐ | M | ✅ |
| A3 | **Streaks** (séries de visites : 3 semaines d'affilée → bonus) | ⭐⭐⭐ | M | 🔜 |
| A4 | Programme XP / paliers / roue / anniversaire / relance 14j | ⭐⭐⭐⭐ | — | ✅ |

## 🅱️ Acquisition / Viralité

| # | Chantier | Impact | Effort | Statut |
|---|----------|:------:|:------:|:------:|
| B1 | **Parrainage viral** (lien unique, +500 XP à la 1ère commande du filleul) | ⭐⭐⭐⭐⭐ | — | ✅ |
| B2 | **Nudges panier** (créer un compte / tourner la roue avant de valider) | ⭐⭐⭐⭐ | — | ✅ |
| B3 | **Kit QR magasin** (affiche imprimable `/affiche`) | ⭐⭐⭐⭐ | — | ✅ (codé) |
| B4 | **Push ciblées / segmentées** (Tous, Dormants 21j, Actifs 14j, VIP) | ⭐⭐⭐⭐ | M | ✅ |

## 🆑 Conversion vers le coaching (la marge)

| # | Chantier | Impact | Effort | Statut |
|---|----------|:------:|:------:|:------:|
| C1 | **Carte "Bilan offert"** ciblée clients chauds (≥3 commandes) → /club | ⭐⭐⭐⭐ | — | ✅ |
| C2 | **Défi bien-être communautaire** (challenge 7 jours relié au bilan) | ⭐⭐⭐⭐ | L | 🔜 |
| C3 | Page Le Club + onglet hub + lien bilan/opportunité | ⭐⭐⭐ | — | ✅ |

## 🇩 UX / Parcours

| # | Chantier | Impact | Effort | Statut |
|---|----------|:------:|:------:|:------:|
| D1 | **"🔁 Recommander"** (Order Again) sur l'accueil — re-remplit le panier en 1 tap | ⭐⭐⭐⭐ | M | ✅ |
| D2 | **Édition d'un article dans le panier** (modifier sans supprimer) | ⭐⭐⭐ | M | 🔜 |
| D3 | **Bouton "Installer l'app"** Android/PC (beforeinstallprompt) | ⭐⭐⭐ | S | ✅ |
| D4 | Panier persistant (survit à l'inscription) | ⭐⭐⭐⭐ | — | ✅ |
| D5 | Accueil refondu (fidélité en pierre angulaire, quick actions) | ⭐⭐⭐ | — | ✅ |

## ⚙️ Opérationnel / Comptoir

| # | Chantier | Impact | Effort | Statut |
|---|----------|:------:|:------:|:------:|
| O1 | **Notif admin** sur commande espèces (push PC + iPhone) | ⭐⭐⭐⭐⭐ | — | ✅ |
| O2 | **Détail des articles** au Comptoir (quoi préparer) | ⭐⭐⭐⭐⭐ | — | ✅ |
| O3 | **Horaires pilotables** depuis la console (Auto/Forcer ouvert/fermé) | ⭐⭐⭐ | — | ✅ |
| O4 | **Dashboard entonnoir** + compteurs parrainage | ⭐⭐⭐ | — | ✅ |
| O5 | Scanner caisse + icône PWA dédiée | ⭐⭐⭐ | — | ✅ |

## 🧹 Qualité / Dette technique

| # | Chantier | Impact | Effort | Statut |
|---|----------|:------:|:------:|:------:|
| Q1 | Fix bug XP espèces (Mardi Double) + "Goodies"→FR + code mort | ⭐⭐⭐ | — | ✅ |
| Q2 | Hook useCart (découpage App.tsx) | ⭐⭐ | — | ✅ |
| Q3 | 🔴 Robustesse Square (ordre débit XP, code promo, audit XP) — **session dédiée + test paiement** | ⭐⭐⭐ | L | 🔜 |
| Q4 | Dédup helpers loyalty côté api/ (test déploiement Vercel requis) | ⭐ | S | 🔜 |

## 👤 Actions manuelles (Tom)

| # | Action | Statut |
|---|--------|:------:|
| T1 | Définir `CRON_SECRET` dans Vercel | ✅ |
| T2 | Jouer migrations 008 (parrainage) + 009 (horaires) en base | ✅ (008) / ⬜ vérifier 009 |
| T3 | Imprimer l'affiche QR (`/affiche`) et la poser au comptoir | 👤 🔜 |
| T4 | Mettre `/jeu` en bio Instagram + plan de contenu | 👤 🔜 |
| T5 | Vérifier notifs activées sur compte Mélanie (pour recevoir les commandes) | 👤 🔜 |

---

## 🎯 Ordre conseillé (ROI / effort, sans toucher Square)
1. **D1 — Recommander (Order Again)** → gros effet fréquence, quick win
2. **A1 — Mini-palier cadeau** → accroche rapide
3. **A2 — Défis hebdo** → le plus gros levier de fréquence
4. **B4 — Push ciblées** → transforme la fidélité en CA
5. **D2 + D3 — Édition panier + install Android** → polish UX
6. **C2 — Défi bien-être** → pont coaching (la marge)
