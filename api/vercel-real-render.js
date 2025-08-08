const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');

// Intercepta fs para evitar criação de diretórios em locais não graváveis
const originalMkdir = fs.promises.mkdir;
const originalMkdirSync = fs.mkdirSync;

fs.promises.mkdir = function(...args) {
  const dirPath = args[0];
  if (dirPath && dirPath.includes('.remotion')) {
    console.log(`[INTERCEPTADO] Tentativa de criar diretório .remotion: ${dirPath}`);
    return Promise.resolve();
  }
  return originalMkdir.apply(this, args);
};

fs.mkdirSync = function(...args) {
  const dirPath = args[0];
  if (dirPath && dirPath.includes('.remotion')) {
    console.log(`[INTERCEPTADO] Tentativa de criar diretório .remotion: ${dirPath}`);
    return;
  }
  return originalMkdirSync.apply(this, args);
};

const app = express();

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true, limit: '50mb'}));

// Configuração de ambiente para Vercel
process.env.REMOTION_CACHE_DIR = '/tmp';
process.env.REMOTION_OUTPUT_DIR = '/tmp';
process.env.REMOTION_TEMP_DIR = '/tmp';
process.env.REMOTION_BROWSER_CACHE_DIR = '/tmp';
process.env.REMOTION_DISABLE_BROWSER_DOWNLOAD = 'true';

// Interface para validação de dados
const validateVideoData = (data) => {
  const required = ['texto_principal'];
  const missing = required.filter(field => !data[field]);

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Campos obrigatórios ausentes: ${missing.join(', ')}`
    };
  }

  return {valid: true};
};

// Função para renderizar vídeo real usando Remotion
const renderRealVideo = async (videoData) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Iniciando renderização real do template teste.json...');
      
      // Importa Remotion dinamicamente
      const {bundle} = await import('@remotion/bundler');
      const {getCompositions, renderMedia} = await import('@remotion/renderer');
      
      // Encontra o entry point
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'index.ts'),
        path.join(process.cwd(), 'src', 'index.js'),
        path.join('/var/task', 'src', 'index.ts'),
        path.join('/var/task', 'src', 'index.js')
      ];
      
      let entryPoint = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          entryPoint = p;
          break;
        }
      }
      
      if (!entryPoint) {
        throw new Error('Entry point não encontrado');
      }
      
      console.log('Entry point encontrado:', entryPoint);
      
      // Cria o bundle com configuração otimizada
      const bundleResult = await bundle({
        entryPoint,
        webpackOverride: (config) => {
          // Configurações otimizadas para Vercel
          config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false
          };
          return config;
        }
      });
      
      console.log('Bundle criado, buscando composições...');
      
      // Obtém as composições com timeout
      const compositions = await Promise.race([
        getCompositions(bundleResult, {
          browserExecutable: null,
          chromiumOptions: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
          },
          onBrowserDownload: () => Promise.resolve()
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao buscar composições')), 8000)
        )
      ]);
      
      const composition = compositions.find(comp => comp.id === 'VideoComposition');
      if (!composition) {
        throw new Error('Composição VideoComposition não encontrada');
      }
      
      console.log('Composição encontrada, iniciando renderização...');
      
      // Arquivo de saída
      const outputFile = path.join('/tmp', `video-${uuidv4()}.mp4`);
      
      // Renderiza o vídeo com timeout
      await Promise.race([
        renderMedia({
          composition,
          serveUrl: bundleResult,
          codec: 'h264',
          outputLocation: outputFile,
          inputProps: {
            texto_principal: videoData.texto_principal || 'Vídeo gerado!',
            cor_primaria: videoData.cor_primaria || '#FF6B6B',
            cor_secundaria: videoData.cor_secundaria || '#4ECDC4',
            cor_fundo: videoData.cor_fundo || '#1E90FF',
            duracao: videoData.duracao || 6
          },
          browserExecutable: null,
          chromiumOptions: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
          },
          onBrowserDownload: () => Promise.resolve()
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na renderização')), 9000)
        )
      ]);
      
      console.log('Vídeo renderizado com sucesso!');
      
      // Verifica se o arquivo foi criado
      if (!fs.existsSync(outputFile)) {
        throw new Error('Arquivo de vídeo não foi criado');
      }
      
      // Lê o arquivo de vídeo
      const videoBuffer = fs.readFileSync(outputFile);
      
      // Verifica se o arquivo tem conteúdo
      if (videoBuffer.length === 0) {
        throw new Error('Arquivo de vídeo está vazio');
      }
      
      console.log('Tamanho do vídeo:', videoBuffer.length, 'bytes');
      
      // Remove arquivo temporário
      try {
        fs.unlinkSync(outputFile);
      } catch (e) {
        console.log('Erro ao remover arquivo temporário:', e);
      }
      
      resolve(videoBuffer);
      
    } catch (error) {
      console.error('Erro na renderização real:', error);
      reject(new Error(`Erro na renderização real: ${error.message}`));
    }
  });
};

// Rota principal para gerar vídeo
app.post('/api/generate-video', async (req, res) => {
  try {
    const videoData = req.body;

    // Valida os dados recebidos
    const validation = validateVideoData(videoData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    console.log('Iniciando renderização real do template teste.json');
    console.log('Dados recebidos:', videoData);

    // Renderiza o vídeo real usando Remotion
    const videoBuffer = await renderRealVideo(videoData);

    // Retorna o vídeo como resposta
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="video-${Date.now()}.mp4"`);
    res.setHeader('Content-Length', videoBuffer.length);
    res.send(videoBuffer);

  } catch (error) {
    console.error('Erro ao gerar vídeo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Rota para upload de arquivos
app.post('/api/upload', multer().single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    res.json({
      success: true,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no upload do arquivo'
    });
  }
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Video Generator API (Real Render)',
    environment: process.env.NODE_ENV || 'development',
    message: 'API funcionando! Renderizando template teste.json real com Remotion.',
    template: 'teste.json',
    capabilities: [
      'Renderização real do template Lottie',
      'Aplicação de cores personalizadas',
      'Texto dinâmico',
      'Vídeo MP4 real e reproduzível',
      'Otimizado para Vercel com timeout'
    ]
  });
});

// Rota para obter informações do vídeo gerado
app.get('/api/video-info', (req, res) => {
  res.json({
    success: true,
    message: 'Esta API renderiza vídeos reais usando o template teste.json',
    template: 'teste.json',
    capabilities: [
      'Renderização real do template Lottie',
      'Aplicação de cores personalizadas',
      'Texto dinâmico',
      'Vídeo MP4 real e reproduzível',
      'Timeout otimizado para Vercel'
    ],
    example: {
      texto_principal: 'Meu vídeo personalizado!',
      cor_primaria: '#FF6B6B',
      cor_secundaria: '#4ECDC4',
      cor_fundo: '#1E90FF',
      duracao: 6
    }
  });
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📹 API de geração de vídeos disponível em http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Para Vercel
module.exports = app;
