# Contrôles de navigation

Les contrôles de navigation servent à modifier la taille de l’affichage de la carte.

Les commandes de navigation suivantes se trouvent dans le coin inférieur droit de la carte:

|Symbol|Nom|Touche clavier|Description|
|----|----|----|----|
|![Une icône représentant la fonction « Plein écran »](navigation/fullscreen.png)| Plein écran | | Le plein écran présente le contenu de la carte en utilisant la page entière. L'option « Plein écran » n'est disponible que lorsque la carte est incorporée dans une autre page  |
|![Une icône représentant la fonction « Zoom avant »](navigation/zoomin.png)| Zoom avant | Plus (+) | Zoom avant d'un niveau sur la carte pour afficher un contenu plus détaillé |
|![Une icône représentant la fonction « Zoom arrière »](navigation/zoomout.png)| Zoom arrière | Moins (-) | Zoom arrière d'un niveau sur la carte pour afficher un contenu moins détaillé |
|![Une icône représentant la fonction « Géolocalisation »](navigation/geolocation.png)| Géolocalisation | | Zoom et se déplace à votre position géographique actuelle |
|![Une icône représentant la fonction « Étendue initiale de la carte »](navigation/canada.png)| Étendue initiale | | Zoom et déplace la carte afin que l'étendue initiale soit visible |
|![Une icône représentant la fonction « Aide »](navigation/help.png)| Aide | | Ouvre la fenêtre d'aide |

Vous pouvez également parcourir la carte en utilisant les touches fléchées gauche, droite, haut et bas ou en cliquant sur la carte et en la faisant glisser. L'utilisation de la molette de la souris zoomera la carte en avant ou en arrière.

Si vous êtes panoramique de la carte en utilisant les touches fléchées, vous pouvez appuyer sur « SHIFT » ou « CTRL » pour déplacer la carte plus rapidement ou plus lentement, respectivement.

Notez que la carte doit être la zone active (avoir le « focus ») pour que les touches clavier fonctionnent. La carte devient la zone active lorsqu'il y a une bordure bleue autour d'elle.


# Information de navigation

Les informations de navigation se situent dans le coin inférieur droit de la carte et comprennent l'échelle de la carte et les coordonnées de positionnement du curseur de la souris.
Les coordonnées de positionnement peuvent être en degrés minutes secondes (DMS), en degrés décimaux ou en mètres selon la projection et la configuration utilisées.


# Cartes de base

Le sélecteur de « Cartes de base » modifie le fond de carte sous-jacent pour afficher une variété de contextes géographiques

__Pour ouvrir le sélecteur de cartes de base:__

![Un graphique représentant la zone de l’interface à sélectionner afin d’ouvrir la fonction de « Sélection de la carte de base »](basemap/open_fr.png)

Ouvrez d'abord le panneau des couches en sélectionnant le bouton « Couches » (montré ci-dessus en rouge). Vous verrez alors le sélecteur de cartes de base apparaître à gauche du bouton couche (montré ci-dessus en bleu). Vous pouvez également ouvrir le sélecteur de cartes de base à partir du menu principal.

Vous aurez à choisir parmi une ou plusieurs cartes de base, groupées par type de projection (Mercator ou Lambert). La carte sera chargée de nouveau si vous modifiez la projection, mais elle ne le sera pas si vous sélectionnez une carte de base de la même projection.


# Carte d'aperçu

La carte d'aperçu affiche une vue générale de la carte principale à une plus petite échelle. Elle se trouve dans le coin supérieur droit de la carte.

Cliquez sur la carte d'aperçu et faites-la glisser pour modifier l'étendue de la carte principale. En cliquant sur l'icône de bascule (![Une icône représentant la fonction « Basculer l’aperçu de la carte »](overview/toggle.png)) dans le coin supérieur droit de la carte d'aperçu, vous pouvez l'afficher ou la masquer.


# Menu principal

![Une icône représentant les 3 barres horizontales du coin supérieur droit de la carte qui servent à ouvrir le menu de gauche](menu/menu.png) Accédez au menu en cliquant sur le bouton de menu en haut à gauche du visualiseur.

Il existe une variété d'options et elles sont décrites ci-dessous. Notez que certaines options peuvent ne pas être disponibles ou être présélectionnées en fonction de divers facteurs.

|Symbol|Nom|Description|
|----|----|----|
| ![Une icône représentant la fonction « Couches »](menu/layers.png](menu/layers.png) | Couches | Ouvre le panneau des couches |
| ![Une icône représentant la fonction « Sélection de la carte de base »](menu/basemap.png) | Cartes de base | Ouvre le panneau de sélection des cartes de base |
| ![Une icône représentant la fonction « Plein écran »](menu/fullscreen.png) | Plein écran | Le plein écran présente le contenu de la carte en utilisant la page entière. L'option « Plein écran » n'est disponible que lorsque la carte est incorporée dans une autre page|
| ![Une icône représentant la fonction « Exportation »](menu/export.png) | Exporter | Ouvre une boîte de dialogue permettant d'exporter la carte sous forme d'image |
| ![Une icône représentant la fonction « Partage »](menu/share.png) | Partager | Ouvre une fenêtre contenant une URL pouvant être partagée|
| ![Une icône représentant la fonction « Mode tactile »](menu/touch.png) | Mode tactile | Augmente la taille des boutons et améliore l'expérience des utilisateurs tactiles |
| ![Une icône représentant la fonction « À propos »](menu/about.png) | À propos de la carte | Ouvre une fenêtre qui donne de l'information supplémentaire sur la carte |
| ![Une icône représentant la fonction « Aide »](menu/help.png) | Aide | Ouvre la fenêtre d'aide |
| ![Une icône représentant la fonction « Langue »](menu/language.png) | Langue | Affiche la liste des langues prises en charge |


# Partager

L'option « Partager » est utilisée pour générer une URL partageable de la carte dans son état actuel avec les jeux de données sélectionnés. Elle est accessible dans le menu principal. Si une clé « Google API » est configurée pour la carte, vous aurez également la possibilité de générer un lien court. Une fois que vous mettez en surbrillance le lien, copiez-le comme vous copiez normalement du texte (clic droit -> copier ou Ctrl+C)


# Couches

La liste déroulante « Couches » sert de légende à la carte et liste les couches pouvant être visualisées.

![Une icône représentant la fonction « Couches »](layer/layer.png) Accédez à la liste des couches en cliquant sur le bouton « Couches » en haut, à gauche de la partie centrale du visualiseur.

Une symbologie est associée à chaque couche. Pour les couches simples (feature layer), une seule icône sera présente à côté du nom de la couche. Pour les couches d'entités complexes (c.-à-d. celles où de multiples symboles sont utilisés par couche), les icônes s'affichent sous la forme d'une pile pouvant être agrandie et réduite. Une fois agrandies, les icônes se retrouvent sous le nom de la couche. Les couches SCW (WMS) peuvent optionnellement posséder une légende graphique qui sera, de la même manière, affichée sous la couche associée.

Certaines couches peuvent être visibles uniquement à certains niveaux de zoom. Si une couche n’est pas visible à un niveau de zoom donné, la légende affichera un avis ![[Une icône représentant la fonction qu'un calque ne peut pas être affiché au niveau de zoom actuel](layer/scale.png)) et offrira une action (![Une icône représentant la fonction permettant de faire un zoom pour rendre une couche de carte visible](layer/zoom.png)) afin d’établir une valeur de zoom à laquelle la couche sera visible (cela peut impliquer de faire soit un zoom avant, soit un zoom arrière).

Vous pouvez masquer ou afficher une couche à tout moment en sélectionnant l'icône de l'œil (![Une icône représentant la case à cocher servant à activer ou à désactiver une couche](layer/checkbox.png)) à côté de chaque couche.

Il existe cinq types de couches qui peuvent être présentes dans la liste déroulante « Couches » :

|Type de couches|Interactivité|Format de la couche|Support des tables|Notes|
|----|----|----|----|----|
| Élement | Oui | Vecteur | Oui | Rapide et efficace - rendu local pour les ensembles de géométrie de petite à moyenne taille |
| Dynamique | Oui | Données matricielles | Oui | Bon choix pour les ensembles de géométrie importante et complexe qui seraient lentes à rendre localement |
| Image | Non | Données matricielles | Non | Support des fichiers Raster et Image |
| Tuile | Non | Données matricielles | Non | Rapide et efficace - le serveur contient une mosaïque au rendu pré travaillé des tuiles |
| SCW (WMS) | Données matricielles | Oui | Non | Cartes image géoréférencées que le serveur génère en utilisant des données d'une base de données SIG |
| WFS | Oui | Vecteur | Oui | Rapide et efficace - rendu local pour les ensembles de géométrie de petite à moyenne taille |

Si une couche ne se charge pas correctement, elle sera identifiée par un avis d'erreur. Au lieu des actions de couche standard, vous pouvez choisir de soit recharger la couche, soit de la retirer.  Recharger la couche est particulièrement utile s’il y a un problème temporaire de connectivité réseau. Si une couche est retirée, elle sera également retirée de la liste déroulante des couches. Si elle est ajoutée de nouveau à l'aide du bouton « Annuler », elle perdra toutes les personnalisations prédéfinies.


# Options des couches

Survolez le nom d'une couche ou activez-la (mettre le « focus ») à l'aide des touches clavier et sélectionnez l'icône de trois points ![Un graphique représentant l’icône des « points de suspension » servant à ouvrir les paramètres de la couche](layer_settings/ellipses.png) pour accéder aux options supplémentaires de celle-ci.

Notez que certaines options peuvent ne pas être offertes en fonction de divers facteurs tels que le type de couche ou la configuration.

|Symbole|Nom|Description|
|----|----|----|
| ![Une icône représentant la fonction « Métadonnées de la couche »](layer_settings/metadata.png) | Métadonnées | Affiche les métadonnées dans un panneau coulissant |
| ![Une icône représentant la fonction « Paramètres de la couche »](layer_settings/settings.png) | Paramètres | Ouvre un panneau coulissant où l’opacité et la zone de délimitation peuvent être ajustées de même que la possibilité d’activer ou non les requêtes |
| ![Une icône représentant la fonction « Tableau de données de la couche »](layer_settings/datatable.png) | Tableau de données | Sélectionner pour visualiser les données sous forme de table |
| ![Une icône représentant la fonction « Afficher la légende »](layer_settings/layer.png) | Afficher la légende | Agrandit / réduit la liste d'images de la légende |
| ![Une icône représentant la fonction « Zoom avant sur la couche »](layer_settings/zoomto.png) | Zoomer à la limite | Déplace et zoom la carte afin que la limite de la couche soit en vue |
| ![Une icône représentant la fonction « Recharger la couche »](layer_settings/reload.png) | Recharger | Recharge la couche |
| ![Une icône représentant la fonction « Retirer la couche »](layer_settings/remove.png) | Retirer | Retire la couche de la carte et de la liste déroulante Couches |


# Sous-menu Couches

![Un graphique représentant la zone de l’interface à sélectionner pour ouvrir le sous-menu « Couches »](layer_submenu/menu_fr.png)

Fournit des options supplémentaires lorsque la liste déroulante « Couches » ouverte. Le sous-menu est montré en rouge ci-dessus et il a les options suivantes:

|Symbol|Nom|Description|
|----|----|----|
| ![Une icône représentant la fonction « Ajouter une couche »](layer_submenu/add.png) | Ajouter une couche | Ajouter une couche basée sur un fichier ou un service |
| ![Une icône représentant la fonction « Modifier l’ordre des couches »](layer_submenu/reorder.png) | Réorganiser les couches | Fournit une solution de remplacement à l'utilisation de la souris pour réorganiser les couches. Lorsque cette option est sélectionnée, les couches ne peuvent être réorganisées avec la souris qu'en maintenant l'icône de poignée à côté de chaque couche. Utile pour les appareils tactiles et les utilisateurs du clavier |
| ![Une icône représentant la fonction « Développer »](layer_submenu/expand.png) | Basculer les groupes | Ouvre ou ferme tous les groupes |
| ![Une icône représentant la fonction « Basculer la visibilité »](layer_submenu/view.png) | Basculer la visibilité | Active ou désactive la visibilité de toutes les couches |


# Ajouter une couche

Des couches supplémentaires peuvent être ajoutées au visualiseur de carte. Les formats pris en charge sont les suivants: couche d'éléments d'ESRI, couche dynamique d'ESRI, couche de tuiles d'ESRI, couche d'images d'ESRI, couche WMS de l'OGC ou couche Raster. Le bouton « + » en haut du menu Légende lance le menu « Ajouter une couche ».

Utilisation:
- Si vous souhaitez ajouter un fichier, vous pouvez le faire en faisant glisser le dossier sur l’importation Wizard, en cliquant sur le bouton « choisir un bouton File` et choisir le dossier, ou en fournissant l’adresse URL pour le dossier.
- Si vous souhaitez ajouter un service, vous pouvez le faire en entrant le service URL dans la boîte de texte.
- Cliquez sur le bouton « Continuer » pour continuer.
- Sélectionnez l’option dans le menu déroulant avec le bon dossier ou le type de service. Si le mauvais type est sélectionné, une erreur s’affichera vous demandant d’essayer un autre type.
- Cliquez sur le bouton « Continuer » pour continuer.
- Selon le type d'ensemble de données chargé, différents paramètres peuvent être définis dans cette phase finale.
- Un service d'éléments permet le choix d'un attribut principal, qui détermine l'attribut utilisé pour identifier un élément (enregistrement) dans le tableau de données et les étiquettes correspondantes sur la carte. Toutes les autres informations proviennent des métadonnées du service.
- Un service WMS permet le choix du nom de la couche, qui détermine la couche dans le WMS à utiliser comme source pour le jeu de données. Toutes les autres informations sont dérivées des métadonnées du service.
- Un service WFS permet le choix de ce qui suit: une couche nom, qui sera affiché dans le sélecteur de la couche; un champ principal, qui agit comme une caractéristique du service principal attribut; une couleur, qui détermine la couleur des points / activité / des polygones sur la carte. Tous les autres renseignements sont tirés du service des métadonnées.
- Les jeux de données basés sur des fichiers permettent le choix des attributs suivants: un nom de jeu de données qui sera affiché dans le sélecteur de couche; Un attribut principal qui agit de la même façon que dans le service d'élément; Une couleur de symbole qui détermine la couleur des points /lignes/polygones sur la carte. Les fichiers CSV permettent également la spécification des colonnes qui contiennent les valeurs de positionnement (Latitude et Longitude) utilisées pour déterminer l'emplacement des éléments sur la carte.
- Cliquez sur le bouton « Continuer » pour ajouter la couche à la carte et fermer le menu « Ajouter une couche ».


# Exporter l'image

Vous pouvez exporter une image de la carte et de ses couches visibles avec: une légende, un titre, une flèche du nord avec une échelle graphique, une note de bas de page personnalisée<sup>*</sup> et une estampille temporelle<sup>†</sup>.

Sélectionnez le bouton « Exporter » dans le menu de gauche pour faire apparaître une boîte de dialogue contenant une image de la carte ainsi qu'une zone d'édition vous permettant de saisir un titre si vous le souhaitez.

Si vous désirez ajouter ou supprimer des sections de l'image exportée telle que la légende, cliquez sur la roue dentée dans l'en-tête. Vous pourrez ainsi sélectionner / désélectionner les sections à afficher dans l'image exportée.

Pour modifier la taille du canevas de la carte, vous pouvez le faire à partir de la liste déroulante située dans l'en-tête. Sélectionnez une valeur prédéfinie (Par défaut/Petit/Médium) ou spécifiez votre propre taille en choisissant l'option taille personnalisée. Notez que les tailles affectent uniquement l'image de la carte, l'image exportée réelle peut être plus grande.

Cliquez sur le bouton de téléchargement dans l'en-tête pour obtenir l'image de carte finale.

<sup>*</sup>Veuillez noter que la note de bas de page peuvent ne pas être disponibles selon la carte. <br/>
<sup>†</sup>Veuillez prendre note estampille temporelle est facultative et pourraient ne pas être disponibles selon la carte


# Tableau de données du Tribunal

![Un graphique représentant un exemple de la vue Tableau de données](datatable/overview_fr.png)

Le __Tableau de données__ tribunal est indiqué ci-dessus dans son état initial.

En plus des données de défilement, il est possible de :
- Trier les données en cliquant sur l’en-tête de la colonne. Plusieurs colonnes peuvent être triés en appuyant sur la touche Shift avant de cliquer sur un en-tête de colonne
- Ouvrir le détail Tribunal correspondant à une ligne donnée en sélectionnant l’icône *détails* (![Une icône représentant la fonction « Détails »](datatable/details.png))
- Déplacer la carte et Zoom sur l’élément correspondant à une ligne donnée en sélectionnant *la fonction de zoom* icône (![Une icône représentant la fonction « Zoomer sur »](datatable/zoomto.png))
- Les colonnes en cliquant à côté du titre de la colonne de quart de travail il à gauche ou à droite (![Une icône représentant la fonction « Modifier l’ordre des colonnes »](datatable/reorder.png))
- Filtre les colonnes par gamme numérique, texte, la sélection ou la date (si la configuration permet). Changements dans le tableau peut également être apportées pour refléter sur la carte en appliquant des filtres de compensation ou de la carte (*appliquer*: ![Une icône représentant la fonction « Appliquer »](datatable/apply.png), *clair*: ![Une icône représentant la fonction « Effacer »](datatable/clear.png))
- Afficher ou masquer des colonnes en cliquant sur l’icône *masquer des colonnes* (![Une icône représentant la fonction « Masquer les colonnes »](datatable/hideColumns.png))
- Naviguer dans le tableau à l’aide d’un clavier

Si le nombre de caractères entrés dépasse la largeur de la zone de texte, seuls les caractères visibles sera affiché, suivi par ellipses (...). En sélectionnant le champ avec la souris ou le clavier et le curseur de la souris sur elle, le texte intégral sera affiché dans une infobulle.

Le nombre d’entités dans la couche est affiché dans le coin supérieur gauche de l’écran ci-dessous la couche Titre :

![Un graphique indiquant le nombre d’enregistrements affichés dans un tableau de données](datatable/allEntries_fr.png)

Filtrer les données des résultats dans plus de rétroaction :

![Un graphique indiquant le nombre d’enregistrements filtrés affichés dans un tableau de données](datatable/filteredEntries_fr.png)

### Le tableau de contrôle

![Un graphique représentant les icônes de contrôle de tableau d’un tableau de données](datatable/tableControls_fr.png)

Ce groupe de contrôle est situé dans le coin supérieur droit du tableau de données et a les options suivantes :
- Recherche mondiale
    - filtrer la table en faisant en sorte que le terme de recherche est un substring des rangées' données à un ou plusieurs colonnes
- Colonne claire filtres
    - clair des filtres existants qui peuvent être appliquées à la table
    - si aucun des filtres sont appliqués à la table, ce bouton sera désactivé
- Appliquer le tableau des filtres pour carte
    - mise à jour de la carte pour afficher seulement les données qui est visible dans le tableau
    - si les données dans le tableau déjà correspond aux données affichées sur la carte, ce bouton sera désactivé
- Basculer la colonne visibilité
    - vous permet de choisir les colonnes que vous souhaitez être visibles sur la table
- Tableau menu (plus d’options)

    ![Un graphique représentant un exemple du menu « Plus d’options » d’un tableau de données](datatable/menu_fr.png)

    - Vue partagée
        - tableau hauteur est la moitié de la hauteur de la carte
        - pas disponible dans vue mobile parce que le tableau prendra toute la hauteur et la largeur de la carte par défaut
    - Maximiser
        - tableau hauteur prend la pleine hauteur de la carte
        - pas disponible dans vue mobile parce que le tableau prendra toute la hauteur et la largeur de la carte par défaut
    - Filtrer par mesure
        - le tableau met automatiquement à jour sur la carte mesure du changement pour afficher seulement les caractéristiques de la couche dans la période de mesure
    - Montrer les filtres
        - basculer cette option de congé sera de masquer tous les filtres de colonne
            - incapable de modifier la colonne filtres alors activer à pied
            - la colonne des filtres demeurent appliqué même lorsque les activer à pied
    - Imprimer (désactivé par défaut)
        - prend l’utilisateur à une imprimante à imprimer la page affichant Table de données
    - Exportation
        - les exportations Table de données de format CSV
        - pourrait ne pas fonctionner comme prévu sur les appareils mobiles en raison des limites de téléchargement de fichiers
- Fermer le tableau
    - ferme le tableau

### Le tri et la commande de réapprovisionnement

Pour chaque colonne dans le tableau de données, il peut y avoir un ensemble de flèches associés à cette colonne qui représente la façon dont il peut être triés et reordered.

__La colonne genre__ : Cliquez sur le titre de la colonne pour trier les colonnes en ordre croissant ou ordre décroissant (pour les données numériques) et par ordre alphabétique (pour le texte des données).
- une flèche vers le haut (![Une icône représentant la fonction « Tri ascendant »](datatable/sortAsc.png)) à côté du titre de la colonne indique que la colonne des données sont triées en ordre croissant ou ordre alphabétique
- une flèche vers le bas (![Une icône représentant la fonction « Tri descendant »](datatable/sortDesc.png)) à côté du titre de la colonne indique que la colonne des données sont triés en ordre décroissant ou inverser l’ordre alphabétique
- aucune flèche vers le bas située à côté du titre de la colonne signifie qu’il n’y a pas de trier appliquées à la colonne
- tri de colonnes multiples à une fois par quart de travail + colonne sélectionner Nom
    - comment il fonctionne : la prochaine colonne sélectionnée en utilisant l’onglet seront classés selon la dernière colonne sélectionnée de groupes de données identiques

__La colonne de réapprovisionnement__ : Les deux droit / flèches gauche à côté de la colonne Nom sont pour modifier l’ordre d’affichage des colonnes.
- cliquez sur la flèche vers la droite (![Une icône représentant la fonction « Déplacer la colonne vers la droite »](datatable/rightReorderArrow.png)) pour échanger une colonne avec celle de droite
    - la flèche de droite est invalide pour le rightmost colonne du tableau de données
- cliquez sur la flèche de gauche (![Une icône représentant la fonction « Déplacer la colonne vers la gauche »](datatable/leftReorderArrow.png)) pour échanger une colonne avec le sur le côté gauche
    - la flèche de gauche est invalide pour la colonne complètement à gauche du tableau de données

### Filtrer les données

Les données peuvent être filtrés par colonne. Une colonne est consultable s’il y a un champ de saisie sous le titre de l’en-tête. Comme il a été mentionné précédemment, il y a quatre types de filtres :
- __Texte__ : Champ de caractères. Utiliser le caractère de remplacement (\*) pour remplacer une séquence de zéro ou plus de caractères (p. ex. _* levo_ trouverez Charlevoix)
    - _Remarque, sans un caractère générique, la recherche trouverez seulement les éléments où le mot fouillé commence la phrase._
- __Nombre__ : Champs de saisie qui acceptent seulement les chiffres
    - Si un minimum et un maximum sont définis le filtre pour une gamme de recherche
    - Si, par exemple, seulement un minimum est défini, il faudra effectuer l’opération _de plus de_
- __Sélection__ : Menu déroulant qui permet la sélection d’un ou de plusieurs valeurs prédéfinies
- __Date__ : Semblable au champ numérique mais qu’il utilise les dates

Certains filtres ne sont pas modifiable; leur valeur ne peut pas être modifiée. Ils sont représentés par une ligne en tirets inférieur à leur valeur.

![Un graphique représentant la zone « Rechercher dans le tableau » du tableau de données](datatable/search_fr.png)

Ce contrôle, qui se trouve dans le coin supérieur droit du tableau de données, permet de filtrer le tableau de données à l’échelle mondiale.
- Si vous entrez la valeur _Brook_, le tableau de données sera, sélectionnez les données que contient _Brook_ à tout endroit (p. ex. _Corner Brook_ sera sélectionné)

### Clavier, la navigation

Utiliser `Tab` à passer en revue chaque de la table de contrôle et de naviguer entre les trois principaux groupes :
- Les en-têtes de colonne
- La colonne des filtres
- Tableau corps

Une fois que tout grand groupe est axé sur, vous pouvez utiliser les touches fléchées pour naviguer dans le tableau des cellules pour cette composante. Cela mettra en évidence les concentre actuellement le tableau cellule.

Pour accéder les boutons et/ou les champs d’entrée de données dans une cellule, assurez-vous que la cellule est mis en évidence (en utilisant les touches fléchées comme ci-dessus) et utiliser `Tab` à naviguer entre ses enfants.


# Panneau d'information de la sélection interactive

Affiche les données associées à l’élément interactif sélectionné. Vous pouvez y accéder en effectuant une requête d'identification sur la carte et en sélectionnant la couche dans la liste des couches offertes ou en cliquant sur l'icône détails ![Une icône représentant la fonction « Détails de la caractéristique »](datatable/details.png) dans une table de données.


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


# Recherche géolocalisée

### Utilisation générale
La composante GéoRecherche fonctions pour permettre aux utilisateurs de chercher des endroits au Canada. Lorsque le GéoRecherche cliqué sur l’icône, la demande principale barre est remplacé par un champ de saisie de recherche Mots clés:

![Un graphique représentant la boîte de recherche « Emplacement »](geosearch/searchbar_fr.png)

#### Appuyé les types de recherche

__Recherche par mot-clé__: Entrez tout mot clé en GéoRecherche pour afficher une liste de résultats qui contient le mot clé.
- chaque résultat de recherche est composé de : le nom du lieu (avec le mot clé en surbrillance), emplacement, province et type d’emplacement (Lake, île, ville, de la municipalité, etc.)
- cliquez sur n’importe quel résultat individuel pour souligner ses coordonnées et de zoom de la carte pour cet emplacement

__Recherche de l’ASF__: Une zone de tri __région de tri d’acheminement (FSA)__ est une façon de désigner une région géographique fondée sur les trois premiers caractères dans un code postal canadien. Tous les codes postaux qui commencent avec les mêmes trois caractères sont considérés comme un __FSA__.
- une recherche à l’aide de la RTA affichera une liste de résultats dans les environs de cette zone
- le premier résultat est un endroit de l’ASF lui-même, cliquez sur ce de centre de zoom et la carte sur la FSA
- exemple : tapez __M3H__

__Latitude/longitude recherche__ : Recherche en utilisant LAT/long coordonne pour afficher une liste de résultats dans les environs de cette carte.
- de la même façon aux ASF de recherche, le premier résultat sera un endroit de ces coordonnées entrées, cliquez sur pour faire un zoom avant et au Centre de la carte sur la carte point
- lat/long recherche reconnaît les espaces, les virgules, points-virgules, ou barres verticale (|) pour séparer les coordonnées
- exemple : tapez __54.3733,-91.7417__

__Recherche des NNF__ : __Système national de référence cartographique (NTS)__ est un système utilisé pour la prestation de services généraux de cartes topographiques du pays, produisant des détails sur les reliefs, les lacs et les rivières, les forêts, les routes et les chemins de fer, etc.
- les NNF est divisée en trois grandes zones : « Zone sud » - latitudes entre 40°N et 68°N, « zone de l’Arctique » - latitudes entre 68°N et 80°N, et la « zone de l’Extrême-Arctique » - latitudes entre 80°N et 88°N
- une carte du SNRC nombre comprend une chaîne contenant un certain nombre de déterminer une feuille de carte, une lettre indiquant une région de la carte, et un certain nombre de déterminer l’ampleur de la feuille de carte
- de même, le premier résultat sera un emplacement du numéro de carte du SNRC, cliquez sur pour centrer la carte sur ce domaine
- exemple : tapez __030M13__

#### Types de recherche non

__Adresse municipale__ : Recherche en utilisant les adresses de la rue direct n’est pas appuyée par GéoRecherche.
- Inscrivez toute adresse municipale valide ne devrait pas retourner les résultats

### Recherche géolocalisée filtrage
Au moment de chercher un lieu, un des résultats s’affiche sous la case de recherche. Les résultats de ce tribunal contient deux boîtes de liste déroulante qui vous permettent de filtrer les résultats de la recherche par leur __province__ et par leur __type__ (Lake, ville, rivière, etc.). À la droite de ces deux boîtes est un __effacer les filtres__ ![Une icône représentant la fonction « Effacer »](datatable/clear.png) lorsque l’on clique sur le bouton supprime le filtre sélectionné les options.

![Un graphique représentant la fonction de filtre de la boîte de recherche « Emplacement »](geosearch/geofilter_fr.png)

Au bas du panneau des résultats, il y a une case à cocher étiquetés __visible sur la carte__. Cette case sera filtrer les résultats à seulement démontrer des endroits qui sont actuellement visibles sur la carte. Déplacer la carte vers ou sortie de zoom avec cette case sélectionné sera automatiquement mise à jour les résultats pour afficher les emplacements qui sont sur la carte.

![Un graphique représentant la fonction de « Basculer la visibilité » de la boîte de recherche « Emplacement »](geosearch/visiblemap_fr.png)