function injectScript(file) {
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.src = chrome.runtime.getURL(file);
    (document.head || document.documentElement).appendChild(script);
}

const checkExist = setInterval(() => {
    if (document.querySelector('#app')) { 
        clearInterval(checkExist);
        setTimeout(() => {
            injectScript('wppconnect.js');
            setTimeout(() => { injectScript('injected.js'); }, 2000); 
        }, 3000);
    }
}, 1000);

// Escuta a mensagem do Popup e joga pro Injected (que está no DOM da página)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FORWARD_TO_INJECTED") {
        window.postMessage({ type: "GESTOR_DISPARAR_ZAP", payload: request.payload }, "*");
    }
});