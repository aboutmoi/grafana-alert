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

Click on the extension icon in Chrome to configure:

- Enable/disable the extension
- Select areas to monitor on your dashboard
- Colors to detect:
  - Yellow (warning): `rgb(250, 176, 5)`
  - Red (alert): `rgb(245, 54, 54)`
- Minimum delay between sounds (default: 2000ms)

## How it works

1. Install the extension
2. Configure it according to your needs
3. Access your Grafana dashboard
4. The extension will automatically detect color changes
5. Sounds will be played for:
   - Yellow panel: warning sound
   - Red panel: alert sound

## File Structure

```
grafana-alert/
├── manifest.json          # Extension configuration
├── content.js            # Main script
├── popup.html            # Configuration interface
├── popup.js             # Configuration logic
├── sounds/              # Sounds folder
│   ├── sound_attention.mp3
│   ├── sound_alert.mp3
│   └── README.md
└── README.md            # This file
```

## Troubleshooting

If the extension is not working:

1. Check that sound files are present
2. Verify your color RGB values
3. Check the developer console (F12) for errors
4. Try reloading the extension
5. Make sure you have selected areas to monitor

## Support

For support:
1. Check the [Issues](https://github.com/yourusername/grafana-alert/issues) page
2. Open a new issue if needed
3. Provide as much detail as possible about your problem

## Acknowledgments

- Grafana team for their amazing dashboard platform
- Chrome Extension documentation and community 