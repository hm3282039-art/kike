# PawPlay — feuille de route des versions

Cette feuille distingue les versions publiées, la version en validation et les simples propositions. Une idée listée ici n'est pas une fonctionnalité annoncée ni commencée.

## Règles permanentes

- Le Color Dice est une **simulation locale** : aucun vrai joueur, serveur multijoueur, argent, inventaire Roblox ou échange réel.
- Les bots peuvent donner une impression d'activité multijoueur, mais cette simulation doit toujours rester identifiable.
- Les quatre dés, les duels, les mises et l'historique sont conservés.
- Mise minimale en Diamonds fictifs : **10M**.
- Aucun artwork, RAP ou Exists inventé. Un RAP absent reste absent dans le Pet Index.
- Le Pet Index conserve ses variantes, filtres, tris, recherche, pagination et fallbacks. Les restrictions du catalogue du Color Dice ne filtrent pas le Pet Index.
- Chaque version publique passe les builds, les tests Chromium desktop/mobile et le test de navigation HTMLPreview avant livraison.

## Historique des versions

Les numéros sémantiques ci-dessous servent de repères de feuille de route. Les anciens commits n'ont pas été rétroactivement transformés en tags Git.

| Version | État | Repère | Contenu principal |
|---|---|---|---|
| **1.0.0** | Publiée | `8788655` | Socle PawPlay et premier Color Dice local. |
| **1.1.0** | Publiée | `be48ba0` | PS99 Pet Index, données officielles/cache/snapshot et build statique public. |
| **1.1.1** | Publiée | `291e08d` | Navigation statique par fragments `#pets` et `#dice`. |
| **1.1.2** | Publiée | `6d9d52d` | Liens absolus conservés sur HTMLPreview malgré sa balise `<base>` Raw GitHub. |
| **1.2.0** | Publiée | `78cfc80` | Lobby pleine largeur, Create Duel en modale, 21 variantes éligibles, 22 bots et duels autonomes. |
| **1.3.0** | Publiée | Package `1.3.0` | Résultats animés, pots Diamonds + RAP, offres symétriques et comportement humain des bots renforcé. |

## Version 1.3.0 — résultats et équité des mises

### Résultats

- Animation plein écran distincte pour **victoire**, **défaite** et **égalité**.
- Score final, valeur du pot ou de la mise perdue et contenu du gain visibles immédiatement.
- Confettis de victoire, traitement rouge de la défaite et traitement doré de l'égalité.
- Bouton pour fermer l'animation et revoir les quatre dés finaux.
- Respect de `prefers-reduced-motion`.

### Valeur des duels

Pour un duel avec trois pets par côté :

```text
RAP du set = somme des RAP des 3 pets
Valeur d'un côté = mise en Diamonds + RAP du set
Pot total = 2 × valeur d'un côté
```

- Les deux adversaires déposent **la même mise en Diamonds et le même set de trois pets fictifs**.
- Le gagnant reçoit les deux offres ; le perdant perd la sienne ; une égalité rembourse les deux côtés.
- Il n'est donc plus possible d'avoir un côté à 1B contre un autre à 100B.
- Les sets de pets de démonstration sont fournis pour chaque duel local. Ils ne constituent pas un inventaire Roblox persistant.
- Les cartes du lobby, le tri, le total du lobby, la modale, l'historique et les messages de résultat utilisent la même formule.

### Bots

- Délais variables au lieu d'un cycle fixe de 4,2 secondes.
- Jusqu'à deux duels de bots simultanés.
- Vrais tirages de quatre dés pour les duels entre bots.
- Profils de risque, styles de comportement, pets favoris et couleurs favorites.
- Messages de recherche de duel, acceptation, réaction au résultat et demandes de revanche.
- Réactions contextuelles lorsque le joueur rejoint ou termine un duel.
- Présence visuelle différenciée lorsqu'un bot est en train de lancer ses dés.

## Versions suivantes — périmètre volontairement limité

| Version | Intention | Nouvelles fonctionnalités |
|---|---|---|
| **1.3.1** | Correctifs éventuels de la 1.3.0 uniquement. | Aucune. |
| **1.4.0** | Passe graphique à définir après sélection dans la liste ci-dessous. | Aucune nouveauté de gameplay sans validation préalable. |
| **1.5.0 et suivantes** | Non définies. | Aucune nouveauté planifiée ou commencée pour le moment. |

## Propositions graphiques — idées non commencées

Ces propositions sont une liste de discussion. Elles ne sont **pas en développement** dans la 1.3.0.

### Priorité visuelle possible

1. **Hiérarchie typographique**
   - Augmenter encore les textes secondaires très petits sans agrandir excessivement les cartes.
   - Harmoniser les chiffres, unités K/M/B/T et alignements des montants.
   - Vérifier les contrastes sur les textes bleus et gris les plus sombres.

2. **Matériau et impacts des dés**
   - Ajouter un léger rebond à l'arrêt de chaque dé et une ombre qui réagit à la hauteur.
   - Accentuer le dé qui donne un point sans changer les règles ni le tirage.
   - Ajouter une courte impulsion lumineuse lors du quatrième dé.

3. **Lisibilité des pets**
   - Renforcer les auras de rareté tout en gardant les artworks inchangés.
   - Uniformiser les fonds derrière les images claires ou transparentes.
   - Améliorer les infobulles avec un RAP complet en plus du format compact.

4. **Transitions du lobby**
   - Adoucir l'arrivée et la sortie d'un duel sans faire bouger toute la liste.
   - Ajouter une transition discrète entre « en attente », « accepté » et « lancement ».
   - Mettre en évidence temporairement la carte qui vient de recevoir un adversaire.

5. **Présence des bots**
   - Ajouter des anneaux d'avatar différenciant disponible, en réflexion et en duel.
   - Animer les trois points d'un message en cours d'écriture, sans ajouter de faux joueur réel.
   - Varier subtilement les états visuels de présence sans modifier les règles du jeu.

6. **Historique**
   - Transformer chaque ligne en une carte plus lisible avec deux montants : pot total et résultat net.
   - Ajouter des miniatures des sets concernés, sans modifier les données enregistrées.
   - Améliorer la séparation visuelle entre Diamonds gagnés/perdus et valeur RAP des pets.

7. **Modale et mobile**
   - Conserver le bouton de lancement visible avec un bas de modale sticky sur petit écran.
   - Améliorer les zones tactiles, le focus clavier et le retour de défilement à la fermeture.
   - Réduire l'espace vide de la colonne des dés sur grand écran.

8. **Pet Index**
   - Améliorer les skeletons, les états vides et le message de fallback sans changer les données.
   - Fluidifier les transitions de filtres et de pagination.
   - Harmoniser davantage les badges de variantes avec ceux du Color Dice.

9. **Accessibilité visuelle**
   - Ne jamais dépendre uniquement du rouge ou du vert : conserver icônes, textes et scores.
   - Vérifier focus, contraste, taille tactile et mode de réduction des animations.
   - Tester davantage de largeurs, notamment 320 px, tablette et très grand écran.

10. **Ambiance générale**
    - Ajouter éventuellement une lumière d'arrière-plan très discrète liée à la couleur dominante du duel.
    - Réduire les reflets qui gênent la lecture au lieu d'ajouter des effets partout.
    - Garder une option native de réduction des animations et éviter les effets coûteux sur mobile.

## Hors périmètre actuel

Aucun travail n'est commencé sur : vrai multijoueur, comptes, serveur distant, classement persistant, inventaire Roblox, échanges réels, nouveaux modes de jeu, nouveaux catalogues ou mécaniques économiques supplémentaires.

## Contrôle avant chaque publication

- `npm run build`
- `npm run build:static`
- Vérification de la mise 9M refusée et 10M acceptée.
- Vérification des formules de pot et des trois résultats.
- Observation de duels autonomes et de la protection d'un duel rejoint par le joueur.
- Desktop et mobile, images cassées et débordements horizontaux.
- Navigation Pet Index ↔ Color Dice sous une simulation de la balise `<base>` HTMLPreview.
- Vérification du lien public figé au commit publié.
