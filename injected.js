window.WPPConfig = { disableGoogleAnalytics: true };

function base64ParaArquivo(base64Data, filename) {
    let pureBase64 = base64Data;
    if (pureBase64.includes(',')) pureBase64 = pureBase64.split(',')[1];
    const byteCharacters = atob(pureBase64.replace(/\s/g, ''));
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
    }
    const blob = new Blob(byteArrays, { type: 'audio/ogg; codecs=opus' });
    return new File([blob], filename, { type: 'audio/ogg; codecs=opus' });
}

window.addEventListener("message", async (event) => {
    if (!event.data || event.data.type !== "GESTOR_DISPARAR_ZAP") return;
    
    const msg = event.data.payload;
    try {
        // Pega o ID da conversa que VOCÊ está visualizando no momento
        let targetJid;
        if (msg.isTest) {
            const activeChat = window.WPP.chat.getActiveChat();
            if (!activeChat) {
                alert("Abra uma conversa primeiro para testar o envio de áudio!");
                return;
            }
            targetJid = activeChat.id._serialized;
        } else {
            targetJid = `${msg.phone}@c.us`;
        }

        const audioFile = base64ParaArquivo(msg.base64_file, msg.file_name);

        console.log("🚀 Disparando PTT Stealth...");
        await window.WPP.chat.sendFileMessage(targetJid, audioFile, {
            type: 'audio',
            isPtt: true
        });
        
    } catch (error) {
        console.error("❌ Erro no disparo:", error);
    }
});