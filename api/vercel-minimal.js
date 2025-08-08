const express = require('express');
const cors = require('cors');
const multer = require('multer');

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

// Rota principal para gerar vídeo (versão de teste)
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
    
    console.log('Dados recebidos:', videoData);
    
    // Por enquanto, retorna uma resposta de sucesso sem vídeo
    // para testar se a API está funcionando
    res.json({
      success: true,
      message: 'API funcionando! Dados recebidos:',
      data: videoData,
      note: 'Renderização de vídeo temporariamente desabilitada para debug'
    });
    
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
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
    service: 'Video Generator API (Vercel Minimal)',
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
