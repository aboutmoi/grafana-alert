# Grafana Alert - Chrome Extension

A Chrome extension that monitors Grafana dashboards and triggers sound alerts based on color changes in panels.


## Features

- Real-time monitoring of Grafana dashboard panels
- Visual area selection for monitoring specific parts of the dashboard
- Color detection with configurable thresholds for:
  - Warning state (yellow)
  - Alert state (red)
- Sound notifications with customizable delay
- Visual notifications with status and next alert time
- Configurable minimum delay between alerts

## Installation

1. Clone this repository or download the files
2. Add your audio files in the `sounds/` folder:
   - `sound_attention.mp3` for warning state
   - `sound_alert.mp3` for alert state
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked extension"
6. Select the extension folder

## Usage

1. Click the extension icon in Chrome
2. Enable the extension
3. Click "Add area" to select parts of your Grafana dashboard to monitor
4. Enter the RGB values for warning and alert colors
5. Set the minimum delay between sounds
6. Click Save

The extension will now monitor the selected areas and play sounds when:
- Yellow warning color is detected
- Red alert color is detected

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

For support:
1. Check the [Issues](https://github.com/yourusername/grafana-alert/issues) page
2. Open a new issue if needed
3. Provide as much detail as possible about your problem

## Acknowledgments

- Grafana team for their amazing dashboard platform
- Chrome Extension documentation and community 