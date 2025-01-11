// Configuration par défaut
const DEFAULT_CONFIG = {
  enabled: true,
  selector: '.panel-container',
  yellowColor: 'rgb(250, 176, 5)',
  redColor: 'rgb(245, 54, 54)',
  soundDelay: 2000
};

// Éléments du DOM
const elements = {
  enabled: document.getElementById('enabled'),
  selector: document.getElementById('selector'),
  yellowColor: document.getElementById('yellowColor'),
  redColor: document.getElementById('redColor'),
  soundDelay: document.getElementById('soundDelay'),
  yellowPreview: document.getElementById('yellowPreview'),
  redPreview: document.getElementById('redPreview'),
  saveButton: document.getElementById('save'),
  status: document.getElementById('status')
};

// Mettre à jour les aperçus de couleur
function updateColorPreviews() {
  elements.yellowPreview.style.backgroundColor = elements.yellowColor.value;
  elements.redPreview.style.backgroundColor = elements.redColor.value;
}

// Charger la configuration
function loadConfig() {
  chrome.storage.sync.get(DEFAULT_CONFIG, (config) => {
    elements.enabled.checked = config.enabled;
    elements.selector.value = config.selector;
    elements.yellowColor.value = config.yellowColor;
    elements.redColor.value = config.redColor;
    elements.soundDelay.value = config.soundDelay;
    updateColorPreviews();
  });
}

// Sauvegarder la configuration
function saveConfig() {
  const config = {
    enabled: elements.enabled.checked,
    selector: elements.selector.value || DEFAULT_CONFIG.selector,
    yellowColor: elements.yellowColor.value || DEFAULT_CONFIG.yellowColor,
    redColor: elements.redColor.value || DEFAULT_CONFIG.redColor,
    soundDelay: parseInt(elements.soundDelay.value) || DEFAULT_CONFIG.soundDelay
  };

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
    elements.status.textContent = 'Configuration sauvegardée !';
    elements.status.className = 'status success';
    elements.status.style.display = 'block';
    setTimeout(() => {
      elements.status.style.display = 'none';
    }, 2000);
  });
}

// Event listeners
elements.saveButton.addEventListener('click', saveConfig);
elements.yellowColor.addEventListener('input', updateColorPreviews);
elements.redColor.addEventListener('input', updateColorPreviews);

// Charger la configuration au démarrage
document.addEventListener('DOMContentLoaded', loadConfig);

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
  deleteButton.onclick = () => item.remove();
  
  item.appendChild(info);
  item.appendChild(deleteButton);
  item.dataset.area = JSON.stringify(area);
  
  return item;
} 