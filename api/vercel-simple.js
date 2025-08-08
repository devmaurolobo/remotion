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

// Função para renderizar vídeo com Remotion (versão simplificada)
const renderVideo = async (videoData) => {
  return new Promise((resolve, reject) => {
    // Cria arquivo JSON temporário para as props
    const propsPath = path.join('/tmp', `props-${uuidv4()}.json`);
    const outputPath = path.join('/tmp', `video-${uuidv4()}.mp4`);
    
    try {
      fs.writeFileSync(propsPath, JSON.stringify(videoData, null, 2));
    } catch (error) {
      reject(new Error(`Erro ao criar arquivo de props: ${error.message}`));
      return;
    }
    
    // Usa node_modules diretamente em vez de npx
    const command = `node node_modules/@remotion/cli/dist/cli.js render src/index.ts VideoComposition "${outputPath}" --props="${propsPath}"`;
    
    console.log('Executando comando:', command);
    
    const { exec } = require('child_process');
    exec(command, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 50, // 50MB buffer
      env: {
        ...process.env,
        REMOTION_CACHE_DIR: '/tmp',
        REMOTION_OUTPUT_DIR: '/tmp',
        NPM_CONFIG_CACHE: '/tmp/.npm',
        NPM_CONFIG_PREFIX: '/tmp/.npm'
      }
    }, (error, stdout, stderr) => {
      // Remove arquivo temporário de props
      try {
        fs.unlinkSync(propsPath);
      } catch (e) {
        // Ignora erro se arquivo não existir
      }
      
      if (error) {
        console.error('Erro na renderização:', error);
        console.error('Stderr:', stderr);
        reject(new Error(`Erro na renderização: ${error.message}`));
        return;
      }
      
      console.log('Renderização concluída:', stdout);
      
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
    });
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
    
    console.log('Iniciando renderização do vídeo');
    console.log('Dados recebidos:', videoData);
    
    // Renderiza o vídeo
    const videoBuffer = await renderVideo(videoData);
    
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
    service: 'Video Generator API (Vercel Simple)',
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
