# La Base Shakes & Drinks — Chantiers futurs

> Document de cadrage pour les fonctionnalités à venir.
> **Pas d'implémentation tant que ce document n'est pas validé par Tom.**
> Mis à jour pour la dernière fois : 2026-05-26.

---

## 🎯 Vue d'ensemble

Trois grands chantiers viendront enrichir l'app **après** la refonte structurelle :

| # | Chantier | Dépendance | Effort |
|---|----------|-----------|--------|
| 1 | Notifications push | Service Worker complet + backend | ~1 session |
| 2 | Comptes clients + VIP | Auth + DB + webhook Square | ~2 sessions |
| 3 | Gamification (XP + Roue) | Chantier 2 obligatoire | ~2 sessions |

**Stack backend retenue** : Supabase (Postgres + Auth magic link + Edge Functions).
**Auth** : Magic link email uniquement (zéro friction, zéro mot de passe).

---

## 1. Notifications push 🔔

**Objectif** : pouvoir alerter d'un coup tous les clients qui ont installé la PWA quand on lance une nouveauté ou un événement.

### Cas d'usage
- "Nouveau shake Spéculoos dispo aujourd'hui 🍪"
- "Happy hour : -20% sur tous les drinks de 17h à 19h"
- "Combo Power offert pour les 10 premières commandes du week-end"

### Composants à construire
- **Service Worker** complet (`public/sw.js`) avec handlers `push` et `notificationclick`
- **VAPID keys** générées une fois, stockées en variables d'env Vercel
- **Table Supabase** `push_subscriptions` (user_id nullable, endpoint, keys, created_at, last_used_at)
- **Page front** : banner "Activer les notifs" affiché après la 1ère commande réussie (moment de meilleure conversion)
- **API route** `/api/push/subscribe` qui sauve l'abonnement
- **Mini back-office** `/admin` protégé par mot de passe simple (Tom uniquement) :
  - Champ titre + message + emoji + image optionnelle
  - Bouton "Envoyer à tous"
  - Historique des envois (date, titre, nombre de destinataires)
- **Edge Function Supabase** ou Vercel API qui boucle sur les subscriptions et envoie

### Risques / gardes-fous
- iOS n'a supporté les push web qu'à partir d'iOS 16.4 et **uniquement pour les PWA installées**. Communication nécessaire.
- Throttling : ne jamais envoyer plus d'1 notif / jour / utilisateur (lassitude → désinstall).
- Bouton "Désactiver les notifs" toujours accessible dans Réglages.

---

## 2. Comptes clients + statut VIP 👤

**Objectif** : permettre au client de retrouver ses commandes, fidéliser les habitués avec un statut VIP automatique, préparer la gamification.

### Flow de connexion
1. Bouton "Mon compte" dans le header (au lieu de l'icône panier vide actuellement)
2. Saisie email → magic link envoyé par Supabase Auth
3. Clic sur le lien → connecté
4. Première connexion → demande prénom + (optionnel) date d'anniversaire

### Modèle de données (Supabase)
```sql
profiles (
  id uuid primary key references auth.users,
  first_name text,
  birthday date,
  total_spent_cents int default 0,
  total_orders int default 0,
  vip_tier text default 'starter',  -- starter | regulier | vip | elite | legende
  xp int default 0,
  created_at timestamp default now()
)

orders (
  id uuid primary key,
  user_id uuid references profiles,
  square_order_id text unique,
  total_cents int,
  status text,  -- pending | paid | cancelled
  created_at timestamp
)

order_items (
  id uuid primary key,
  order_id uuid references orders,
  product_name text,
  option_label text,
  quantity int,
  unit_price_cents int
)

wheel_spins (
  id uuid primary key,
  user_id uuid references profiles,
  reward_code text,        -- ex: GAUFRE-OFFERTE-XYZ
  reward_label text,       -- "Gaufre offerte"
  used_at timestamp null,  -- null = pas encore consommé
  expires_at timestamp,
  spun_at timestamp default now()
)
```

### Paliers VIP (basés sur le total cumulé)
| Tier | Seuil | Avantages |
|------|-------|-----------|
| Starter | 0€ | Compte basique, historique |
| Régulier | 50€ cumulés | -5% permanent en checkout |
| VIP | 150€ cumulés | -10% + accès anticipé nouveautés (push prioritaire) |
| Élite | 400€ cumulés | -15% + 1 gaufre offerte / mois |
| Légende | 800€ cumulés | -15% + invitation événements + recettes en avant-première |

### Webhook Square (obligatoire pour la fiabilité)
- `POST /api/square-webhook` reçoit `payment.created` et `payment.updated`
- Vérification de la signature Square
- Si statut COMPLETED → marquer l'order comme `paid`, incrémenter `total_spent_cents` et `total_orders`, recalculer `vip_tier`, créditer XP
- Sans ce webhook, le compteur VIP ne peut pas être fiable (le redirect `?payment=success` côté client peut être bypassed)

### Page "Mon compte"
- Prénom + tier VIP avec barre de progression vers tier suivant
- Anniversaire (édition possible)
- Historique des 10 dernières commandes (cliquable → re-commander d'un clic)
- Codes promo actifs (de la roue) avec date d'expiration
- Bouton "Se déconnecter"

---

## 3. Gamification — XP + Roue des cadeaux 🎮

**Objectif** : créer un système de jeu inspiré de l'app La Base 360 pour ramener les clients régulièrement, sans dépendre du discount.

### Système XP

**Sources de XP**
| Action | XP |
|--------|-----|
| 1€ dépensé | +10 |
| Commande validée | +50 |
| Première commande | +200 (one-shot) |
| Avis Google laissé | +300 (one-shot, vérification manuelle ou via clic sur lien tracé) |
| Anniversaire | +500 (auto) |
| Parrainage validé (filleul fait sa 1ère commande) | +500 |
| Spin de la roue hebdomadaire | +25 |
| Streak (3 sem d'affilée) | +100 bonus |

**Paliers XP** (indépendants des paliers VIP financiers — pour le fun pur)
| Niveau | XP requis | Badge |
|--------|-----------|-------|
| 1 — Apprenti | 0 | 🌱 |
| 2 — Régulier | 500 | ⚡ |
| 3 — Fidèle | 1500 | 🔥 |
| 4 — Élite | 3000 | 💎 |
| 5 — Légende | 5000 | 👑 |

À chaque passage de palier → notification push automatique + bouton roue cadeau bonus offert.

**Affichage**
- Card en haut de la home (visible uniquement si connecté) : barre de progression vers le palier suivant
- Page Mon compte : détails par source d'XP

### Roue des cadeaux 🎡

**Règles d'éligibilité**
- 1 spin gratuit / semaine glissante
- 1 spin bonus à chaque commande > 15€
- 1 spin offert à chaque passage de palier XP

**Segments configurables depuis l'admin** (table `wheel_segments`)
```
| label              | weight | reward_type        | reward_value |
|--------------------|--------|--------------------|--------------|
| -5%                | 30     | discount_percent   | 5            |
| -10%               | 15     | discount_percent   | 10           |
| Gaufre offerte     | 10     | free_product       | Gaufre healthy |
| Smoothie offert    | 3      | free_product       | Choco Buenos |
| Tente encore       | 25     | retry              | -            |
| Boost XP x2        | 15     | xp_multiplier      | 2 (24h)      |
| Goodies            | 2      | manual_pickup      | T-shirt etc. |
```

`weight` = poids relatif pour le tirage aléatoire (somme normalisée → probabilité).

**Implémentation visuelle**
- Modale plein écran avec roue SVG ou Canvas, rotation Framer Motion (`rotate` avec easing `cubicBezier`)
- Durée du spin : ~3.5 secondes
- Confettis lucide-react à l'arrivée
- Le résultat est calculé **côté serveur** (Edge Function `/api/wheel/spin`) avant l'animation → on triche pas, et l'utilisateur peut pas hack le résultat en bloquant JS
- Le code récompense est généré (`GAUFRE-XXXX`) et stocké dans `wheel_spins`
- Auto-appliqué au prochain checkout Square via un `coupon` Square (ou ajustement custom du `base_price_money`)

**Anti-abus**
- 1 spin / semaine validé par `last_spin_at` dans le profil
- Codes expirent en 30 jours
- Codes single-use (`used_at` est rempli au moment du checkout)

---

## 📋 Ordre d'exécution recommandé

1. **Refonte structurelle de la home** (chantier en cours, branche `test-shake-bar`)
2. **Service Worker offline + analytics** (Phase 1 du plan original, reportée par Tom)
3. **Chantier 1 — Push notifications**
4. **Chantier 2 — Comptes + VIP** (auth + DB + webhook Square)
5. **Chantier 3 — Gamification** (XP puis Roue)

Chaque chantier doit être validé sur la branche `test-shake-bar` avant merge `main`.

---

## ⚠️ Règles intangibles tout au long

- Ne JAMAIS casser le flow Square existant (voir `feedback_dont_break` en mémoire)
- Garder le fallback WhatsApp fonctionnel
- Toute donnée client (email, anniversaire, historique) doit respecter le RGPD : bouton "Supprimer mon compte" obligatoire dès le chantier 2
- Pas de tracking publicitaire tiers — uniquement analytics first-party (Plausible)
