// Fonction de debug
function debugLog(message, data = null) {
  const prefix = '[Grafana Alert Popup]';
  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

// Configuration par défaut
const DEFAULT_CONFIG = {
  enabled: true,
  watchAreas: [],
  yellowColor: 'rgb(250, 176, 5)',
  redColor: 'rgb(245, 54, 54)',
  soundDelay: 2000
};

// Éléments du DOM
const elements = {
  enabled: document.getElementById('enabled'),
  areasList: document.getElementById('areas-list'),
  addAreaButton: document.getElementById('add-area'),
  yellowColor: document.getElementById('yellowColor'),
  redColor: document.getElementById('redColor'),
  soundDelay: document.getElementById('soundDelay'),
  yellowPreview: document.getElementById('yellowPreview'),
  redPreview: document.getElementById('redPreview'),
  saveButton: document.getElementById('save'),
  status: document.getElementById('status')
};

// Créer un élément de zone
function createAreaItem(area) {
  const item = document.createElement('div');
  item.className = 'area-item';
  
  const info = document.createElement('div');
  info.className = 'area-info';
  info.textContent = `Area ${elements.areasList.children.length + 1}: ${Math.round(area.width)}x${Math.round(area.height)} pixels`;
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete';
  deleteButton.innerHTML = '&times;';
  deleteButton.onclick = () => {
    item.remove();
    saveConfig();
  };
  
  item.appendChild(info);
  item.appendChild(deleteButton);
  item.dataset.area = JSON.stringify(area);
  
  return item;
}

// Mettre à jour les aperçus de couleur
function updateColorPreviews() {
  elements.yellowPreview.style.backgroundColor = elements.yellowColor.value;
  elements.redPreview.style.backgroundColor = elements.redColor.value;
}

// Charger la configuration
function loadConfig() {
  chrome.storage.sync.get(DEFAULT_CONFIG, (config) => {
    elements.enabled.checked = config.enabled;
    elements.yellowColor.value = config.yellowColor;
    elements.redColor.value = config.redColor;
    elements.soundDelay.value = config.soundDelay;
    
    // Charger les zones
    elements.areasList.innerHTML = '';
    config.watchAreas.forEach(area => {
      elements.areasList.appendChild(createAreaItem(area));
    });
    
    updateColorPreviews();
  });
}

// Démarrer la sélection d'une zone
function startAreaSelection() {
  debugLog('Démarrage de la sélection de zone...');
  
  // Minimiser la popup
  window.close();
  
  // Envoyer un message au content script pour démarrer la sélection
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      debugLog('Envoi du message START_SELECTION à l\'onglet:', tabs[0].id);
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'START_SELECTION'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Erreur:', chrome.runtime.lastError);
        } else {
          debugLog('Message envoyé avec succès');
        }
      });
    } else {
      console.error('Aucun onglet actif trouvé');
    }
  });
}

// Sauvegarder la configuration
function saveConfig() {
  debugLog('Sauvegarde de la configuration...');
  
  // Récupérer toutes les zones
  const areas = Array.from(elements.areasList.children).map(item => 
    JSON.parse(item.dataset.area)
  );

  debugLog('Zones à surveiller:', areas);

  const config = {
    enabled: elements.enabled.checked,
    watchAreas: areas,
    yellowColor: elements.yellowColor.value || DEFAULT_CONFIG.yellowColor,
    redColor: elements.redColor.value || DEFAULT_CONFIG.redColor,
    soundDelay: parseInt(elements.soundDelay.value) || DEFAULT_CONFIG.soundDelay
  };

  debugLog('Nouvelle configuration:', config);

  chrome.storage.sync.set(config, () => {
    // Notifier le content script du changement
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'CONFIG_UPDATED',
          config: config
        });
      }
    });

    // Afficher le message de succès
    elements.status.textContent = 'Configuration saved!';
    elements.status.className = 'status success';
    elements.status.style.display = 'block';
    setTimeout(() => {
      elements.status.style.display = 'none';
    }, 2000);
  });
}

// Unified message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('Message reçu:', message);
  
  switch (message.type) {
    case 'AREA_SELECTED':
      debugLog('Traitement du message AREA_SELECTED:', message.area);
      try {
        // Ajouter la zone à la liste
        const areaItem = createAreaItem(message.area);
        debugLog('Zone créée:', areaItem);
        elements.areasList.appendChild(areaItem);
        debugLog('Zone ajoutée à la liste');
        
        // Sauvegarder immédiatement la configuration
        saveConfig();
        debugLog('Configuration sauvegardée');
        
        // Répondre au content script
        if (sendResponse) {
          sendResponse({ success: true });
        }
      } catch (error) {
        debugLog('Erreur lors du traitement de la zone:', error);
        if (sendResponse) {
          sendResponse({ success: false, error: error.message });
        }
      }
      break;
      
    case 'COLOR_PICKED':
      debugLog('Traitement du message COLOR_PICKED');
      // Mettre à jour l'input de couleur correspondant
      const input = document.getElementById(message.target);
      if (input) {
        input.value = message.color;
        // Mettre à jour la prévisualisation
        const preview = document.getElementById(message.target + 'Preview');
        if (preview) {
          preview.style.backgroundColor = message.color;
        }
        // Sauvegarder automatiquement la configuration
        saveConfig();
        if (sendResponse) {
          sendResponse({ success: true });
        }
      } else {
        debugLog('Input non trouvé pour la couleur:', message.target);
        if (sendResponse) {
          sendResponse({ success: false, error: 'Input not found' });
        }
      }
      break;
  }
  return true;
});

// Event listeners
elements.addAreaButton.addEventListener('click', startAreaSelection);
elements.saveButton.addEventListener('click', saveConfig);
elements.yellowColor.addEventListener('input', updateColorPreviews);
elements.redColor.addEventListener('input', updateColorPreviews);

// Charger la configuration au démarrage
document.addEventListener('DOMContentLoaded', () => {
  debugLog('Popup chargé, chargement de la configuration...');
  loadConfig();
  
  // Notifier le background script que le popup est prêt
  chrome.runtime.sendMessage({ type: 'POPUP_READY' }, (response) => {
    if (chrome.runtime.lastError) {
      debugLog('Erreur lors de la notification de disponibilité:', chrome.runtime.lastError);
    } else {
      debugLog('Background script notifié de la disponibilité du popup');
    }
  });
});

// Gestionnaire pour les boutons pipette
document.querySelectorAll('.color-picker').forEach(button => {
  button.addEventListener('click', async () => {
    try {
      const targetInput = button.dataset.target;
      debugLog('Clic sur la pipette pour:', targetInput);
      
      // Obtenir l'onglet actif
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('Aucun onglet actif trouvé');
      }

      debugLog('Envoi du message START_COLOR_PICKER à l\'onglet:', tab.id);
      
      // Envoyer un message au content script
      await chrome.tabs.sendMessage(tab.id, {
        type: 'START_COLOR_PICKER',
        target: targetInput
      });

      // Fermer temporairement le popup
      window.close();
    } catch (error) {
      debugLog('Erreur lors du démarrage de la pipette:', error);
      // Afficher l'erreur dans le statut
      elements.status.textContent = 'Error: Unable to start color picker';
      elements.status.className = 'status error';
      elements.status.style.display = 'block';
      setTimeout(() => {
        elements.status.style.display = 'none';
      }, 3000);
    }
  });
}); 