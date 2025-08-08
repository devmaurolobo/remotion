const express = require('express');
const cors = require('cors');
const multer = require('multer');
const {exec} = require('child_process');
const path = require('path');
const fs = require('fs');
const {v4: uuidv4} = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true, limit: '50mb'}));

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {recursive: true});
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({storage});

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

// Função para renderizar vídeo com Remotion
const renderVideo = (videoData, outputPath) => {
  return new Promise((resolve, reject) => {
    // Cria arquivo JSON temporário para as props
    const propsPath = path.join(__dirname, '../temp-props.json');
    fs.writeFileSync(propsPath, JSON.stringify(videoData, null, 2));
    
    const command = `npx remotion render src/index.ts VideoComposition "${outputPath}" --props="${propsPath}"`;
    
    console.log('Executando comando:', command);
    
    exec(command, {
      cwd: path.join(__dirname, '..'),
      maxBuffer: 1024 * 1024 * 50 // 50MB buffer
    }, (error, stdout, stderr) => {
      // Remove arquivo temporário
      try {
        fs.unlinkSync(propsPath);
      } catch (e) {
        // Ignora erro se arquivo não existir
      }
      
      if (error) {
        console.error('Erro na renderização:', error);
        console.error('Stderr:', stderr);
        reject(error);
        return;
      }
      
      console.log('Renderização concluída:', stdout);
      resolve(outputPath);
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
    
    // Gera ID único para o vídeo
    const videoId = uuidv4();
    const outputDir = path.join(__dirname, '../outputs');
    const outputPath = path.join(outputDir, `${videoId}.mp4`);
    
    // Cria diretório de saída se não existir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, {recursive: true});
    }
    
    console.log('Iniciando renderização do vídeo:', videoId);
    console.log('Dados recebidos:', videoData);
    
    // Renderiza o vídeo
    await renderVideo(videoData, outputPath);
    
    // Verifica se o arquivo foi criado
    if (!fs.existsSync(outputPath)) {
      throw new Error('Arquivo de vídeo não foi gerado');
    }
    
    // Aqui você pode implementar upload para S3 ou outro serviço
    const videoUrl = `/videos/${videoId}.mp4`;
    
    res.json({
      success: true,
      videoId,
      videoUrl,
      message: 'Vídeo gerado com sucesso'
    });
    
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
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
    
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({
      success: false,
      error: 'Erro no upload do arquivo'
    });
  }
});

// Rota para servir arquivos estáticos
app.use('/videos', express.static(path.join(__dirname, '../outputs')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Video Generator API'
  });
});

// Rota para obter status de um vídeo
app.get('/api/video/:videoId/status', (req, res) => {
  const {videoId} = req.params;
  const videoPath = path.join(__dirname, '../outputs', `${videoId}.mp4`);
  
  if (fs.existsSync(videoPath)) {
    const stats = fs.statSync(videoPath);
    res.json({
      success: true,
      videoId,
      exists: true,
      size: stats.size,
      createdAt: stats.birthtime
    });
  } else {
    res.json({
      success: true,
      videoId,
      exists: false
    });
  }
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📹 API de geração de vídeos disponível em http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
}); 