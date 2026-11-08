# PawPlay — Color Dice & PS99 Pet Index

Deux pages dans la même interface bleu nuit : le jeu **Color Dice Duels** (`/`) et un outil d'information **PS99 Pet Index** (`/pets`). La monnaie du jeu reste **100 % fictive** ; les RAP de l'index sont des données en Diamonds PS99, sans valeur monétaire réelle.

## Lancer le projet

```bash
npm install
npm run dev
```

Le serveur Vite écoute sur `0.0.0.0:5173`.

- Color Dice : `http://localhost:5173/`
- Index plein écran : `http://localhost:5173/pets`

```bash
npm run build
```

## Color Dice

1. Chaque joueur choisit **2 couleurs** parmi Red, Orange, Yellow, Green, Blue et Purple.
2. **4 dés colorés** sont lancés et révélés séquentiellement.
3. Chaque dé correspondant à une couleur du joueur donne un point.
4. Le joueur avec le plus de correspondances remporte le pot ; une égalité rembourse la mise fictive.

La page conserve les **7 duels et 21 pets** affichés, les mises, la recharge gratuite, l'historique local, les identifiants de tirage et la vérification des résultats. Les tiers Huge, Titanic et Gargantuan ainsi que les six finitions ont des badges dédiés.

L'icône de monnaie est le véritable **Diamond PS99** (`public/images/gems/ps99-diamond.png`), issu de `imageOutline` (`rbxassetid://14867116353`) dans la collection officielle `Currency`. Ce n'est plus l'ancienne icône Sapphire.

Les tirages utilisent `crypto.getRandomValues` localement. Les joueurs sont simulés. Il n'y a aucun dépôt, achat, retrait, vrai pet ou inventaire Roblox.

## PS99 Pet Index

La route `/pets` charge directement les trois flux publics officiels de BIG Games :

- `https://ps99.biggamesapi.io/api/collection/Pets`
- `https://ps99.biggamesapi.io/api/rap`
- `https://ps99.biggamesapi.io/api/exists`

Les entrées sont fusionnées avec la clé `pet | pt | sh` : `pt=1` pour Golden, `pt=2` pour Rainbow et `sh=true` pour Shiny. Les cartes distinguent **Regular, Golden, Rainbow, Shiny, Shiny Golden et Shiny Rainbow**. Le catalogue officiel complet remplace les données de secours dès que l'API répond.

Fonctionnalités :

- recherche par nom, tier ou variante ;
- filtres **All, Gargantuan, Titanic, Huge et Other pets** ;
- filtre séparé pour chacune des six variantes ;
- tri par RAP croissant/décroissant, Exists ou nom ;
- **48 cartes par page**, avec pagination ;
- RAP compact et valeur exacte en Diamonds, plus Exists ;
- **« No official RAP yet »** si aucun prix officiel n'existe — jamais de zéro ou de prix inventé ;
- cache IndexedDB et restauration des dernières données officielles après une coupure ;
- bouton Refresh, source et horodatage visibles.

### Secours hors ligne

Si l'API est injoignable et qu'aucun cache officiel n'existe, la page affiche explicitement **OFFLINE SNAPSHOT**. Ce secours limité contient **17 familles et 72 variantes réellement suivies**, avec des chiffres BIG Games republiés par `petsim99.co` (synchronisation indiquée : 8 novembre 2026 à 02:00 UTC). Il ne prétend pas être le catalogue complet. Le bouton Refresh relance les trois flux officiels.

## Images

- Les 34 icônes Regular/Golden locales du secours sont les assets officiels identifiés par les collections BIG Games.
- Les vignettes de variantes déjà utilisées par les duels restent des images distinctes, sans filtre CSS destiné à faire passer une recoloration pour un artwork authentique.
- À partir des métadonnées officielles, l'index utilise `https://ps99.biggamesapi.io/image/{assetId}` et les vignettes de variantes `ps99rap.com`, avec un placeholder explicite en dernier recours.
- Le miroir open source `Kot-r/petsim-images`, alimenté par l'API BIG Games, a permis de récupérer les PNG officiels locaux, dont le Diamond.

Sources publiques des anciennes vignettes de duels : `ps99rap.com`, `pet99prices.com` et `petsimulatorvalues.com`.

PawPlay est un projet fan-made indépendant, sans affiliation avec Roblox, BIG Games, Pet Simulator ou BloxyPet. Les noms et visuels appartiennent à leurs propriétaires respectifs. RAP est une référence de marché, pas une offre d'échange garantie.
