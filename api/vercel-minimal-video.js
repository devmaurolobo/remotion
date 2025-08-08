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

// Função para criar um vídeo simples usando apenas Node.js
const createMinimalVideo = async (videoData) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Criando vídeo minimalista...');
      
      // Cria um arquivo de dados simples (simulando um vídeo)
      const videoInfo = {
        texto: videoData.texto_principal || 'Vídeo gerado!',
        cor_primaria: videoData.cor_primaria || '#FF6B6B',
        cor_secundaria: videoData.cor_secundaria || '#4ECDC4',
        cor_fundo: videoData.cor_fundo || '#1E90FF',
        duracao: videoData.duracao || 6,
        timestamp: new Date().toISOString()
      };
      
      // Cria um arquivo JSON com as informações do vídeo
      const videoDataFile = path.join('/tmp', `video-data-${uuidv4()}.json`);
      fs.writeFileSync(videoDataFile, JSON.stringify(videoInfo, null, 2));
      
      // Simula um arquivo de vídeo (na verdade é um arquivo de dados)
      const outputFile = path.join('/tmp', `video-${uuidv4()}.mp4`);
      
      // Cria um arquivo binário simples que simula um vídeo MP4
      // Na verdade, vamos criar um arquivo de texto que pode ser interpretado como vídeo
      const videoContent = Buffer.from(JSON.stringify({
        type: 'video/mp4',
        data: videoInfo,
        generated_at: new Date().toISOString(),
        duration: videoInfo.duracao,
        resolution: '1280x720'
      }));
      
      fs.writeFileSync(outputFile, videoContent);
      
      console.log('Vídeo minimalista criado com sucesso!');
      
      // Lê o arquivo
      const videoBuffer = fs.readFileSync(outputFile);
      
      // Remove arquivos temporários
      try {
        fs.unlinkSync(videoDataFile);
        fs.unlinkSync(outputFile);
      } catch (e) {
        console.log('Erro ao remover arquivos temporários:', e);
      }
      
      resolve(videoBuffer);
      
    } catch (error) {
      console.error('Erro ao criar vídeo minimalista:', error);
      reject(new Error(`Erro ao criar vídeo minimalista: ${error.message}`));
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

    console.log('Iniciando geração de vídeo minimalista');
    console.log('Dados recebidos:', videoData);

    // Cria o vídeo usando método minimalista
    const videoBuffer = await createMinimalVideo(videoData);

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
    service: 'Video Generator API (Minimal Node.js)',
    environment: process.env.NODE_ENV || 'development',
    message: 'API funcionando! Esta versão cria arquivos de dados que simulam vídeos.'
  });
});

// Rota para obter informações do vídeo gerado
app.get('/api/video-info', (req, res) => {
  res.json({
    success: true,
    message: 'Esta API gera arquivos de dados que simulam vídeos',
    capabilities: [
      'Recebe dados de texto e cores',
      'Cria arquivos com informações do vídeo',
      'Retorna arquivos no formato solicitado',
      'Funciona sem dependências externas'
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
