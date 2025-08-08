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

// Função para simular renderização do template teste.json
const simulateLottieRender = async (videoData) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Simulando renderização do template teste.json...');
      
      // Lê o template teste.json
      const possiblePaths = [
        path.join('/var/task', 'src', 'teste.json'),
        path.join('/var/task', 'teste.json'),
        path.join(process.cwd(), 'src', 'teste.json'),
        path.join(process.cwd(), 'teste.json')
      ];
      
      let templateData = null;
      let templatePath = null;
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          templatePath = p;
          break;
        }
      }
      
      if (templatePath) {
        try {
          templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
          console.log('Template teste.json carregado com sucesso:', templatePath);
        } catch (e) {
          console.log('Erro ao parsear template:', e.message);
          templateData = null;
        }
      }
      
      if (!templateData) {
        console.log('Usando dados padrão para template');
        templateData = {
          v: "5.7.4",
          fr: 24,
          ip: 0,
          op: 192,
          w: 1080,
          h: 1920,
          nm: "teste.json",
          ddd: 0,
          assets: [],
          layers: []
        };
      }
      
      // Cria informações do vídeo
      const videoInfo = {
        texto: videoData.texto_principal || 'Vídeo gerado!',
        cor_primaria: videoData.cor_primaria || '#FF6B6B',
        cor_secundaria: videoData.cor_secundaria || '#4ECDC4',
        cor_fundo: videoData.cor_fundo || '#1E90FF',
        duracao: videoData.duracao || 6,
        template: 'teste.json',
        timestamp: new Date().toISOString(),
        resolution: '1080x1920',
        fps: 24,
        frames: videoData.duracao * 24
      };
      
      // Aplica as cores ao template (simulação)
      const modifiedTemplate = {
        ...templateData,
        customData: videoInfo,
        appliedColors: {
          primary: videoInfo.cor_primaria,
          secondary: videoInfo.cor_secundaria,
          background: videoInfo.cor_fundo
        }
      };
      
      // Cria um arquivo de vídeo simulado
      const outputFile = path.join('/tmp', `video-${uuidv4()}.mp4`);
      
      // Cria um arquivo binário que simula um vídeo MP4
      const videoHeader = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // MP4 header
        0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00, // isom
        0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32, // iso2
        0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31   // avc1mp41
      ]);
      
      // Adiciona dados do template como metadados
      const templateBuffer = Buffer.from(JSON.stringify(modifiedTemplate));
      const videoBuffer = Buffer.concat([videoHeader, templateBuffer]);
      
      // Escreve o arquivo
      fs.writeFileSync(outputFile, videoBuffer);
      
      console.log('Vídeo simulado criado com sucesso!');
      console.log('Dados aplicados:', videoInfo);
      
      // Lê o arquivo
      const finalBuffer = fs.readFileSync(outputFile);
      
      // Remove arquivo temporário
      try {
        fs.unlinkSync(outputFile);
      } catch (e) {
        console.log('Erro ao remover arquivo temporário:', e);
      }
      
      resolve(finalBuffer);
      
    } catch (error) {
      console.error('Erro ao simular renderização:', error);
      reject(new Error(`Erro ao simular renderização: ${error.message}`));
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

    console.log('Iniciando simulação de renderização do template teste.json');
    console.log('Dados recebidos:', videoData);

    // Simula a renderização do template teste.json
    const videoBuffer = await simulateLottieRender(videoData);

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
    service: 'Video Generator API (Simple Lottie)',
    environment: process.env.NODE_ENV || 'development',
    message: 'API funcionando! Simulando renderização do template teste.json.',
    template: 'teste.json',
    capabilities: [
      'Carrega template teste.json real',
      'Aplica cores personalizadas',
      'Simula renderização Lottie',
      'Retorna arquivo MP4',
      'Otimizado para Vercel (sem Chrome download)'
    ]
  });
});

// Rota para obter informações do vídeo gerado
app.get('/api/video-info', (req, res) => {
  res.json({
    success: true,
    message: 'Esta API simula a renderização do template teste.json',
    template: 'teste.json',
    capabilities: [
      'Carrega template Lottie real',
      'Aplica cores personalizadas',
      'Simula renderização',
      'Retorna arquivo MP4',
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
