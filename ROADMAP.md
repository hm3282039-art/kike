# PawPlay — feuille de route des versions

Cette feuille distingue les versions publiées, la version en validation et les simples propositions. Une idée listée ici n'est pas une fonctionnalité annoncée ni commencée.

## Règles permanentes

- Le Color Dice est une **simulation locale** : aucun vrai joueur, serveur multijoueur, argent, inventaire Roblox ou échange réel.
- Les bots peuvent donner une impression d'activité multijoueur, mais cette simulation doit toujours rester identifiable.
- Les quatre dés, les duels, les mises et l'historique sont conservés.
- Mise minimale en Diamonds fictifs : **10M**.
- Aucun artwork, RAP ou Exists inventé. Un RAP absent reste absent dans le Pet Index.
- Le Pet Index conserve ses variantes, filtres, tris, recherche, pagination et fallbacks. Les restrictions du catalogue du Color Dice ne filtrent pas le Pet Index.
- Le Poker est une simulation locale en **Diamonds uniquement** : aucun pet, RAP, inventaire ou échange réel dans ses mises et ses pots.
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
| **1.5.0** | Publiée | Package `1.5.0` | Clarté des mises Color Dice et Poker Texas Hold’em local, exclusivement en Diamonds fictifs. |

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

## Version 1.5.0 — mises lisibles et Diamond Poker

### Distinction des mises au Color Dice

- Les cartes du lobby affichent d’abord la **mise en Diamonds**, au même format que les niveaux proposés au joueur.
- Le total incluant le RAP des deux sets reste visible, mais il n’est plus présenté comme une mise en Diamonds.
- Les messages d’activité annoncent les Diamonds engagés séparément des pets de démonstration associés.
- Les mises rapides couvrent toute l’échelle commune, de **10M à 5B**.
- Rejoindre un duel exige uniquement son montant en Diamonds et le solde disponible ; le même set fictif reste fourni aux deux côtés.

### Poker Texas Hold’em heads-up

- Table locale contre un bot, avec blinds alternées et tours préflop, flop, turn et river.
- Actions **fold**, **check/call** et **raise**, avec deux raises maximum par tour en fixed-limit.
- Évaluation des meilleures combinaisons de cinq cartes parmi sept, kickers, cartes communes et split pots.
- Le bot estime localement son équité et choisit ses actions sans serveur ni vrai joueur.
- Les blinds, calls et raises sont débités du même solde fictif que le Color Dice ; gains et split pots y sont crédités une seule fois.
- Historique des dix dernières mains, blind levels de 10M à 5B, responsive 320 px et reduced-motion.

### Diamonds uniquement au Poker

```text
Pot Poker = contributions Diamonds du joueur + contributions Diamonds du bot
Aucun pet + aucun RAP + aucune valeur d’inventaire
```

- Le Poker ne charge ni n’utilise le catalogue de pets.
- Les pets du Color Dice et du Pet Index ne peuvent pas être engagés au Poker.
- Les données officielles et les règles de pots Diamonds + RAP du Color Dice restent inchangées.

## Versions suivantes — périmètre volontairement limité

| Version | Intention | Nouvelles fonctionnalités |
|---|---|---|
| **1.3.1** | Correctifs éventuels de la 1.3.0 uniquement. | Aucune. |
| **1.4.1** | Correctifs éventuels de la 1.4.0 uniquement. | Aucune. |
| **1.5.1** | Correctifs éventuels de la 1.5.0 uniquement. | Aucune. |
| **1.8.0 et suivantes** | Améliorations des jeux existants, à prioriser. | Aucune nouveauté promise. |

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
- Vérification des combinaisons Poker, blinds, tours de mise, split pots et réconciliation exacte du solde Diamonds partagé.
- Vérification qu’aucun pet ni RAP ne peut être engagé au Poker.
- Observation de duels autonomes et de la protection d'un duel rejoint par le joueur.
- Desktop et mobile, images cassées et débordements horizontaux.
- Navigation Pet Index ↔ Color Dice sous une simulation de la balise `<base>` HTMLPreview.
- Vérification du lien public figé au commit publié.


## Version 1.6.0 — lisibilité et Chicken Crossing

- Poker : surbrillance des cartes de la combinaison (paire dès les cartes privées, puis meilleure combinaison avec le board) ; kickers neutres. Cartes adverses surlignées seulement après révélation.
- Color Dice : couleurs adverses sans chevauchement ; égalité relancée automatiquement avec les mêmes couleurs et le même pot, sans nouveau débit ni entrée finale dans l’historique. Même règle pour les duels entre bots.
- Chicken Crossing : 12 routes, multiplicateurs croissants, encaissement entre les traversées, collision et historique local séparé. Diamonds fictifs uniquement, solde commun.
- Survie par route 82 %, collision 18 %, tirage crypto indépendant. Multiplicateur = floor(0.96 / 0.82^route × 100) / 100 ; mise incluse dans le paiement. Les voitures sont décoratives et ne constituent pas un signal de timing. Dernière route encaissée automatiquement. Quitter un run abandonne la mise déjà débitée.
- Plateau nocturne, animations de trafic et saut du poulet, refuges, contraste des actions, mode reduced-motion et mise en page mobile.
- Vérifications : build TypeScript/Vite, encaissement exact, collision sans double débit, égalité forcée sans nouveau débit, couleurs exclusives, régression poker et responsive 320/390 px.

### Améliorations proposées — sans ajouter de jeux

1. Poker : distinguer visuellement combinaison principale et kickers au showdown, avec explication courte du départage.
2. Color Dice : afficher un compteur de relances et une chronologie des scores dans le même duel.
3. Chicken : renforcer le feedback de refuge, collision et encaissement avec sons optionnels, désactivés par défaut.
4. Tous les jeux : harmoniser la langue française, les boutons, les messages de solde insuffisant et les indications clavier.
5. Tous les jeux : proposer une confirmation avant de quitter une partie engagée et une reprise fiable après rechargement.


## Version 1.6.1 — améliorations des jeux existants

Les points 1 à 4 de la liste précédente sont implémentés :
- Poker : panneau « Pourquoi ce résultat ? », comparaison de catégories, hauteur, kickers, paire du full, partage exact ou abandon. Tests reproductibles : `node tests/poker-result.cjs`.
- Color Dice : compteur des relances, chronologie des scores dans le duel et conservation dans les nouvelles entrées d’historique. Anciennes entrées compatibles sans migration. Aucun débit supplémentaire sur égalité.
- Poulet : feedback visuel refuge/collision/encaissement et sons synthétisés courts, opt-in, désactivés à chaque chargement. Mode reduced-motion conservé ; aucune dépendance audio réseau.
- Français : boutons, règles, actions, explications poker, états du salon, messages des bots et écrans principaux de l’index traduits. Les noms officiels des pets, variantes et marques sont conservés.
- Contrôles : builds normal/statique, explications moteur, relance forcée avec un seul débit, chronologie, bascule des sons, soldes du poulet, régression poker, responsive 320/390 px et navigation HTMLPreview sur les quatre pages. Les 503 du catalogue sont injectées par le test statique pour vérifier le repli hors ligne.

Le point 5 (confirmation de sortie et reprise après rechargement) reste à faire, hors de cette demande.

## Version 1.6.2 — refonte du plateau Chicken Crossing

- Poulet et véhicules dessinés en SVG local, sans emojis pour les éléments de jeu ou les Diamonds.
- Routes numérotées, refuges, multiplicateurs, progression sur 12 routes et caméra suivant le poulet sur mobile.
- Traversée animée vers la voie tentée, puis arrivée au refuge ; collision représentée sur cette voie avec véhicule dédié. Le trafic décoratif de la voie active est masqué pendant la résolution pour ne pas montrer une fausse collision lors d’une réussite.
- Poste de commande : mise, raccourcis, encaissement disponible, montant de la prochaine route et risque de collision explicite.
- Résultats distincts, historique des nouvelles pertes avec mise exacte (anciennes données conservées), sons opt-in et reduced-motion.
- Règles inchangées : Diamonds fictifs uniquement, solde partagé, survie 82 %, multiplicateurs fixes et tirages indépendants ; aucune mécanique de réflexes promise.
- Vérifications : TypeScript/Vite normal et statique, soldes exacts après collision/encaissement, 12 routes avec paiement automatique final, responsive 320/390/1440 px, navigation statique des quatre pages. Capture desktop inspectée.


## Version 1.7.0 — Chicken Crossing, décisions et confort

- Trois rythmes : Détente (90 % survie), Classique (82 %, règles originales conservées), Intense (70 %). Chaque route reste un tirage indépendant ; les réglages de mise, mode et objectif sont verrouillés après départ.
- Multiplicateurs calculés par mode : `floor(0.96 / survie^route * 100) / 100`, avec remboursement de la mise au refuge 0. Les montants affichés incluent la mise ; le bénéfice net est affiché séparément.
- Objectif d’encaissement automatique au refuge 3, 6, 9 ou 12, avec paiement et probabilité d’atteinte affichés avant le départ. Encaissement manuel anticipé possible ; l’objectif ne protège pas d’une collision et chaque traversée reste déclenchée par le joueur.
- Bilan des dix dernières parties, meilleur refuge récent, nombre d’encaissements et net cumulé. Les anciens historiques sans mode restent lisibles (Classique) ; les anciennes mises inconnues ne sont pas inventées.
- Couleurs d’ambiance par mode, aperçu des 12 multiplicateurs et refuge objectif marqué sur le plateau.
- Animation rapide optionnelle (0,42 s contre 0,85 s), sans changement des probabilités ; reduced-motion conservé.
- Mobile : boutons fixes Avancer/Encaisser pendant la partie et retour visuel vers le plateau au départ.
- Protection des doubles actions : une partie ne peut être débitée ou créditée qu’une fois. Confirmation de navigation, focus piégé dans la boîte de confirmation et avertissement navigateur sur sortie/rechargement. La reprise après rechargement n’est pas implémentée : une sortie confirmée abandonne toujours la mise.
- Vérifications : `npm test` (moteurs poker/poulet), trois modes avec paiement exact, objectif 3 automatique, doubles clics, collision, solde insuffisant, confirmation de sortie, vitesse rapide, historique, mobile 320/390 px et desktop. Captures desktop/mobile inspectées.
