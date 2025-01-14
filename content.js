console.log('=== Grafana Alert: Extension Starting ===');

// Global variable for the monitor
let monitor = null;

// Default configuration
let CONFIG = {
  enabled: true,
  watchAreas: [], // List of areas to monitor {x, y, width, height}
  yellowColor: 'rgb(250, 176, 5)',
  redColor: 'rgb(196, 22, 42)',
  soundDelay: 2000
};

// Throttling system for logs
const LOG_THROTTLE = {
  COLOR_DETECTION: 10000,  // 10 seconds
  GENERAL: 30000,         // 30 seconds
  lastLogs: new Map()
};

// Throttled logging function
function throttledLog(type, message, data = null) {
  const currentTime = Date.now();
  const lastLogTime = LOG_THROTTLE.lastLogs.get(type) || 0;
  const throttleTime = type === 'COLOR_DETECTION' ? LOG_THROTTLE.COLOR_DETECTION : LOG_THROTTLE.GENERAL;
  
  if (currentTime - lastLogTime >= throttleTime) {
    LOG_THROTTLE.lastLogs.set(type, currentTime);
    const prefix = '[Grafana Alert]';
    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }
}

// Load initial configuration
chrome.storage.sync.get(CONFIG, (savedConfig) => {
  CONFIG = { ...CONFIG, ...savedConfig };
  throttledLog('GENERAL', 'Configuration loaded:', CONFIG);
  if (CONFIG.enabled) {
    initializeMonitor();
  }
});

// Message listener for selection
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_SELECTION') {
    throttledLog('GENERAL', 'Starting area selection');
    try {
      const selectionTool = new SelectionTool();
      selectionTool.createOverlay();
      if (sendResponse) {
        sendResponse({ success: true });
      }
    } catch (error) {
      throttledLog('GENERAL', 'Error creating selection tool:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: error.message });
      }
    }
    return true;
  }
});

// Class to handle visual selection
class SelectionTool {
  constructor() {
    this.overlay = null;
    this.selection = null;
    this.isSelecting = false;
    this.startX = 0;
    this.startY = 0;
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  createOverlay() {
    throttledLog('GENERAL', 'Creating selection overlay');
    
    // Create transparent overlay
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 10000;
      cursor: crosshair;
    `;

    // Create selection area
    this.selection = document.createElement('div');
    this.selection.style.cssText = `
      position: fixed;
      border: 2px solid #fff;
      background: rgba(255, 255, 255, 0.1);
      display: none;
      z-index: 10001;
    `;

    // Add instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      color: black;
      padding: 10px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 10002;
    `;
    instructions.textContent = 'Click and drag to select an area. Press Enter to validate or Escape to cancel.';

    document.body.appendChild(this.overlay);
    document.body.appendChild(this.selection);
    document.body.appendChild(instructions);

    this.setupEventListeners();
    throttledLog('GENERAL', 'Overlay created and events attached');
  }

  handleMouseDown(e) {
    throttledLog('GENERAL', 'Selection started', { x: e.clientX, y: e.clientY });
    this.isSelecting = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.selection.style.display = 'block';
    this.updateSelection(e);
  }

  handleMouseMove(e) {
    if (this.isSelecting) {
      this.updateSelection(e);
    }
  }

  handleMouseUp(e) {
    throttledLog('GENERAL', 'Selection ended', { x: e.clientX, y: e.clientY });
    this.isSelecting = false;
  }

  handleKeyDown(e) {
    if (e.key === 'Enter') {
      throttledLog('GENERAL', 'Validation of selection (Enter)');
      this.validateSelection();
    } else if (e.key === 'Escape') {
      throttledLog('GENERAL', 'Cancellation of selection (Escape)');
      this.cleanup();
    }
  }

  setupEventListeners() {
    throttledLog('GENERAL', 'Configuration of events');
    this.overlay.addEventListener('mousedown', this.boundMouseDown);
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
    document.addEventListener('keydown', this.boundKeyDown);
  }

  removeEventListeners() {
    throttledLog('GENERAL', 'Removing events');
    this.overlay.removeEventListener('mousedown', this.boundMouseDown);
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('keydown', this.boundKeyDown);
  }

  updateSelection(e) {
    const x = Math.min(e.clientX, this.startX);
    const y = Math.min(e.clientY, this.startY);
    const width = Math.abs(e.clientX - this.startX);
    const height = Math.abs(e.clientY - this.startY);

    this.selection.style.left = x + 'px';
    this.selection.style.top = y + 'px';
    this.selection.style.width = width + 'px';
    this.selection.style.height = height + 'px';
  }

  validateSelection() {
    const rect = this.selection.getBoundingClientRect();
    const area = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };

    throttledLog('GENERAL', 'Area validation:', area);

    // Send selected area to popup
    throttledLog('GENERAL', 'Sending AREA_SELECTED message to popup');
    chrome.runtime.sendMessage({
      type: 'AREA_SELECTED',
      area: area
    }, (response) => {
      if (chrome.runtime.lastError) {
        throttledLog('GENERAL', 'Error sending area:', chrome.runtime.lastError);
      } else {
        throttledLog('GENERAL', 'Area sent successfully:', response);
      }
    });

    this.cleanup();
  }

  cleanup() {
    throttledLog('GENERAL', 'Cleaning up selection tool');
    this.removeEventListeners();
    if (this.overlay) {
      this.overlay.remove();
    }
    if (this.selection) {
      this.selection.remove();
    }
    document.querySelector('div[style*="z-index: 10002"]')?.remove();
  }
}

// Configuration of colors to monitor
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

// Class to handle sounds
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

// List of colors to ignore (Grafana background colors)
const IGNORED_COLORS = [
  'rgb(24, 27, 31)',
  'rgb(27, 27, 31)',
  'rgba(24, 27, 31)',
  'rgba(27, 27, 31)',
  'transparent',
  'rgba(0, 0, 0, 0)'
];

// Function to check if a color should be ignored
function shouldIgnoreColor(color) {
  return IGNORED_COLORS.includes(color);
}

// Function to compare colors with a tolerance
function isSimilarColor(color1, color2, tolerance = 30) {
  // Extract RGB components
  const rgb1 = color1.match(/\d+/g).map(Number);
  const rgb2 = color2.match(/\d+/g).map(Number);
  
  // Calculate difference for each component
  const diff = getRGBDifference(color1, color2);
  
  // For red, we're more tolerant on the red component
  if (rgb2[0] > 150 && rgb2[1] < 100 && rgb2[2] < 100) { // If it's red
    return diff.r < tolerance * 2 && diff.g < tolerance && diff.b < tolerance;
  }
  
  // For yellow, we're more tolerant on the red and green components
  if (rgb2[0] > 200 && rgb2[1] > 150 && rgb2[2] < 100) { // If it's yellow
    return diff.r < tolerance * 1.5 && diff.g < tolerance * 1.5 && diff.b < tolerance;
  }
  
  // Standard comparison
  return diff.r < tolerance && diff.g < tolerance && diff.b < tolerance;
}

// Utility function to calculate the difference between two RGB colors
function getRGBDifference(color1, color2) {
  const rgb1 = color1.match(/\d+/g).map(Number);
  const rgb2 = color2.match(/\d+/g).map(Number);
  return {
    r: Math.abs(rgb1[0] - rgb2[0]),
    g: Math.abs(rgb1[1] - rgb2[1]),
    b: Math.abs(rgb1[2] - rgb2[2]),
    total: Math.abs(rgb1[0] - rgb2[0]) + Math.abs(rgb1[1] - rgb2[1]) + Math.abs(rgb1[2] - rgb2[2])
  };
}

// Function to compare two areas
function areSameAreas(area1, area2) {
  return (
    area1.x === area2.x &&
    area1.y === area2.y &&
    area1.width === area2.width &&
    area1.height === area2.height
  );
}

// Global variable to keep a reference to the last debug capture
let currentDebugContainer = null;

// Variable to track if debug captures should be shown
let showDebugCaptures = true;

// Hide debug captures after 15 seconds
setTimeout(() => {
  showDebugCaptures = false;
  // Remove all existing debug images
  document.querySelectorAll('.debug-capture').forEach(el => el.remove());
}, 15000);

// Function to display debug image
function showDebugImage(dataUrl, area) {
  if (!showDebugCaptures) return;
  
  // Remove existing debug image if it exists
  document.querySelectorAll(`.debug-capture[data-area="${area.x}-${area.y}"]`).forEach(el => el.remove());
  
  // Create debug container
  const debugContainer = document.createElement('div');
  debugContainer.className = 'debug-capture';
  debugContainer.setAttribute('data-area', `${area.x}-${area.y}`);
  debugContainer.style.cssText = `
    position: fixed;
    right: 20px;
    top: 20px;
    background: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    color: white;
    font-size: 12px;
  `;
  
  // Create debug image
  const debugImage = document.createElement('img');
  debugImage.src = dataUrl;
  debugImage.style.cssText = `
    max-width: 200px;
    max-height: 200px;
    display: block;
    margin-bottom: 5px;
  `;
  
  // Add zone information
  const debugInfo = document.createElement('div');
  debugInfo.textContent = `Zone: ${Math.round(area.x)},${Math.round(area.y)} - ${Math.round(area.width)}x${Math.round(area.height)}`;
  
  debugContainer.appendChild(debugImage);
  debugContainer.appendChild(debugInfo);
  document.body.appendChild(debugContainer);
}

// Main class for monitoring
class GrafanaMonitor {
  constructor() {
    this.soundManager = new SoundManager();
    this.canvas = document.createElement('canvas');
    // Optimization for frequent reads
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.monitoringInterval = null;
    // Map to store active alerts and their timestamp
    this.activeAlerts = new Map(); // Format: {areaId: {color: string, lastAlertTime: number}}
  }

  init() {
    this.soundManager.init();
    this.startMonitoring();
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.activeAlerts.clear();
    }
  }

  // Function to capture and analyze an area
  async analyzeArea(area) {
    try {
      const imageData = await this.captureArea(area);
      if (!imageData) {
        throttledLog('GENERAL', '❌ Screenshot capture failed');
        return;
      }
      
      const colors = this.analyzeColors(imageData);
      const significantColor = this.findSignificantColor(colors);
      
      const areaId = `${area.x}-${area.y}-${area.width}-${area.height}`;
      const currentTime = Date.now();
      const activeAlert = this.activeAlerts.get(areaId);
      const fiveMinutes = 5 * 60 * 1000;
      
      if (significantColor) {
        if (!activeAlert || 
            activeAlert.color !== significantColor || 
            (currentTime - activeAlert.lastAlertTime) >= fiveMinutes) {
          
          if (significantColor === CONFIG.redColor) {
            this.soundManager.playSound('RED');
          } else if (significantColor === CONFIG.yellowColor) {
            this.soundManager.playSound('YELLOW');
          }
          
          this.activeAlerts.set(areaId, {
            color: significantColor,
            lastAlertTime: currentTime
          });
          
          // Create temporary overlay with countdown
          const nextAlertTime = new Date(currentTime + fiveMinutes).toLocaleTimeString();
          this.showTemporaryOverlay(area, significantColor, nextAlertTime);
          
          throttledLog('GENERAL', '🚨 Alert triggered:', {
            zone: area,
            color: significantColor,
            nextAlert: `⏰ ${nextAlertTime}`
          });
          
          throttledLog('GENERAL', '⏰ Next alert scheduled for:', nextAlertTime);
        }
      } else if (activeAlert) {
        // If transitioning from alert to no alert, show temporary overlay
        this.showTemporaryOverlay(area, 'normal', null);
        this.activeAlerts.delete(areaId);
      }
    } catch (error) {
      throttledLog('GENERAL', '❌ Analysis error:', error);
    }
  }

  // New method to show temporary overlay
  showTemporaryOverlay(area, state, nextAlertTime) {
    const overlayId = 'alert-overlay'; // Single ID for all overlays
    let overlay = document.getElementById(overlayId);
    
    // If an overlay already exists and a fade animation is in progress, cancel it
    if (overlay && overlay.timeoutId) {
      clearTimeout(overlay.timeoutId);
      clearTimeout(overlay.fadeTimeoutId);
    }
    
    if (overlay) {
      // Reuse existing overlay
      overlay.style.opacity = '1';
    } else {
      // Create new overlay if none exists
      overlay = document.createElement('div');
      overlay.id = overlayId;
      document.body.appendChild(overlay);
    }
    
    let message;
    let backgroundColor;
    
    switch (state) {
      case CONFIG.redColor:
        message = `🔴 Red Alert detected in area ${area.x},${area.y}\nNext alert at ${nextAlertTime}`;
        backgroundColor = 'rgba(196, 22, 42, 0.9)';
        break;
      case CONFIG.yellowColor:
        message = `🟡 Warning detected in area ${area.x},${area.y}\nNext alert at ${nextAlertTime}`;
        backgroundColor = 'rgba(250, 176, 5, 0.9)';
        break;
      case 'normal':
        message = `✅ Back to normal in area ${area.x},${area.y}`;
        backgroundColor = 'rgba(0, 128, 0, 0.9)';
        break;
    }
    
    overlay.style.cssText = `
      position: fixed;
      right: 20px;
      bottom: 20px;
      max-width: 300px;
      background: ${backgroundColor};
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10000;
      text-align: center;
      white-space: pre-line;
      pointer-events: none;
      transition: opacity 0.3s ease-in-out;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    overlay.textContent = message;
    
    // Fade out overlay after 3 seconds
    overlay.timeoutId = setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.fadeTimeoutId = setTimeout(() => {
        overlay.remove();
        overlay.timeoutId = null;
        overlay.fadeTimeoutId = null;
      }, 300);
    }, 3000);
  }

  // Function to capture a screen area
  async captureArea(area) {
    try {
      throttledLog('COLOR_DETECTION', '🎥 Requesting screenshot of the area...', {
        dimensions: {
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height
        }
      });

      // Request screenshot from background script
      return new Promise((resolve, reject) => {
        let messageListener;
        const cleanup = () => {
          if (messageListener) {
            chrome.runtime.onMessage.removeListener(messageListener);
          }
        };

        // Listen for background script response
        messageListener = (message) => {
          if (message.type === 'SCREENSHOT_ERROR' && areSameAreas(message.area, area)) {
            cleanup();
            throttledLog('GENERAL', '🚨 Error reported by background:', message.error);
            reject(new Error(message.error));
            return false;
          }
          
          if (message.type === 'SCREENSHOT_READY' && areSameAreas(message.area, area)) {
            cleanup();
            
            // Display debug image
            showDebugImage(message.dataUrl, area);

            // Create image from data URL
            const img = new Image();
            img.onload = () => {
              throttledLog('COLOR_DETECTION', '📸 Image received', {
                width: img.width,
                height: img.height
              });

              // Configure canvas to area dimensions
              this.canvas.width = area.width;
              this.canvas.height = area.height;

              // Draw image directly on canvas
              this.ctx.drawImage(img, 0, 0);
              throttledLog('COLOR_DETECTION', '🖼️ Zone captured on canvas');

              // Get image data
              const imageData = this.ctx.getImageData(0, 0, area.width, area.height);
              throttledLog('COLOR_DETECTION', '📊 Image data obtained', {
                width: imageData.width,
                height: imageData.height,
                totalPixels: imageData.width * imageData.height
              });

              resolve(imageData);
            };

            img.onerror = () => {
              cleanup();
              throttledLog('GENERAL', '🚨 Error loading image');
              reject(new Error('Error loading image'));
            };

            img.src = message.dataUrl;
            return false;
          }
          return false;
        };

        // Add message listener
        chrome.runtime.onMessage.addListener(messageListener);

        // Request screenshot of the specific area
        chrome.runtime.sendMessage({
          type: 'REQUEST_SCREENSHOT',
          area: {
            x: Math.round(area.x),
            y: Math.round(area.y),
            width: Math.round(area.width),
            height: Math.round(area.height)
          }
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          cleanup();
          reject(new Error('Timeout during screenshot capture'));
        }, 5000);
      });
    } catch (error) {
      throttledLog('GENERAL', '🚨 Error during screenshot capture:', error);
      return null;
    }
  }

  // Function to analyze colors in an image
  analyzeColors(imageData) {
    throttledLog('COLOR_DETECTION', '🔍 Starting color analysis...');
    
    const colors = new Map();
    const data = imageData.data;
    let analyzedPixels = 0;
    let ignoredPixels = 0;
    
    // Process all pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Ignore transparent pixels
      if (a < 128) {
        ignoredPixels++;
        continue;
      }

      const rgb = `rgb(${r}, ${g}, ${b})`;

      if (!shouldIgnoreColor(rgb)) {
        colors.set(rgb, (colors.get(rgb) || 0) + 1);
        analyzedPixels++;
      } else {
        ignoredPixels++;
      }
    }

    throttledLog('COLOR_DETECTION', '📈 Color analysis statistics:', {
      totalPixels: imageData.width * imageData.height,
      analyzedPixels: analyzedPixels,
      ignoredPixels: ignoredPixels,
      uniqueColors: colors.size
    });

    // Sort colors by frequency
    const sortedColors = Array.from(colors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([color, count]) => {
        const percentage = (count / (imageData.width * imageData.height) * 100).toFixed(2);
        const colorInfo = {
          color,
          count,
          percentage: percentage + '%',
          similarToRed: isSimilarColor(color, CONFIG.redColor),
          similarToYellow: isSimilarColor(color, CONFIG.yellowColor),
          difference: {
            red: getRGBDifference(color, CONFIG.redColor),
            yellow: getRGBDifference(color, CONFIG.yellowColor)
          }
        };

        // Add color description
        if (color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)) {
          const [r, g, b] = color.match(/\d+/g).map(Number);
          let description = '';
          if (r > 200 && g < 100 && b < 100) description = 'Bright Red';
          else if (r > 150 && g < 50 && b < 50) description = 'Dark Red';
          else if (r > 200 && g > 200 && b < 100) description = 'Yellow';
          else if (r < 100 && g > 150 && b < 100) description = 'Green';
          else if (r === g && g === b) description = 'Gray';
          else description = 'Other';
          colorInfo.description = description;
        }

        return colorInfo;
      });

    // Display main color details
    throttledLog('COLOR_DETECTION', '🎨 Top 10 detected colors:', sortedColors.map(c => ({
      color: c.color,
      description: c.description,
      percentage: c.percentage,
      similarToRed: c.similarToRed ? '✅' : '❌',
      similarToYellow: c.similarToYellow ? '✅' : '❌',
      redDifference: c.difference.red,
      yellowDifference: c.difference.yellow
    })));

    // Display reference colors
    throttledLog('GENERAL', '🎯 Reference colors:', {
      red: CONFIG.redColor,
      yellow: CONFIG.yellowColor
    });
    
    // Create summary of significant colors
    const summary = sortedColors
      .filter(c => c.percentage > 1) // Filter colors representing more than 1%
      .map(c => `${c.description} (${c.color}): ${c.percentage}`);
    throttledLog('COLOR_DETECTION', '📊📊 Summary of significant colors:', summary);

    return sortedColors;
  }

  // Function to find a significant color
  findSignificantColor(colors) {
    throttledLog('COLOR_DETECTION', '🔎 Searching for significant colors...');
    
    // Define minimum pixel size to consider a color as significant
    const minPixels = 100; // Minimum area of 10x10 pixels
    
    for (const {color, count, percentage} of colors) {
      const similarToRed = isSimilarColor(color, CONFIG.redColor);
      const similarToYellow = isSimilarColor(color, CONFIG.yellowColor);
      
      if ((similarToRed || similarToYellow) && count >= minPixels) {
        throttledLog('COLOR_DETECTION', '✨ Significant color found:', {
          color,
          type: similarToRed ? 'red' : 'yellow',
          numberOfPixels: count,
          percentage: percentage,
          difference: {
            red: getRGBDifference(color, CONFIG.redColor),
            yellow: getRGBDifference(color, CONFIG.yellowColor)
          }
        });
        return similarToRed ? CONFIG.redColor : CONFIG.yellowColor;
      }
    }
    
    throttledLog('COLOR_DETECTION', '❌ No significant color found');
    return null;
  }

  startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    // Small delay at startup to avoid double alerts
    setTimeout(() => {
      this.monitoringInterval = setInterval(() => {
        if (!CONFIG.enabled) return;
        
        CONFIG.watchAreas.forEach(area => {
          this.analyzeArea(area);
        });
      }, 1000);
    }, 1000);
  }
}

// Function to initialize the monitor
function initializeMonitor() {
  monitor = new GrafanaMonitor();
  monitor.init();
}

// Listen for popup messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  throttledLog('GENERAL', 'Message received:', message);
  
  if (message.type === 'START_SELECTION') {
    throttledLog('GENERAL', 'Starting selection tool');
    const tool = new SelectionTool();
    tool.createOverlay();
  } else if (message.type === 'CONFIG_UPDATED') {
    throttledLog('GENERAL', 'Configuration update:', message.config);
    CONFIG = { ...CONFIG, ...message.config };
    if (monitor) {
      monitor.stop();
    }
    if (CONFIG.enabled) {
      initializeMonitor();
    }
  }
  return true;
});

// Initialize monitor at startup if enabled
chrome.storage.sync.get(CONFIG, (savedConfig) => {
  CONFIG = { ...CONFIG, ...savedConfig };
  throttledLog('GENERAL', 'Configuration loaded:', CONFIG);
  if (CONFIG.enabled) {
    initializeMonitor();
  }
}); 