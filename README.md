# Grafana Alert - Chrome Extension

A Chrome extension that monitors Grafana dashboards and triggers sound alerts based on color changes in panels.

![Grafana Alert Screenshot](docs/screenshot.png)

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

The extension can be configured through its popup interface:

- **Warning and Alert Colors**: Enter the RGB values of the colors to monitor (e.g., "rgb(250, 176, 5)")
- **Monitored Areas**: Select specific areas of your dashboard to watch
- **Sound Delay**: Set the minimum time between consecutive alerts (default: 2000ms)

All settings are saved automatically and persist between browser sessions.

## Project Structure

```
grafana-alert/
├── manifest.json          # Extension configuration
├── popup.html            # Configuration interface
├── popup.js             # Configuration logic
├── content.js           # Main monitoring script
├── background.js        # Screenshot handling
├── sounds/              # Audio files directory
│   ├── sound_attention.mp3
│   └── sound_alert.mp3
└── README.md
```

## Technical Details

### How it works

1. The extension uses MutationObserver to monitor selected areas of your Grafana dashboard
2. It captures screenshots of monitored areas using Chrome's captureVisibleTab API
3. Color analysis is performed on the captured areas to detect warning and alert states
4. Sound notifications are triggered based on the detected colors
5. A minimum delay between alerts prevents notification spam

### Browser Compatibility

- Chrome: version 88 or later
- Edge: version 88 or later (Chromium-based)

### Dependencies

This extension is built with vanilla JavaScript and requires no external dependencies.

## Development

### Prerequisites

- Google Chrome or compatible browser
- Basic knowledge of Chrome Extension APIs
- Audio files for notifications

### Local Development

1. Clone the repository
2. Make your changes
3. Load the extension in Chrome using Developer mode
4. Test your changes on a Grafana dashboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

This extension requires the following permissions:
- `activeTab`: For capturing screenshots
- `storage`: For saving configuration
- `scripting`: For injecting content scripts

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support:
1. Check the [Issues](https://github.com/yourusername/grafana-alert/issues) page
2. Open a new issue if needed
3. Provide as much detail as possible about your problem

## Acknowledgments

- Grafana team for their amazing dashboard platform
- Chrome Extension documentation and community 