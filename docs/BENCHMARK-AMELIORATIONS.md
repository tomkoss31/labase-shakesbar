# La Base — Benchmark apps comparables & roadmap d'améliorations

> Basé sur une recherche approfondie vérifiée (105 agents, 23 sources, 20 faits
> confirmés par vote contradictoire). Les chiffres "bidons" ont été écartés.
> Dernière mise à jour : 2026-05-31.

---

## ✅ Ce que la recherche VALIDE dans ton app (tu es déjà bien aligné)

- **XP = 10/€ → cadeaux PRODUITS** : c'est EXACTEMENT le modèle Chipotle Rewards
  (10 pts/$1, paliers de produits gratuits, pas de cash). Margin-friendly, validé.
- **Roue cadeau hebdo** : la gamification "jeu de hasard" (spin-to-win) marche —
  KFC "Rewards Arcade" a fait +2,3 M d'utilisateurs et +44 % d'usage quotidien
  de l'app (chiffre vendeur, à prendre comme tendance).
- **Parrainage payé à la 1ère commande du filleul** : c'est LA bonne pratique
  anti-fraude (on retarde la récompense jusqu'à ce que la valeur soit confirmée).
  La plupart des apps paient trop tôt et se font farmer. Toi non. 👍
- **Shake bar = aimant à leads** vers le coaching : le modèle Nutrition Club le
  confirme (le lieu sert surtout de centre d'acquisition).

> Conclusion : ta direction est juste. Les améliorations ci-dessous sont du
> "next level", pas des corrections.

---

## 🎯 Roadmap priorisée (impact / effort)

### 🟢 QUICK WINS — fort impact, faible effort

1. **"Recommander" (Order Again) sur l'accueil**
   - Preuve la plus solide de toute la recherche (Baymard, 1100h de tests UX) :
     les clients qui reviennent **cherchent activement leur commande passée** sur
     l'accueil et **abandonnent** s'ils doivent tout refaire.
   - → Bouton "🔁 Recommander" en haut de l'accueil (1 tap = re-remplit le panier
     avec la dernière commande). On a déjà l'historique des commandes.
   - **Impact : élevé (fréquence d'achat) · Effort : moyen-faible**

2. **Bouton "Installer l'app" pour Android/PC (Chromium)**
   - On gère déjà l'install iPhone (instructions). Mais sur Android/PC, on peut
     déclencher le **vrai prompt d'installation** (event `beforeinstallprompt`).
   - → Plus d'installs = plus de push reçues = plus de rétention.
   - **Impact : moyen · Effort : faible**

3. **Un premier cadeau TRÈS accessible (effet "goût")**
   - Chipotle a **baissé ses paliers** en 2025 pour accrocher plus vite (85 pts =
     un petit extra). Aujourd'hui ton 1er cadeau est à 250 XP (= 25 € dépensés).
   - → Ajouter un mini-palier (ex. 100 XP = un topping/sirop offert) pour que le
     client goûte à la récompense **dès la 1ère/2e visite** → accroche.
   - **Impact : moyen-élevé · Effort : faible**

### 🟡 GROS LEVIERS — fort impact, effort moyen

4. **Défis / missions hebdomadaires** (LE levier de fréquence #1)
   - Chipotle "Summer of Extras" (défis perso + badges) : **+14 % d'inscriptions
     digitales**, 6,4 M activations, ~12 M$ de ventes incrémentales.
   - → Exemples pour La Base : "Commande 2× cette semaine → +100 XP", "Essaie un
     nouveau shake → +50 XP", "Viens un mardi → bonus". Crée l'habitude.
   - **Impact : très élevé · Effort : moyen** (nouvelle table + logique XP)

5. **Push CIBLÉES au lieu de "tous les abonnés"**
   - Joe & The Juice : la **personnalisation** (segments par préférence produit)
     a doublé les taux d'ouverture et fait **+56 % de revenus fidélité** (vendeur).
     Le constat clé : *ce sont les points + le ciblage qui rapportent, pas les
     points seuls.*
   - → Segmenter : "client qui prend toujours un smoothie" → push smoothie ;
     "pas venu depuis 21j" → relance perso (on a déjà la relance 14j, à enrichir).
   - **Impact : élevé · Effort : moyen**

6. **Éditer un article dans le panier (sans le supprimer)**
   - Baymard : les clients **abandonnent** quand modifier = supprimer puis tout
     refaire. Aujourd'hui on a +/- quantité, mais pas "modifier les options".
   - → Lien "✏️ Modifier" sur chaque ligne du panier (rouvre la modale produit).
   - **Impact : moyen · Effort : moyen**

### 🔵 STRATÉGIQUE — conversion vers le coaching (ta vraie marge)

7. **Défi bien-être communautaire**
   - Le modèle Nutrition Club convertit via la **consommation quotidienne + la
     communauté**. Décline-le proprement : un "Challenge 7 jours énergie" relié
     au bilan, suivi dans l'app.
   - → Pont naturel shake → coaching, sans cash.
   - **Impact : élevé (marge) · Effort : moyen-élevé**

> ⚠️ **Garde-fou juridique (important)** : le modèle Herbalife/Nutrition Club
> porte un vrai **risque réputationnel et réglementaire**. En France, la
> "vente pyramidale" est interdite et le recrutement-centré est scruté. Mets en
> avant le **produit + l'accompagnement bien-être**, garde l'angle "opportunité
> de revenus / recrutement" **discret et secondaire**. C'est plus sûr ET ça
> convertit mieux (les gens viennent pour le résultat, pas pour un business).

---

## ❌ Chiffres "du web" qu'on a vérifiés FAUX (ne pas s'en servir)
- "Opt-in push 44 % iOS / 91 % Android" → réfuté (0-3). Pas de chiffre fiable.
- "Pret : abonnés dépensent 4× plus" → réfuté (0-3).
- "Herbalife : on gagne 10× plus en recrutant qu'en vendant" → réfuté (0-3).
- McDonald's "membres = 2,5× plus de visites" : VRAI mais c'est une corrélation
  (les gros clients s'inscrivent plus), pas une preuve de cause à effet.

---

## Ordre conseillé pour une petite équipe (Tom + Mélanie, Vercel Hobby)
1. **Recommander (Order Again)** — quick win, gros effet fréquence.
2. **Mini-palier cadeau accessible** — accroche rapide.
3. **Défis hebdo** — le plus gros levier de fréquence.
4. **Push ciblées** — transforme la fidélité en CA.
5. **Édition panier + install Android** — polish UX.
6. **Défi bien-être communautaire** — pont coaching (la marge).
