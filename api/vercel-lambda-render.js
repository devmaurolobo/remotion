const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true, limit: '50mb'}));

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

// Função para renderizar vídeo usando Remotion Lambda
const renderVideoWithLambda = async (videoData) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Iniciando renderização com Remotion Lambda...');
      
      // Configura variáveis de ambiente para o Remotion usar /tmp
      process.env.REMOTION_CACHE_DIR = '/tmp';
      process.env.REMOTION_OUTPUT_DIR = '/tmp';
      process.env.REMOTION_TEMP_DIR = '/tmp';
      process.env.REMOTION_BROWSER_CACHE_DIR = '/tmp';
      
      // Desabilita o download automático do Chrome
      process.env.REMOTION_DISABLE_BROWSER_DOWNLOAD = 'true';
      
      // Sobrescreve a função de download do browser para evitar erros
      const originalMkdir = require('fs').promises.mkdir;
      const originalMkdirSync = require('fs').mkdirSync;
      
      require('fs').promises.mkdir = async (path, options) => {
        if (path.includes('.remotion')) {
          console.log('Interceptado tentativa de criar diretório .remotion:', path);
          return Promise.resolve();
        }
        return originalMkdir(path, options);
      };
      
      require('fs').mkdirSync = (path, options) => {
        if (path.includes('.remotion')) {
          console.log('Interceptado tentativa de criar diretório .remotion (sync):', path);
          return;
        }
        return originalMkdirSync(path, options);
      };
      
      // Importa o Remotion Lambda
      const { renderMedia, selectComposition, getCompositions } = require('@remotion/renderer');
      const { bundle } = require('@remotion/bundler');
      
      console.log('Diretório atual:', process.cwd());
      console.log('Arquivos disponíveis:', fs.readdirSync(process.cwd()));
      
      // Tenta diferentes caminhos para o entryPoint
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'index.ts'),
        path.join(process.cwd(), 'src', 'index.js'),
        path.join(__dirname, '..', 'src', 'index.ts'),
        path.join(__dirname, '..', 'src', 'index.js'),
        './src/index.ts',
        '../src/index.ts'
      ];

      let entryPoint = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          entryPoint = possiblePath;
          console.log('EntryPoint encontrado:', entryPoint);
          break;
        }
      }

      if (!entryPoint) {
        reject(new Error(`EntryPoint não encontrado. Tentados: ${possiblePaths.join(', ')}`));
        return;
      }
      
      // Bundle do projeto
      const bundled = await bundle({
        entryPoint: entryPoint,
        webpackOverride: (config) => {
          // Configurações específicas para serverless
          config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            os: false
          };
          return config;
        },
      });
      
      console.log('Bundle criado, buscando composições...');
      
      // Busca as composições com configurações específicas para Vercel
      const compositions = await getCompositions(bundled, {
        onBrowserDownload: () => {
          console.log('Tentando baixar browser...');
          return Promise.resolve();
        },
        browserExecutable: null, // Usa o Chrome disponível no sistema
      });
      
      console.log('Composições encontradas:', compositions.map(c => c.id));
      
      // Seleciona a composição VideoComposition
      const composition = selectComposition({
        list: compositions,
        id: 'VideoComposition',
      });
      
      if (!composition) {
        reject(new Error('Composição VideoComposition não encontrada'));
        return;
      }
      
      console.log('Composição selecionada:', composition.id);
      
      // Cria arquivo de saída temporário
      const outputPath = path.join('/tmp', `video-${uuidv4()}.mp4`);
      
      // Renderiza o vídeo
      console.log('Iniciando renderização do vídeo...');
      await renderMedia({
        composition,
        serveUrl: bundled,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: videoData,
        onProgress: (progress) => {
          console.log(`Progresso: ${Math.round(progress * 100)}%`);
        },
        browserExecutable: null, // Usa o Chrome disponível no sistema
      });
      
      console.log('Renderização concluída, lendo arquivo...');
      
      // Verifica se o arquivo foi criado
      if (!fs.existsSync(outputPath)) {
        reject(new Error('Arquivo de vídeo não foi gerado'));
        return;
      }
      
      // Lê o arquivo
      const videoBuffer = fs.readFileSync(outputPath);
      
      // Remove o arquivo temporário
      try {
        fs.unlinkSync(outputPath);
      } catch (e) {
        console.log('Erro ao remover arquivo temporário:', e);
      }
      
      resolve(videoBuffer);
      
    } catch (error) {
      console.error('Erro na renderização com Lambda:', error);
      reject(new Error(`Erro na renderização com Lambda: ${error.message}`));
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

    console.log('Iniciando renderização do vídeo com Remotion Lambda');
    console.log('Dados recebidos:', videoData);

    // Renderiza o vídeo usando Remotion Lambda
    const videoBuffer = await renderVideoWithLambda(videoData);

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
    service: 'Video Generator API (Remotion Lambda)',
    environment: process.env.NODE_ENV || 'development'
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
