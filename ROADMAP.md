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
| **1.4.0** | Publiée | Package `1.4.0` | Passe graphique des dés, pets, lobby, historique, Pet Index, accessibilité et ambiance, sans changement de règles. |

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

## Version 1.4.0 — passe graphique ciblée

Cette version applique uniquement les améliorations visuelles **2, 3, 4, 6, 8, 9 et 10**. Elle ne modifie ni le tirage des quatre dés, ni les mises, ni les pots symétriques Diamonds + RAP, ni les données du Pet Index.

### Dés, pets et lobby

- Matériau des dés renforcé, ombres dépendant de la hauteur, rebond à l’atterrissage et impulsion du quatrième dé.
- Dés scoreurs distingués pour le joueur, le bot ou les deux, avec tags textuels et libellés accessibles.
- Fonds homogènes derrière les artworks, auras de rareté et infobulles affichant le RAP compact ainsi que sa valeur exacte.
- View Transitions natives pour les arrivées, sorties et changements d’état du lobby, avec fallback automatique.
- Défi récemment accepté mis en évidence ; les transitions restent désactivées derrière une modale, un résultat ou l’historique.

### Historique et Pet Index

- Historique sous forme de cartes avec résultat, pot total, résultat net, miniatures des sets et mouvements Diamonds/RAP séparés.
- Les anciennes entrées restent lisibles. Seules les nouvelles entrées, qui enregistrent leurs pets, affichent les miniatures.
- Skeletons illustrés, état vide enrichi, fallback plus lisible, badges de variantes harmonisés et transitions des filtres/pages.
- Pagination sans défilement fluide lorsque `prefers-reduced-motion` est actif ; les sources et les valeurs officielles restent inchangées.

### Accessibilité et ambiance

- Focus clavier visible, résultats identifiables sans dépendre uniquement de la couleur, contrastes secondaires et cibles tactiles renforcés.
- Contrôles à **320, 390, 768 et 1440 px**, sans débordement horizontal sur le duel ou le Pet Index.
- Halo ambiant subtil dérivé de la couleur du duel, reflets limités et effets coûteux allégés sur mobile.
- Animations de dés, cartes, lobby et transitions supprimées ou fortement réduites avec `prefers-reduced-motion`.

## Versions suivantes — périmètre volontairement limité

| Version | Intention | Nouvelles fonctionnalités |
|---|---|---|
| **1.3.1** | Correctifs éventuels de la 1.3.0 uniquement. | Aucune. |
| **1.4.1** | Correctifs éventuels de la 1.4.0 uniquement. | Aucune. |
| **1.5.0 et suivantes** | Non définies. | Aucune nouveauté planifiée ou commencée pour le moment. |

## Propositions graphiques restantes — idées non commencées

Les points **2, 3, 4, 6, 8, 9 et 10** de la liste initiale sont livrés dans la 1.4.0. Les propositions ci-dessous restent une liste de discussion, sans développement commencé.

### Priorité visuelle possible

1. **Hiérarchie typographique**
   - Augmenter encore les textes secondaires très petits sans agrandir excessivement les cartes.
   - Harmoniser les chiffres, unités K/M/B/T et alignements des montants.
   - Poursuivre la vérification des contrastes sur les textes bleus et gris les plus sombres.

2. **Présence des bots**
   - Ajouter des anneaux d'avatar différenciant disponible, en réflexion et en duel.
   - Animer les trois points d'un message en cours d'écriture, sans ajouter de faux joueur réel.
   - Varier subtilement les états visuels de présence sans modifier les règles du jeu.

3. **Modale et mobile**
   - Conserver le bouton de lancement visible avec un bas de modale sticky sur petit écran.
   - Améliorer le retour de défilement à la fermeture.
   - Réduire l'espace vide de la colonne des dés sur grand écran.

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
