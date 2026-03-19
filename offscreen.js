function relatar(msg) {
    chrome.runtime.sendMessage({ action: 'RADIO_OFFSCREEN', texto: msg }).catch(() => {});
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CONVERT_AUDIO_TEMP') {
        executarFluxo(request.id).then(sendResponse);
        return true; 
    }
});

let coreInstance = null;

async function carregarCoreJS() {
    if (typeof createFFmpegCore !== 'undefined') return;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('ffmpeg/ffmpeg-core.js');
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Falha ao carregar ffmpeg-core.js"));
        document.head.appendChild(script);
    });
}

async function executarFluxo(id) {
    let inputName = `input_${id}.audio`;
    let outputName = `output_${id}.ogg`;
    
    try {
        await carregarCoreJS();
        
        if (!coreInstance) {
            coreInstance = await createFFmpegCore({
                locateFile: (path) => path.endsWith('.wasm') ? chrome.runtime.getURL('ffmpeg/ffmpeg-core.wasm') : path,
                print: (msg) => relatar(msg),
                printErr: (msg) => relatar(msg)
            });
        }

        const core = coreInstance;
        const blobOriginal = await lerDoTemp(id); 
        const arrayBuffer = await blobOriginal.arrayBuffer();
        core.FS.writeFile(inputName, new Uint8Array(arrayBuffer));

        try {
            // O COMANDO STEALTH DEFINITIVO (Clone 1:1)
            executeFFmpeg(core, [
                '-nostdin', '-y', '-i', inputName, 
                '-c:a', 'libopus', '-b:a', '16k', '-vbr', 'on', '-compression_level', '10',
                '-frame_duration', '20', '-application', 'voip', '-ar', '48000', '-ac', '1',
                '-af', 'adelay=80|80', // Atrasa 80ms para imitar o initial_padding do Chrome
                '-fflags', '+bitexact', '-flags:a', '+bitexact', // Limpa rastros
                '-map_metadata', '-1', // Remove tags originais
                '-metadata:s:a:0', 'encoder=Recorder', '-metadata:s:a:0', 'vendor=Recorder',
                '-metadata', 'encoder=Recorder', '-metadata', 'vendor=Recorder',
                '-f', 'ogg', outputName
            ]);
        } catch (e) {
            if (!e.message?.includes("exit(0)")) throw e;
        }

        const outputData = core.FS.readFile(outputName); 
        const finalBlob = new Blob([outputData.buffer], { type: 'audio/ogg; codecs=opus' });
        
        await guardarNoTemp(id, finalBlob);
        return { success: true };

    } catch (error) {
        relatar(`❌ ERRO: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        if (coreInstance) {
            try { coreInstance.FS.unlink(inputName); coreInstance.FS.unlink(outputName); } catch (e) {}
        }
    }
}

function executeFFmpeg(core, args) {
    const commandArgs = ['ffmpeg', ...args];
    let pointers = [];
    let argvPointer = null;
    try {
        pointers = commandArgs.map((arg) => {
            const length = core.lengthBytesUTF8(arg) + 1;
            const ptr = core._malloc(length);
            core.stringToUTF8(arg, ptr, length);
            return ptr;
        });
        argvPointer = core._malloc(pointers.length * 4);
        pointers.forEach((ptr, i) => core.setValue(argvPointer + (i * 4), ptr, 'i32'));
        return core.ccall('main', 'number', ['number', 'number'], [pointers.length, argvPointer]);
    } finally {
        if (pointers.length > 0) pointers.forEach(ptr => core._free(ptr));
        if (argvPointer) core._free(argvPointer);
    }
}