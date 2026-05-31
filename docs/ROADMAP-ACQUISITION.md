# La Base Shakes & Drinks — Roadmap acquisition de leads

> Objectif : transformer le shake bar (haut d'entonnoir) en machine à
> capturer des contacts, les fidéliser, et les faire descendre vers le
> coaching (bilan) et l'opportunité (recrutement) — là où est la vraie marge.
> Dernière mise à jour : 2026-05-31.

L'entonnoir cible :

```
🥤 Shake bar (aimant) → 📧 Contact capturé → 💪 Bilan coaching (récurrent) → 🚀 Opportunité (dupliqué)
                        ↑ parrainage = boucle virale qui réalimente le haut
```

---

## CHANTIER A — Parrainage (boucle virale) ✅ LIVRÉ
**Valeur : ⭐⭐⭐⭐⭐ · Effort : fait · Statut : code en prod, reste migration**

Chaque membre a un lien unique `/jeu?ref=CODE`. Le filleul s'inscrit via
ce lien → +200 XP de bienvenue. À sa 1ère commande payée → le parrain
gagne +500 XP. Anti-abus : récompense à la vraie vente, pas à l'inscription.

- [x] Migration 008 (referral_code, referred_by, referral_rewarded)
- [x] Capture `?ref=` dans /jeu + attribution signup-claim
- [x] Récompense parrain dans webhook Square + espèces (gardé)
- [x] Carte "Parraine tes amis" dans le profil (lien + partage + compteur)
- [ ] **TOM : jouer la migration 008 en base** (sinon XP cassés)
- [ ] Tester le flux bout-en-bout

---

## CHANTIER B — Capture en magasin (QR + kit comptoir)
**Valeur : ⭐⭐⭐⭐⭐ · Effort : faible · ROI immédiat, quasi gratuit**

Convertir chaque personne qui entre en lead capturé + abonné push.

- [ ] Générer un QR `/jeu` stylé (couleurs La Base) à imprimer
- [ ] Visuel chevalet de table : "Scanne → tourne la roue → gagne 🎰"
- [ ] Sticker / tampon sur les gobelets avec le QR
- [ ] Script comptoir : "Tu veux tenter la roue ? Scanne ça" à chaque vente
- Note : moitié dev (je génère QR + visuels), moitié Tom (impression)

---

## CHANTIER C — Acquisition Instagram (bio + contenu)
**Valeur : ⭐⭐⭐⭐ · Effort : faible · Trafic gratuit vers la roue**

- [ ] Lien bio permanent → `/jeu` (le plus viral)
- [ ] Texte de bio optimisé (qui on est + CTA roue)
- [ ] Plan de stories hebdo : "nouvelle roue dispo 👀" (reset hebdo = prétexte à reposter)
- [ ] 2-3 idées de reels (la roue qui tourne, un gagnant en boutique, un shake)
- Note : je prépare tous les assets, Tom poste

---

## CHANTIER D — Pont vers le coaching (Le Club → bilan)
**Valeur : ⭐⭐⭐⭐⭐ (la vraie marge) · Effort : moyen**

Réveiller "Le Club" qui est aujourd'hui un lien passif. C'est là qu'est
l'argent (coaching récurrent + recrutement), pas dans la marge d'un shake.

- [ ] Carte "Ton bilan offert 💪" affichée dans l'app après X commandes (segment chaud)
- [ ] Push ciblée vers `/bilan-online` pour les clients réguliers
- [ ] Mettre en avant l'onglet "Le Club" (déjà ajouté au hub mobile)
- [ ] Suivre les clics bilan / opportunité (tracking)

---

## CHANTIER E — Mesure & pilotage (dashboard entonnoir)
**Valeur : ⭐⭐⭐ · Effort : moyen · Sait où colmater**

- [ ] Étendre la console Stats avec les taux de conversion entre étapes :
      joueurs roue → comptes créés → 1ère commande → récurrents → clics bilan
- [ ] Compteur de parrainages (filleuls / validés) côté admin
- [ ] Vue hebdo pour repérer la marche où ça chute

---

## CHANTIER F — Rétention & réengagement (renforcer l'existant)
**Valeur : ⭐⭐⭐ · Effort : variable**

Déjà en place : XP, Mardi Double XP, anniversaire (cron), relance 14j (cron), push.

- [ ] Streak (3 semaines d'affilée → bonus XP)
- [ ] Push automatique au passage de palier XP + roue bonus
- [ ] Segmentation des push (au lieu de "tous les abonnés")

---

## CHANTIER G — Ops & sécurité (petits restes)
**Valeur : ⭐⭐ · Effort : faible**

- [x] CRON_SECRET défini (crons verrouillés)
- [ ] Mot de passe admin propre pour Mélanie (révocable séparément) — optionnel
- [ ] Bug paiement espèces (migration 003) — ✅ réglé

---

## Ordre d'attaque recommandé (ROI / effort)
1. **A** — finir le parrainage (migration + test) — *presque fini*
2. **B** — QR magasin + kit comptoir — *quick win gratuit*
3. **C** — Instagram (bio + contenu) — *trafic gratuit*
4. **D** — Pont coaching — *la vraie marge*
5. **E** — Mesure entonnoir
6. **F** — Rétention avancée
