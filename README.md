# 🎲 Color Dice 1v1 — Dice Duels (style BloxyPet)

Mini-jeu web **HTML + Tailwind CSS + JavaScript vanilla**, calqué sur l'interface de
`bloxypet.com/dice-duels` : thème sombre neutre, accent violet, rail d'icônes à gauche,
liste de parties, chat à droite.

## Lancer

```bash
npm start          # http://localhost:3000 (serveur Python, zéro dépendance)
# ou
npx serve .
python3 -m http.server 3000 --bind 0.0.0.0
```

CSS déjà compilé dans `assets/css/app.css`. Après modif des classes :
`npm install && npm run build` (ou `npm run dev`).

## Règles

1. **Mise** : 100 / 1 000 / 5 000 / 25 000 / MAX ou saisie libre. L'adversaire mise
   le même montant **à ±5 %**.
2. **Couleurs** : 6 disponibles, tu en choisis **2** (clic ou touches `1`–`6`),
   l'adversaire prend **2 autres couleurs**, les **2 restantes sont neutres**.
3. **Tirage** : **4 dés** tournent au centre puis sont révélés un par un. On compare
   tes dés à ceux de l'adversaire (50/50 de base, 6 couleurs équiprobables).
4. **Égalité** : le tirage **se relance automatiquement** (jusqu'à 12 relances de
   sécurité, puis remboursement).
5. **Pot** : le vainqueur rafle **mise joueur + mise adversaire**.

## Interface

- **Top nav** : solde de gemmes (+ recharge), bouton Wallet, vestiaire, son, profil
  (avatar + cadre + bannière + titre).
- **Rail gauche** : navigation façon BloxyPet (profil, jeux, inventaire, cosmétiques,
  fair-play, stats, quêtes, classement, paramètres, aide, Discord).
- **Onglets Create / History** : configuration du duel ou historique + statistiques.
- **Duel 1v1** : carte joueur **vs** carte adversaire (avatar, cadre, bannière, titre,
  mises), arène à 4 dés, grille des 6 couleurs, sélection de mise, pot et bouton
  « Lancer le duel ».
- **Parties en cours** : liste façon BloxyPet (bannières, cadres, bande de dés, pot,
  score, pips) avec boutons **Join / View**.
- **Colonne droite** : encart sponsorisé « Join », duel du jour détaillé, **chat** avec
  messages des joueurs et envoi de messages.
- **Vestiaire** : bannières, cadres, titres et skins de dés, achat en gemmes et
  équipement immédiat.

## Raccourcis

| Touche | Action |
| --- | --- |
| `Espace` | Lancer le duel |
| `1` … `6` | (Dé)sélectionner une couleur |
| `B` | Vestiaire |
| `Échap` | Fermer le vestiaire |

## Structure

```
index.html          structure (top nav, rail, colonnes, vestiaire)
src/input.css       design system (thème sombre, composants, dés 3D)
tailwind.config.js  polices + animations utilitaires
assets/css/app.css  CSS compilé (généré)
assets/js/app.js    règles du jeu, adversaires, lobby, chat, cosmétiques, son
scripts/check.js    vérif statique (npm run check)
```

Sauvegarde locale : `localStorage` clé `bloxypet.colordice.save.v1`.
Hook de test exposé uniquement avec `?debug`.

> Démo : gemmes, adversaires et parties sont simulés, aucune transaction réelle.
