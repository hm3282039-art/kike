# 🎲 Color Dice 1v1 — duel de dés néon (style BloxyPet)

Mini-jeu web en **HTML + Tailwind CSS + JavaScript vanilla** : design sombre, néons
violets/bleus, gemmes roses et dorées, cadres et bannières animés façon BloxyPet.

## Lancer le jeu

```bash
npm start          # → http://localhost:3000  (serveur Python, aucune dépendance)
# ou n'importe quel serveur statique :
npx serve .
python3 -m http.server 3000 --bind 0.0.0.0
```

Un double-clic sur `index.html` fonctionne aussi, mais un petit serveur est plus
fiable (polices, `localStorage`).

Le CSS Tailwind est **déjà compilé** dans `assets/css/app.css` : rien à builder pour jouer.
Après une modification des classes Tailwind : `npm install` puis `npm run build` (ou `npm run dev`).

## Règles implémentées

1. **Mise** — tu mises des gemmes (100 / 500 / 1 000 / 5 000 / MAX ou saisie libre,
   min. 100). Le bot mise automatiquement le même montant **à ±5 %**.
2. **Choix des dés** — 6 couleurs disponibles, tu en choisis **2** (clic ou touches
   `1`–`6`). Le bot prend **2 autres couleurs**, les **2 dernières restent neutres**.
3. **Le tirage 1v1** — **4 dés** de couleurs tournent au centre, puis sont révélés un
   par un. On compte les dés de tes couleurs contre ceux du bot : le plus haut score
   gagne. Base **50/50** puisque chaque dé est équiprobable sur 6 couleurs.
4. **Égalité** — si les deux scores sont identiques, le tirage **se relance
   automatiquement** (la mise reste engagée, jusqu'à 12 relances de sécurité).
5. **Pot** — le vainqueur rafle **mise joueur + mise bot** ; en cas de victoire tu es
   crédité du pot complet (donc de la mise du bot en plus de la tienne).

## Interface

- **En-tête** : solde de gemmes animé (+ boutique), avatar, **cadre équipé**, bannière,
  titre, niveau/XP et statistiques du joueur.
- **Zone de duel 1v1** : carte joueur **vs** carte bot, avec avatar, cadre, bannière,
  titre et **mises respectives**.
- **Grille de 6 couleurs** : tes 2 choix (cyan), les 2 du bot (rose, révélées au lancer),
  les 2 neutres (grisées).
- **Arène centrale** : 4 dés 3D qui tournent, s'illuminent à la révélation, compteurs de
  score en direct, halo coloré, confettis et verdict (victoire / défaite / égalité).
- **Panlatéral** : dernier duel détaillé, chat de salon (bots qui flexent cadres,
  bannières et pots) et historique des 14 derniers duels.
- **Vestiaire** : bannières (10), cadres (7), titres (8) et skins de dés (7),
  achat en gemmes, aperçu en direct et équipement instantané.

## Raccourcis

| Touche | Action |
| --- | --- |
| `Espace` | Lancer le duel |
| `1` … `6` | (Dé)sélectionner une couleur |
| `B` | Ouvrir le vestiaire |
| `Échap` | Fermer le vestiaire |

## Structure

```
index.html               markup + sprite SVG + arène
src/input.css            design system Tailwind (thème, composants néon, dés 3D)
tailwind.config.js       palette, keyframes, animations
assets/css/app.css       CSS compilé (généré, ne pas éditer)
assets/js/app.js         règles du jeu, bot, dés 3D, cosmétiques, chat, son, persistance
scripts/check.js         vérification statique (npm run check)
```

La progression (gemmes, cosmétiques, historique, stats) est sauvegardée dans
`localStorage` sous la clé `colordice1v1.save.v1`.

> Démo : gemmes, bots et classements sont simulés ; aucune transaction réelle.
> Un hook de test (`window.__cd`) n'est exposé que si l'URL contient `?debug`.
