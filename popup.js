const dropZone = document.getElementById('drop-zone');
const statusMsg = document.getElementById('status');
const fileInput = document.getElementById('file-input');

// --- EVENTOS DE ARRASTAR E SOLTAR ---
dropZone.addEventListener('dragover', (e) => { 
    e.preventDefault(); 
    dropZone.classList.add('hover'); 
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('hover'); 
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('hover');
    handleFile(e.dataTransfer.files[0]);
});

// --- EVENTOS DE CLIQUE (BUSCAR NO PC) ---
dropZone.addEventListener('click', () => {
    fileInput.click(); // Simula o clique no input invisível
});

fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
    fileInput.value = ''; // Limpa o input para permitir selecionar o mesmo arquivo novamente
});

// --- VALIDAÇÃO CENTRAL ---
function handleFile(file) {
    if (file && file.type.startsWith('audio/')) {
        processarAudioTeste(file);
    } else {
        statusMsg.innerText = "❌ Por favor, use um arquivo de áudio válido.";
    }
}

// --- O FLUXO DE CONVERSÃO (Mantido igual) ---
async function processarAudioTeste(file) {
    statusMsg.innerText = "⚡ Convertendo áudio (FFmpeg)...";
    const tempId = "teste_" + Date.now();

    try {
        await guardarNoTemp(tempId, file);

        chrome.runtime.sendMessage({ action: 'CONVERT_AUDIO_TEMP', id: tempId }, async (response) => {
            if (response && response.success) {
                statusMsg.innerText = "🚀 Enviando para a conversa ativa...";
                
                const blobConv = await lerDoTemp(tempId);
                const reader = new FileReader();
                reader.readAsDataURL(blobConv);
                
                reader.onloadend = async () => {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    
                    if (tab && tab.url.includes("web.whatsapp.com")) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: "FORWARD_TO_INJECTED",
                            payload: {
                                id: tempId,
                                base64_file: reader.result,
                                file_name: "audio_stealth.ogg",
                                isTest: true
                            }
                        });
                        statusMsg.innerText = "✅ Nota de voz enviada!";
                    } else {
                        statusMsg.innerText = "❌ O WhatsApp Web não é a aba ativa!";
                    }
                };
            } else {
                statusMsg.innerText = "❌ Erro na conversão.";
            }
        });
    } catch (err) {
        statusMsg.innerText = "❌ Erro interno.";
        console.error(err);
    }
}