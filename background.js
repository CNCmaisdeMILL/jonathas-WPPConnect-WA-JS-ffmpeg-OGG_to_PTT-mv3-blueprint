let offscreenCreating = null;  

async function setupOffscreenDocument(path) {
    if (offscreenCreating) { await offscreenCreating; return; }
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({ 
        contextTypes: ['OFFSCREEN_DOCUMENT'], 
        documentUrls: [offscreenUrl] 
    });
    if (existingContexts.length > 0) return;

    offscreenCreating = chrome.offscreen.createDocument({ 
        url: path, 
        reasons: ['WORKERS'], 
        justification: 'Conversão WASM' 
    });
    await offscreenCreating;
    offscreenCreating = null; 
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CONVERT_AUDIO_TEMP') {
        setupOffscreenDocument('offscreen.html').then(() => {
            chrome.runtime.sendMessage(request, response => {
                sendResponse(response);
            });
        });
        return true; // Mantém o canal de mensagem aberto
    }
    if (request.action === 'RADIO_OFFSCREEN') {
        console.log(`📻 [OFFSCREEN]: ${request.texto}`);
    }
});