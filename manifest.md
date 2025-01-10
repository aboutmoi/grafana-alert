Projet : Extension Chrome pour la détection de changements de couleur sur un dashboard Grafana

Ce projet a pour objectif de créer une extension Chrome capable de surveiller, en temps réel, les tuiles d’un dashboard Grafana et de déclencher une alerte sonore lorsque certaines couleurs (vert, jaune, rouge) apparaissent. L’extension repose sur un content script qui observe les modifications de style (via un MutationObserver) afin de détecter les états suivants :

Attention requise (couleur jaune)
Alerte (couleur rouge)

Chaque couleur déclenche un son spécifique, défini dans un mapping (par exemple sound_ok.mp3, sound_attention.mp3, sound_alert.mp3). Le principe général est le suivant :

Manifest de l’extension:

Contient les métadonnées (nom, version, description).
Déclare un content script (fichier content.js) injecté sur l’URL du dashboard Grafana.
Fournit les permissions nécessaires (e.g. activeTab, scripting).
Content Script (content.js)

Localise le conteneur (ou chaque tuile) dans la page (via XPath ou sélecteur CSS), que l'utilisateur peut définir. Il peut en choisir plusieurs.
Met en place un MutationObserver écoutant les changements de style ou de classe (attributes → style, class).
Compare la couleur de fond (backgroundColor) à une liste prédéfinie (vert, jaune, rouge).
Joue un son correspondant à l’état détecté.


Arborescence minimale:

manifest.json
content.js
Fichiers audios (ex. sound_ok.mp3, sound_attention.mp3, sound_alert.mp3).
Installation dans Chrome

Activer le « Mode développeur » dans chrome://extensions.
« Charger l’extension non empaquetée » depuis le dossier du projet.
Ce mécanisme évite de multiplier les observateurs par tuile : un unique MutationObserver fixé sur le conteneur principal surveille en continu l’ensemble des tuiles. Lorsqu’un changement de couleur est détecté (par dépassement de seuil ou autre configuration Grafana), l’extension émet l’avertissement sonore approprié.