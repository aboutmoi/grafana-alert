// Message relay handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Message received:', message);

  if (message.type === 'AREA_SELECTED') {
    console.log('[Background] Area selected:', message.area);
    
    // Store the area temporarily
    chrome.storage.local.set({ 'lastSelectedArea': message.area }, () => {
      console.log('[Background] Area stored temporarily');
      
      // Try to open the popup
      chrome.action.openPopup()
        .catch(error => console.log('[Background] Cannot open popup programmatically:', error));
      
      if (sendResponse) {
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  if (message.type === 'POPUP_READY') {
    console.log('[Background] Popup is ready');
    // Retrieve and send the stored area
    chrome.storage.local.get(['lastSelectedArea'], (result) => {
      if (result.lastSelectedArea) {
        console.log('[Background] Sending stored area to popup:', result.lastSelectedArea);
        chrome.runtime.sendMessage({
          type: 'AREA_SELECTED',
          area: result.lastSelectedArea
        });
        // Clear the stored area
        chrome.storage.local.remove('lastSelectedArea');
      }
    });
    if (sendResponse) {
      sendResponse({ success: true });
    }
    return true;
  }
});

// Screenshot handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REQUEST_SCREENSHOT') {
    const area = message.area;
    console.log('Background: Screenshot request received for area:', area);
    
    // Capture the entire page then crop the area
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
      try {
        console.log('Background: Page capture completed');
        
        // If it's a single pixel capture (color picker)
        if (area.width === 1 && area.height === 1) {
          sendResponse({ dataUrl: dataUrl });
          return;
        }
        
        // For normal captures
        // Convertir l'URL de données en Blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Créer un bitmap à partir du blob
        const imageBitmap = await createImageBitmap(blob);
        
        // Créer un canvas pour découper l'image
        const canvas = new OffscreenCanvas(area.width, area.height);
        const ctx = canvas.getContext('2d');
        
        // Dessiner uniquement la zone sélectionnée
        ctx.drawImage(
          imageBitmap,
          area.x,
          area.y,
          area.width,
          area.height,
          0,
          0,
          area.width,
          area.height
        );

        console.log('Background: Zone découpée, conversion en blob...');
        
        // Convertir le canvas en blob
        const croppedBlob = await canvas.convertToBlob();
        
        // Convertir le blob en URL de données
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('Background: Envoi de l\'image découpée');
          chrome.tabs.sendMessage(sender.tab.id, {
            type: 'SCREENSHOT_READY',
            dataUrl: reader.result,
            area: area
          });
        };
        reader.readAsDataURL(croppedBlob);
        
        // Libérer les ressources
        imageBitmap.close();
      } catch (error) {
        console.error('Background: Capture error:', error);
        if (area.width === 1 && area.height === 1) {
          sendResponse({ error: error.message });
        } else {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: 'SCREENSHOT_ERROR',
            error: error.message,
            area: area
          });
        }
      }
    });
    return true;
  }
}); 