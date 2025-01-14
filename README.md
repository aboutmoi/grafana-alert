# Grafana Alert

Extension Chrome qui surveille les dashboards Grafana et déclenche des alertes sonores en fonction des changements de couleur des panneaux.

## Installation

1. Téléchargez ou clonez ce dépôt
2. Ajoutez vos fichiers audio dans le dossier `sounds/` (voir [sounds/README.md](sounds/README.md))
3. Ouvrez Chrome et accédez à `chrome://extensions/`
4. Activez le "Mode développeur" (en haut à droite)
5. Cliquez sur "Charger l'extension non empaquetée"
6. Sélectionnez le dossier `grafana-alert`

## Configuration

Cliquez sur l'icône de l'extension dans Chrome pour configurer :

- Activer/désactiver l'extension
- Sélecteur CSS des éléments à surveiller (par défaut : `.panel-container`)
- Couleurs à détecter :
  - Jaune (attention) : `rgb(250, 176, 5)`
  - Rouge (alerte) : `rgb(245, 54, 54)`
- Délai minimum entre les sons (par défaut : 2000ms)

## Utilisation

1. Installez l'extension
2. Configurez-la selon vos besoins
3. Accédez à votre dashboard Grafana
4. L'extension détectera automatiquement les changements de couleur
5. Des sons seront joués pour :
   - Panneau jaune : son d'attention
   - Panneau rouge : son d'alerte

## Structure des fichiers

```
grafana-alert/
├── manifest.json          # Configuration de l'extension
├── content.js            # Script principal
├── popup.html            # Interface de configuration
├── popup.js             # Logique de configuration
├── sounds/              # Dossier des sons
│   ├── sound_attention.mp3
│   ├── sound_alert.mp3
│   └── README.md
└── README.md            # Ce fichier
```

## Dépannage

Si l'extension ne fonctionne pas :

1. Vérifiez que les fichiers sons sont présents
2. Assurez-vous que le sélecteur CSS correspond à vos panneaux
3. Vérifiez les valeurs RGB des couleurs
4. Consultez la console développeur (F12) pour les erreurs
5. Essayez de recharger l'extension

## Support

Cette extension fonctionne avec :
- Chrome version 88+
- Grafana version 7+ 