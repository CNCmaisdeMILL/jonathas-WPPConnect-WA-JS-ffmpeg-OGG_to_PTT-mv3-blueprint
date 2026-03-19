🚀 WhatsApp PTT Stealth Blueprint (MV3 + FFmpeg WASM)
Este repositório contém o blueprint de uma extensão para Chrome (Manifest V3) capaz de converter e injetar áudios no WhatsApp Web como Notas de Voz Nativas (PTT). Diferente de envios de arquivos comuns, este motor mimetiza a "impressão digital" do gravador do Chrome, garantindo ondas sonoras e compatibilidade total com o player da Meta.

🎯 O Diferencial Técnico (A "Vitória")
A maioria das automações falha porque o WhatsApp valida a estrutura interna do codec Opus. Este projeto supera essas barreiras através de:

Spoofing de Metadados: Injeção das tags Vendor: Recorder e Encoder: Recorder.

Sincronização de Frequência: Conversão em exatos 48.000 Hz (Sample Rate oficial).

Estrutura de Frames: Forçamento de frame_duration=20ms e otimização voip.

Arquitetura de Processamento: Uso de FFmpeg WebAssembly em um Offscreen Document para contornar limitações de performance do Service Worker (MV3).

🏗️ Arquitetura do Sistema
O fluxo de dados foi desenhado para ser resiliente e escalável:

background.js (Maestro): Monitora uma fila de mensagens no Supabase, gerencia webhooks de entrada e coordena a criação do documento Offscreen.

offscreen.js (A Fábrica): Instancia o núcleo C++ do FFmpeg via WASM. Realiza a conversão pesada e o "disfarce" dos metadados.

db-utility.js (Persistência): Utiliza IndexedDB para transitar Blobs de áudio entre contextos sem estourar a memória RAM.

injected.js (O Carteiro): Injetado diretamente no DOM do WhatsApp Web, utiliza a biblioteca WPPConnect/WA-JS para realizar o disparo final com a flag isPtt: true.

📂 Estrutura do Projeto
manifest.json: Configurações de permissões MV3 e recursos acessíveis via web.

background.js: Service worker responsável pela fila e lógica de negócio.

offscreen.js: Motor de conversão FFmpeg WASM.

injected.js: Script de injeção V53 (O Carteiro Perfeito).

content.js: Ponte de comunicação entre a extensão e a página do WhatsApp.

wppconnect.js: Base do WA-JS para manipulação do chat.

db-utility.js: Funções auxiliares para o banco de dados local (IndexedDB).

🚀 Como Iniciar
Configuração do Banco:

Configure sua URL e Key do Supabase no background.js.

Certifique-se de que a tabela whatsapp_queue possui os campos status, phone, file_url e token.

Instalação da Extensão:

Acesse chrome://extensions/.

Ative o "Modo do desenvolvedor".

Clique em "Carregar sem compactação" e selecione a pasta do projeto.

Dependências de Mídia:

Mantenha os arquivos ffmpeg-core.js e ffmpeg-core.wasm dentro da pasta ffmpeg/ para garantir o funcionamento do processamento offline.

🛠️ Comando FFmpeg Utilizado (Versão Stealth)
Bash
ffmpeg -i input -c:a libopus -b:a 24k -frame_duration 20 -application voip -ar 48000 -ac 1 -map_metadata -1 -metadata vendor=Recorder -metadata encoder=Recorder output.ogg
⚖️ Licença
Distribuído sob a licença MIT. Veja LICENSE para mais informações.

Desenvolvido para automações de alto nível. 🚀
