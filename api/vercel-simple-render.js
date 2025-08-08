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

// Função para criar um vídeo simples usando FFmpeg
const createSimpleVideo = async (videoData) => {
  return new Promise((resolve, reject) => {
    try {
      const ffmpeg = require('fluent-ffmpeg');
      
      console.log('Criando vídeo simples com FFmpeg...');
      
      // Cria um arquivo de texto temporário com o conteúdo
      const textFile = path.join('/tmp', `text-${uuidv4()}.txt`);
      const outputFile = path.join('/tmp', `video-${uuidv4()}.mp4`);
      
      const textContent = videoData.texto_principal || 'Vídeo gerado com sucesso!';
      
      fs.writeFileSync(textFile, textContent);
      
      // Comando FFmpeg para criar um vídeo simples
      const command = ffmpeg()
        .input('color=c=black:size=1280x720:rate=30')
        .inputOptions(['-f lavfi'])
        .duration(6)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-vf', `drawtext=text='${textContent}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`,
          '-pix_fmt', 'yuv420p'
        ])
        .output(outputFile)
        .on('end', () => {
          console.log('Vídeo criado com sucesso!');
          
          // Lê o arquivo de vídeo
          const videoBuffer = fs.readFileSync(outputFile);
          
          // Remove arquivos temporários
          try {
            fs.unlinkSync(textFile);
            fs.unlinkSync(outputFile);
          } catch (e) {
            console.log('Erro ao remover arquivos temporários:', e);
          }
          
          resolve(videoBuffer);
        })
        .on('error', (err) => {
          console.error('Erro no FFmpeg:', err);
          reject(new Error(`Erro no FFmpeg: ${err.message}`));
        });
      
      command.run();
      
    } catch (error) {
      console.error('Erro ao criar vídeo simples:', error);
      reject(new Error(`Erro ao criar vídeo simples: ${error.message}`));
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

    console.log('Iniciando geração de vídeo simples');
    console.log('Dados recebidos:', videoData);

    // Cria o vídeo usando FFmpeg
    const videoBuffer = await createSimpleVideo(videoData);

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
    service: 'Video Generator API (Simple FFmpeg)',
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
