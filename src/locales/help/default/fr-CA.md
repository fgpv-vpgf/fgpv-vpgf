# Contrôles de navigation

Les contrôles de navigation servent à modifier la taille de l’affichage de la carte.

Les commandes de navigation suivantes se trouvent dans le coin inférieur droit de la carte:

|Symbol|Nom|Touche clavier|Description|
|----|----|----|----|
|![](navigation/fullscreen.png)| Plein écran | | Le plein écran présente le contenu de la carte en utilisant la page entière. L'option « Plein écran » n'est disponible que lorsque la carte est incorporée dans une autre page  |
|![](navigation/zoomin.png)| Zoom avant | Plus (+) | Zoom avant d'un niveau sur la carte pour afficher un contenu plus détaillé |
|![](navigation/zoomout.png)| Zoom arrière | Moins (-) | Zoom arrière d'un niveau sur la carte pour afficher un contenu moins détaillé |
|![](navigation/geolocation.png)| Géolocalisation | | Zoom et se déplace à votre position géographique actuelle |
|![](navigation/canada.png)| Étendue initiale | | Zoom et déplace la carte afin que l'étendue initiale soit visible |
|![](navigation/help.png)| Aide | | Ouvre la fenêtre d'aide |

Vous pouvez également parcourir la carte en utilisant les touches fléchées gauche, droite, haut et bas ou en cliquant sur la carte et en la faisant glisser. L'utilisation de la molette de la souris zoomera la carte en avant ou en arrière.

Notez que la carte doit être la zone active (avoir le « focus ») pour que les touches clavier fonctionnent. La carte devient la zone active lorsqu'il y a une bordure bleue autour d'elle.


# Information de navigation

Les informations de navigation se situent dans le coin inférieur droit de la carte et comprennent l'échelle de la carte et les coordonnées de positionnement du curseur de la souris.
Les coordonnées de positionnement peuvent être en degrés minutes secondes (DMS), en degrés décimaux ou en mètres selon la projection et la configuration utilisées.


# Cartes de base

Le sélecteur de « Cartes de base » modifie le fond de carte sous-jacent pour afficher une variété de contextes géographiques

__Pour ouvrir le sélecteur de cartes de base:__

![](basemap/open.png)

Ouvrez d'abord le panneau des couches en sélectionnant le bouton « Couches » (montré ci-dessus en rouge). Vous verrez alors le sélecteur de cartes de base apparaître à gauche du bouton couche (montré ci-dessus en bleu). Vous pouvez également ouvrir le sélecteur de cartes de base à partir du menu principal.

Vous aurez à choisir parmi une ou plusieurs cartes de base, groupées par type de projection (Mercator ou Lambert). La carte sera chargée de nouveau si vous modifiez la projection, mais elle ne le sera pas si vous sélectionnez une carte de base de la même projection.


# Carte d'aperçu

La carte d'aperçu affiche une vue générale de la carte principale à une plus petite échelle. Elle se trouve dans le coin supérieur droit de la carte.

Cliquez sur la carte d'aperçu et faites-la glisser pour modifier l'étendue de la carte principale. En cliquant sur l'icône de bascule (![](overview/toggle.png)) dans le coin supérieur droit de la carte d'aperçu, vous pouvez l'afficher ou la masquer.


# Menu principal

![](menu/menu.png) Accédez au menu en cliquant sur le bouton de menu en haut à gauche du visualiseur.

Il existe une variété d'options et elles sont décrites ci-dessous. Notez que certaines options peuvent ne pas être disponibles ou être présélectionnées en fonction de divers facteurs.

|Symbol|Nom|Description|
|----|----|----|
| ![](menu/layers.png) | Couches | Ouvre le panneau des couches |
| ![](menu/basemap.png) | Cartes de base | Ouvre le panneau de sélection des cartes de base |
| ![](menu/fullscreen.png) | Plein écran | Le plein écran présente le contenu de la carte en utilisant la page entière. L'option « Plein écran » n'est disponible que lorsque la carte est incorporée dans une autre page|
| ![](menu/export.png) | Exporter | Ouvre une boîte de dialogue permettant d'exporter la carte sous forme d'image |
| ![](menu/share.png) | Partager | Ouvre une fenêtre contenant une URL pouvant être partagée|
| ![](menu/touch.png) | Mode tactile | Augmente la taille des boutons et améliore l'expérience des utilisateurs tactiles |
| ![](menu/about.png) | À propos de la carte | Ouvre une fenêtre qui donne de l'information supplémentaire sur la carte |
| ![](menu/help.png) | Aide | Ouvre la fenêtre d'aide |
| ![](menu/language.png) | Langue | Affiche la liste des langues prises en charge |


# Partager

L'option « Partager » est utilisée pour générer une URL partageable de la carte dans son état actuel avec les jeux de données sélectionnés. Elle est accessible dans le menu principal. Si une clé « Google API » est configurée pour la carte, vous aurez également la possibilité de générer un lien court. Une fois que vous mettez en surbrillance le lien, copiez-le comme vous copiez normalement du texte (clic droit -> copier ou Ctrl+C)


# Couches

La liste déroulante « Couches » sert de légende à la carte et liste les couches pouvant être visualisées.

![](layer/layer.png) Accédez à la liste des couches en cliquant sur le bouton « Couches » en haut, à gauche de la partie centrale du visualiseur.

Une symbologie est associée à chaque couche. Pour les couches simples (feature layer), une seule icône sera présente à côté du nom de la couche. Pour les couches d'entités complexes (c.-à-d. celles où de multiples symboles sont utilisés par couche), les icônes s'affichent sous la forme d'une pile pouvant être agrandie et réduite. Une fois agrandies, les icônes se retrouvent sous le nom de la couche. Les couches SCW (WMS) peuvent optionnellement posséder une légende graphique qui sera, de la même manière, affichée sous la couche associée.

Certaines couches peuvent être visibles uniquement à certains niveaux de zoom. Si une couche n’est pas visible à un niveau de zoom donné, la légende affichera un avis ![](layer/scale.png)) et offrira une action (![](layer/zoom.png)) afin d’établir une valeur de zoom à laquelle la couche sera visible (cela peut impliquer de faire soit un zoom avant, soit un zoom arrière).

Vous pouvez masquer ou afficher une couche à tout moment en sélectionnant l'icône de l'œil (![](layer/eye.png)) à côté de chaque couche.

Il existe cinq types de couches qui peuvent être présentes dans la liste déroulante « Couches » :

|Type de couches|Interactivité|Rendu du serveur|Support des tables|Notes|
|----|----|----|----|----|
| Élement | Oui | Non | Oui | Rapide et efficace - rendu local pour les ensembles de géométrie de petite à moyenne taille |
| Dynamique | Oui | Oui | Oui | Bon choix pour les ensembles de géométrie importante et complexe qui seraient lentes à rendre localement |
| Image | Non | Oui | Non | Support des fichiers Raster et Image |
| Tuile | Non | Oui | Non | Rapide et efficace - le serveur contient une mosaïque au rendu pré travaillé des tuiles |
| SCW (WMS) | Oui | Oui | Non | Cartes image géoréférencées que le serveur génère en utilisant des données d'une base de données SIG |

Si une couche ne se charge pas correctement, elle sera identifiée par un avis d'erreur. Au lieu des actions de couche standard, vous pouvez choisir de soit recharger la couche, soit de la retirer.  Recharger la couche est particulièrement utile s’il y a un problème temporaire de connectivité réseau. Si une couche est retirée, elle sera également retirée de la liste déroulante des couches. Si elle est ajoutée de nouveau à l'aide du bouton « Annuler », elle perdra toutes les personnalisations prédéfinies.


# Options des couches

Survolez le nom d'une couche ou activez-la (mettre le « focus ») à l'aide des touches clavier et sélectionnez l'icône de trois points ![](layer_settings/ellipses.png) pour accéder aux options supplémentaires de celle-ci.

Notez que certaines options peuvent ne pas être offertes en fonction de divers facteurs tels que le type de couche ou la configuration.

|Symbole|Nom|Description|
|----|----|----|
| ![](layer_settings/metadata.png) | Métadonnées | Affiche les métadonnées dans un panneau coulissant |
| ![](layer_settings/settings.png) | Paramètres | Ouvre un panneau coulissant où l’opacité et la zone de délimitation peuvent être ajustées de même que la possibilité d’activer ou non les requêtes |
| ![](layer_settings/datatable.png) | Tableau de données | Sélectionner pour visualiser les données sous forme de table |
| ![](layer_settings/layer.png) | Afficher la légende | Agrandit / réduit la liste d'images de la légende |
| ![](layer_settings/zoomto.png) | Zoomer à la limite | Déplace et zoom la carte afin que la limite de la couche soit en vue |
| ![](layer_settings/reload.png) | Recharger | Recharge la couche |
| ![](layer_settings/remove.png) | Retirer | Retire la couche de la carte et de la liste déroulante Couches |


# Sous-menu Couches

![](layer_submenu/menu.png)

Fournit des options supplémentaires lorsque la liste déroulante « Couches » ouverte. Le sous-menu est montré en rouge ci-dessus et il a les options suivantes:

|Symbol|Nom|Description|
|----|----|----|
| ![](layer_submenu/add.png) | Ajouter une couche | Ajouter une couche basée sur un fichier ou un service |
| ![](layer_submenu/reorder.png) | Réorganiser les couches | Fournit une solution de remplacement à l'utilisation de la souris pour réorganiser les couches. Lorsque cette option est sélectionnée, les couches ne peuvent être réorganisées avec la souris qu'en maintenant l'icône de poignée à côté de chaque couche. Utile pour les appareils tactiles et les utilisateurs du clavier |
| ![](layer_submenu/expand.png) | Basculer les groupes | Ouvre ou ferme tous les groupes |
| ![](layer_submenu/view.png) | Basculer la visibilité | Active ou désactive la visibilité de toutes les couches |


# Ajouter une couche

Des couches supplémentaires peuvent être ajoutées au visualiseur de carte. Les formats pris en charge sont les suivants: couche d'éléments d'ESRI, couche dynamique d'ESRI, couche de tuiles d'ESRI, couche d'images d'ESRI, couche WMS de l'OGC ou couche Raster. Le bouton « + » en haut du menu Légende lance le menu « Ajouter une couche ».

Utilisation:
- Sélectionnez l'option « Importer un fichier » ou « Importer un service ».
- Lorsqu' « Importer un service » est sélectionné, cliquez sur le bouton « Choisir un fichier » pour sélectionner un fichier à l'aide d'un utilitaire de recherche de fichier ou saisissez dans la zone d'édition une adresse URL pointant sur le fichier désiré.
- Lorsque vous sélectionnez « Importer un service », vous aurez la possibilité d'entrer l'adresse URL d'un service dans une zone d'édition.
- Cliquez sur le bouton « Continuer » pour continuer.
- Le visualiseur essaiera de prédire le type de jeu de données. S'il est incorrect, sélectionnez manuellement le type correspondant à l'aide du menu déroulant.
- Cliquez sur le bouton « Continuer » pour continuer.
- Selon le type d'ensemble de données chargé, différents paramètres peuvent être définis dans cette phase finale.
- Un service d'éléments permet le choix d'un attribut principal, qui détermine l'attribut utilisé pour identifier un élément (enregistrement) dans le tableau de données et les étiquettes correspondantes sur la carte. Toutes les autres informations proviennent des métadonnées du service.
- Un service WMS permet le choix du nom de la couche, qui détermine la couche dans le WMS à utiliser comme source pour le jeu de données. Toutes les autres informations sont dérivées des métadonnées du service.
- Les jeux de données basés sur des fichiers permettent le choix des attributs suivants: un nom de jeu de données qui sera affiché dans le sélecteur de couche; Un attribut principal qui agit de la même façon que dans le service d'élément; Une couleur de symbole qui détermine la couleur des points /lignes/polygones sur la carte. Les fichiers CSV permettent également la spécification des colonnes qui contiennent les valeurs de positionnement (Latitude et Longitude) utilisées pour déterminer l'emplacement des éléments sur la carte.
- Cliquez sur le bouton « Continuer » pour ajouter la couche à la carte et fermer le menu « Ajouter une couche ».


# Exporter l'image

Vous pouvez exporter une image de la carte et de ses couches visibles avec: une légende, un titre, une flèche du nord avec une échelle graphique, une note de bas de page personnalisée et une estampille temporelle.

Sélectionnez le bouton « Exporter » dans le menu de gauche pour faire apparaître une boîte de dialogue contenant une image de la carte ainsi qu'une zone d'édition vous permettant de saisir un titre si vous le souhaitez.

Si vous désirez ajouter ou supprimer des sections de l'image exportée telle que la légende, cliquez sur la roue dentée dans l'en-tête. Vous pourrez ainsi sélectionner / désélectionner les sections à afficher dans l'image exportée.

Pour modifier la taille du canevas de la carte, vous pouvez le faire à partir de la liste déroulante située dans l'en-tête. Sélectionnez une valeur prédéfinie (Par défaut/Petit/Médium) ou spécifiez votre propre taille en choisissant l'option taille personnalisée. Notez que les tailles affectent uniquement l'image de la carte, l'image exportée réelle peut être plus grande.

Cliquez sur le bouton de téléchargement dans l'en-tête pour obtenir l'image de carte finale.


# Tableau de données

![](datatable/overview_fr.png)

Le panneau __tableau de données__ est affiché ci-dessus dans son état initial.

 En plus de faire défiler les données, il est possible :
- De trier les données en sélectionnant l'en-tête de la colonne
- De se déplacer dans la table à l'aide des flèches de navigation
- D’ouvrir le panneau de détails correspondant à une ligne donnée en sélectionnant l'icône Détails ![](datatable/details.png)
- De déplacer la carte et de faire un zoom sur l'élément correspondant à une ligne donnée en sélectionnant l'icône Zoom ![](datatable/zoomto.png)
- De déplacer les colonnes en cliquant sur l'en-tête lorsque l'icône du curseur devient une main et en la déplaçant près des icônes de tri de la destination
- De filtrer les colonnes par étendue numérique, texte, sélection ou date (si la configuration le permet)

Si le nombre de caractères saisis dépasse la largeur de la boîte de texte, seuls les caractères visibles seront affichés, suivis de points de suspension (…). En sélectionnant le champ à l’aide de la souris ou du clavier, le texte complet s’affichera dans une infobulle.

Le nombre d’entités dans la couche s’affiche dans le coin inférieur gauche : Affichage de l'élément 1 à 4 sur 247 éléments.

En démarrant le filtrage de la donnée, on obtient  plus de rétroaction : Affichage de l'élément 1 à 4 sur 15 éléments (filtrés de 247 éléments au total).

### Groupe de contrôle des filtres

![](datatable/apply_fr.png)

Ce groupe de contrôle se trouve dans le coin inférieur droit et il permet de faire ce qui suit :
- Appliquer les filtres du tableau de données
    - Si le type de couche le permet, lors d'une modification des filtres, __APPLIQUER À LA CARTE__ apparaîtra. Après avoir appuyé sur ce bouton, la carte est rafraîchie et seules les données visibles de votre table sont affichées.
- Effacer tous les filtres ![](datatable/clear.png)
    - Selon la configuration, il est possible que certains filtres ne s'effacent pas (voir la section __Filtrer les données__ pour plus d'informations)
- Ouvrir le panneau de configuration des filtres ![](datatable/setting.png).

### Filtrer les données

On peut filtrer les données par colonne. Une colonne est interrogeable s'il y a un champ de saisie sous le titre de l’en-tête. Comme mentionné précédemment, il existe 4 types de filtres:
- __Texte__ : Champ de saisie de type caractère. Utiliser le caractère générique \* pour remplacer une séquence de zéro ou plusieurs caractères (p. ex. _*levo_ va trouver Charlevoix)
    - _Remarque, sans caractère générique, la recherche ne trouvera que les éléments où le mot cherché débute  la phrase._
- __Numérique__ : Champs de saisie qui n'accepte que les nombres
    - Si un minimum et un maximum sont définis le filtre recherchera une étendue
    - Si, par exemple, seulement un minimum est défini, il effectuera l'opération _plus grand que_
- __Sélection__ : Menu déroulant qui permet la sélection d'une ou de plusieurs valeurs prédéfinies
- __Date__ : Similaire au champ numérique mais utilise des dates

Certains filtres ne sont pas éditables; leur valeur ne peut donc pas être changée. Ils sont représentés par une ligne pointillée sous leur valeur.

![](datatable/search_fr.png)

Ce contrôle, que l'on retrouve dans le coin supérieur droit du tableau de données, permet de filtrer le tableau de données de manière globale.
- Si on saisit la valeur _Brook_, le tableau de données sélectionnera les données qui contiennent _Brook_ à n'importe quel endroit (p. ex. _Corner Brook_ sera sélectionné)

Lorsque l'on sélectionne le champ de saisie, les noms des colonnes peuvent changer car ils reflètent les noms internes de la donnée. Ces noms permettent de préciser des recherches, par exemple :
- Rechercher un texte: _nom du champ:valeur_ (p. ex. Type:'mon type')
- Rechercher un nombre ou une date:
    - Simple valeur: _nom du champ:[operateteur]valeur_  (p. ex. OBJECTID:<30). Les opérateurs suivants peuvent être utilisés: <, <=, >, >=.
    - Étendue: _nom du champ:[valeur..valeur]_ (p. ex. OBJECTID:[30..50])
- On peut également combiner des champs avec _&&_ (p. ex. Type:'mon type' && OBJECTID:<30)

_Remarque: On ne peut appliquer à la carte les filtres définis à l'aide de ce contrôle. Ils ne s’appliquent qu'au tableau de données._

### Panneau de configuration

![](datatable/settingPanel_fr.png)

Dans le panneau de configuration, si la configuration le permet, on peut retrouver une section __Description__ qui contient de l'information sur le jeu de données et les différentes colonnes.
Les changements effectués dans le panneau de configuration sont conservés dans le tableau de données et vice-versa.
Par la suite, on retrouve les  colonnes l'un à la suite de l'autre dans l'ordre d'affichage du tableau de données. Pour chaque colonne, on peut effectuer les actions suivantes:
- Réorganiser : permet de déplacer les colonnes en appuyant sur l'icône et en la déplaçant
- Nom : le nom du champ
- Filtre : le filtre du champ (si présent)
- Trier:  permet de trier les données en ordre croissant ou décroissant
- Afficher : permet de voir ou de cacher une colonne. _Remarque : Si une colonne contient un filtre, les données seront filtrées même si la colonne n'est pas visible_

### Menu d'options

![](datatable/menu_fr.png)

Le menu permet les actions suivantes:
- Agrandir / réduire la taille de la table (via vue partagée / agrandir)
- Filtrer les données de sorte que seules les données dans l’étendue actuelle s’affichent
- Afficher les filtres des colonnes de la table
- Exporter les données sous forme de fichier .csv
- Imprimer les données​


# Panneau d'information de la sélection interactive

Affiche les données associées à l’élément interactif sélectionné. Vous pouvez y accéder en effectuant une requête d'identification sur la carte et en sélectionnant la couche dans la liste des couches offertes ou en cliquant sur l'icône détails ![](datatable/details.png) dans une table de données.


# Accessibilité

Cette page respecte les règles pour l’accessibilité des contenus Web WCAG 2.0 AA.

Accessibilité au clavier - La fonctionnalité du clavier est offerte en tant que solution de rechange pour les utilisateurs qui sont dans l'impossibilité d’utiliser une souris. Utilisez la touche de tabulation pour naviguer vers les liens et les contrôles sur la page. Appuyez simultanément sur les touches « Majuscule+Tabulation » pour revenir un pas en arrière. Utilisez la touche « Entrée » ou la barre d’espacement pour activer les liens et les contrôles.


# Durée du chargement / Comportement imprévu

La durée des chargements peut varier selon:
- L’emplacement réseau
- La disponibilité de la bande passante
- Le nombre de couches chargées
- Les types de couches et leur taille

Un comportement imprévu peut survenir lorsque des interactions avec la carte ont lieu avant la conclusion du chargement des données. Veuillez attendre le chargement complet de la page Web avant d’activer d’autres fonctions sur la carte.

**Remarque**: Si l'indicateur de chargement de ligne de défilement apparaît au bas de la carte ou dans la légende, ou lorsque le tableau de données affiche un message de chargement en cours, attendez que l’indicateur de chargement disparaisse avant d’activer d’autres fonctions sur la carte.


# Flèche Nord

La carte principale contient une flèche du nord. Celle-ci se situe dans la partie supérieure de la carte. Elle se déplace horizontalement sur l'écran de sorte qu'elle traverse toujours une ligne droite imaginaire qui passe par le centre de la carte et le pôle Nord.
