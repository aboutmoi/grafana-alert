// Configuration par défaut
let CONFIG = {
  enabled: true,
  selector: '.panel-container',
  yellowColor: 'rgb(250, 176, 5)',
  redColor: 'rgb(245, 54, 54)',
  soundDelay: 2000
};

// Charger la configuration initiale
chrome.storage.sync.get(CONFIG, (savedConfig) => {
  CONFIG = savedConfig;
  if (CONFIG.enabled) {
    initializeMonitor();
  }
});

// Écouter les changements de configuration
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONFIG_UPDATED') {
    CONFIG = message.config;
    // Redémarrer le moniteur avec la nouvelle configuration
    if (monitor) {
      monitor.disconnect();
    }
    if (CONFIG.enabled) {
      initializeMonitor();
    }
  }
});

// Configuration des couleurs à surveiller
const getColorStates = () => ({
  YELLOW: {
    rgb: CONFIG.yellowColor,
    soundFile: 'sounds/sound_attention.mp3'
  },
  RED: {
    rgb: CONFIG.redColor,
    soundFile: 'sounds/sound_alert.mp3'
  }
});

// Classe pour gérer les sons
class SoundManager {
  constructor() {
    this.sounds = new Map();
    this.lastPlayedSound = null;
    this.lastPlayedTime = 0;
  }

  loadSound(state) {
    const COLOR_STATES = getColorStates();
    const audio = new Audio(chrome.runtime.getURL(COLOR_STATES[state].soundFile));
    this.sounds.set(state, audio);
  }

  init() {
    Object.keys(getColorStates()).forEach(state => this.loadSound(state));
  }

  playSound(state) {
    const now = Date.now();
    if (now - this.lastPlayedTime < CONFIG.soundDelay) {
      return;
    }

    const sound = this.sounds.get(state);
    if (sound) {
      if (this.lastPlayedSound) {
        this.lastPlayedSound.pause();
        this.lastPlayedSound.currentTime = 0;
      }
      sound.play();
      this.lastPlayedSound = sound;
      this.lastPlayedTime = now;
    }
  }
}

// Classe principale pour la surveillance des panneaux Grafana
class GrafanaMonitor {
  constructor() {
    this.soundManager = new SoundManager();
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.previousState = null;
  }

  init() {
    this.soundManager.init();
    this.startMonitoring();
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  getColorState(backgroundColor) {
    const COLOR_STATES = getColorStates();
    return Object.entries(COLOR_STATES).find(([_, value]) => 
      value.rgb === backgroundColor
    )?.[0];
  }

  handlePanelChange(element) {
    if (!CONFIG.enabled) return;
    
    const backgroundColor = window.getComputedStyle(element).backgroundColor;
    const currentState = this.getColorState(backgroundColor);

    if (currentState && currentState !== this.previousState) {
      this.soundManager.playSound(currentState);
      this.previousState = currentState;
    }
  }

  setupObserver() {
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class']
    };

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.target.matches(CONFIG.selector)) {
          this.handlePanelChange(mutation.target);
        }
      });
    });

    // Attendre que Grafana soit chargé
    const checkGrafanaLoaded = setInterval(() => {
      const panels = document.querySelectorAll(CONFIG.selector);
      if (panels.length > 0) {
        clearInterval(checkGrafanaLoaded);
        panels.forEach(panel => {
          this.observer.observe(panel, config);
          this.handlePanelChange(panel); // Vérification initiale
        });
      }
    }, 1000);
  }

  // Fonction pour capturer et analyser une zone
  async analyzeArea(area) {
    try {
      debugLog('📸 Capture de la zone:', {
        x: Math.round(area.x),
        y: Math.round(area.y),
        largeur: Math.round(area.width),
        hauteur: Math.round(area.height)
      });

      // Créer une capture d'écran de la zone
      const imageData = await this.captureArea(area);
      if (!imageData) {
        debugLog('❌ Échec de la capture d\'écran');
        return;
      }

      // Analyser les couleurs de l'image
      const colors = this.analyzeColors(imageData);
      debugLog('🎨 Couleurs détectées:', colors);

      // Vérifier si une couleur significative est présente
      const significantColor = this.findSignificantColor(colors);

      // Créer un élément div pour visualiser la zone analysée
      const debugOverlay = document.createElement('div');
      debugOverlay.style.cssText = `
        position: fixed;
        left: ${area.x}px;
        top: ${area.y}px;
        width: ${area.width}px;
        height: ${area.height}px;
        border: 2px solid ${significantColor ? 'lime' : 'red'};
        pointer-events: none;
        z-index: 10000;
      `;
      document.body.appendChild(debugOverlay);
      setTimeout(() => debugOverlay.remove(), 2000);

      if (significantColor && significantColor !== this.previousState) {
        debugLog('✅ Couleur significative détectée:', significantColor);
        this.soundManager.playSound(significantColor === CONFIG.redColor ? 'RED' : 'YELLOW');
        this.previousState = significantColor;
      }
    } catch (error) {
      debugLog('🚨 Erreur lors de l\'analyse de la zone:', error);
    }
  }

  // Fonction pour capturer une zone de l'écran
  async captureArea(area) {
    try {
      debugLog('🎥 Demande de capture d\'écran...', {
        dimensions: {
          x: area.x,
          y: area.y,
          largeur: area.width,
          hauteur: area.height
        }
      });

      // Créer une capture d'écran
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            minWidth: area.width,
            maxWidth: area.width,
            minHeight: area.height,
            maxHeight: area.height
          }
        }
      });

      debugLog('📸 Flux vidéo obtenu', {
        tracks: stream.getTracks().map(track => ({
          type: track.kind,
          label: track.label,
          settings: track.getSettings()
        }))
      });

      // Créer une vidéo pour recevoir le flux
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      debugLog('🎬 Vidéo en cours de lecture', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });

      // Configurer le canvas
      this.canvas.width = area.width;
      this.canvas.height = area.height;

      // Dessiner la vidéo sur le canvas
      this.ctx.drawImage(video, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
      debugLog('🖼️ Image capturée sur le canvas');

      // Arrêter le flux
      stream.getTracks().forEach(track => track.stop());
      debugLog('⏹️ Flux vidéo arrêté');

      // Retourner les données de l'image
      const imageData = this.ctx.getImageData(0, 0, area.width, area.height);
      debugLog('📊 Données image obtenues', {
        largeur: imageData.width,
        hauteur: imageData.height,
        nombrePixels: imageData.width * imageData.height
      });

      return imageData;
    } catch (error) {
      debugLog('🚨 Erreur lors de la capture d\'écran:', error);
      return null;
    }
  }

  // Fonction pour analyser les couleurs d'une image
  analyzeColors(imageData) {
    debugLog('🔍 Début analyse des couleurs...');
    
    const colors = new Map();
    const data = imageData.data;
    let pixelsAnalysés = 0;
    let pixelsIgnorés = 0;
    
    // Parcourir tous les pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const rgb = `rgb(${r}, ${g}, ${b})`;

      if (!shouldIgnoreColor(rgb)) {
        colors.set(rgb, (colors.get(rgb) || 0) + 1);
        pixelsAnalysés++;
      } else {
        pixelsIgnorés++;
      }
    }

    debugLog('📈 Statistiques analyse couleurs:', {
      totalPixels: imageData.width * imageData.height,
      pixelsAnalysés,
      pixelsIgnorés,
      couleursUniques: colors.size
    });

    // Trier les couleurs par fréquence
    const sortedColors = Array.from(colors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([color, count]) => {
        const percentage = (count / (imageData.width * imageData.height) * 100).toFixed(2);
        return {
          color,
          count,
          percentage: percentage + '%',
          similaireRouge: isSimilarColor(color, CONFIG.redColor),
          similaireJaune: isSimilarColor(color, CONFIG.yellowColor),
          différence: {
            rouge: getRGBDifference(color, CONFIG.redColor),
            jaune: getRGBDifference(color, CONFIG.yellowColor)
          }
        };
      });

    debugLog('🎨 Top 10 des couleurs détectées:', sortedColors);
    return sortedColors;
  }

  // Fonction pour trouver une couleur significative
  findSignificantColor(colors) {
    debugLog('🔎 Recherche de couleurs significatives...');
    
    for (const {color, percentage} of colors) {
      const similaireRouge = isSimilarColor(color, CONFIG.redColor);
      const similaireJaune = isSimilarColor(color, CONFIG.yellowColor);
      
      if (similaireRouge || similaireJaune) {
        debugLog('✨ Couleur significative trouvée:', {
          couleur: color,
          type: similaireRouge ? 'rouge' : 'jaune',
          pourcentage: percentage,
          différence: {
            rouge: getRGBDifference(color, CONFIG.redColor),
            jaune: getRGBDifference(color, CONFIG.yellowColor)
          }
        });
        return similaireRouge ? CONFIG.redColor : CONFIG.yellowColor;
      }
    }
    
    debugLog('❌ Aucune couleur significative trouvée');
    return null;
  }

  startMonitoring() {
    setInterval(() => {
      if (!CONFIG.enabled) return;
      
      CONFIG.watchAreas.forEach(area => {
        this.analyzeArea(area);
      });
    }, 10000); // Vérifier toutes les 10 secondes
  }
}

let monitor = null;

function initializeMonitor() {
  monitor = new GrafanaMonitor();
  monitor.init();
} 