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

// Função para salvar job em arquivo
const saveJob = (jobId, jobData) => {
  try {
    const jobFile = path.join('/tmp', `job-${jobId}.json`);
    fs.writeFileSync(jobFile, JSON.stringify(jobData, null, 2));
    console.log(`Job ${jobId} salvo em: ${jobFile}`);
  } catch (error) {
    console.error(`Erro ao salvar job ${jobId}:`, error);
  }
};

// Função para carregar job do arquivo
const loadJob = (jobId) => {
  try {
    const jobFile = path.join('/tmp', `job-${jobId}.json`);
    if (fs.existsSync(jobFile)) {
      const jobData = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
      console.log(`Job ${jobId} carregado de: ${jobFile}`);
      return jobData;
    }
  } catch (error) {
    console.error(`Erro ao carregar job ${jobId}:`, error);
  }
  return null;
};

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

// Função para renderizar vídeo real com Remotion
const renderRealVideo = async (videoData) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Iniciando renderização real com Remotion...');
      
      // Importa Remotion dinamicamente
      const {bundle} = await import('@remotion/bundler');
      const {getCompositions, renderMedia} = await import('@remotion/renderer');
      
      // Encontra o entry point
      const possibleEntryPoints = [
        path.join('/var/task', 'src', 'index.ts'),
        path.join('/var/task', 'src', 'index.js'),
        path.join(process.cwd(), 'src', 'index.ts'),
        path.join(process.cwd(), 'src', 'index.js')
      ];
      
      let entryPoint = null;
      for (const ep of possibleEntryPoints) {
        if (fs.existsSync(ep)) {
          entryPoint = ep;
          break;
        }
      }
      
      if (!entryPoint) {
        throw new Error('Entry point não encontrado');
      }
      
      console.log('Entry point encontrado:', entryPoint);
      
      // Bundle do projeto
      console.log('Criando bundle...');
      const bundleResult = await bundle({
        entryPoint,
        webpackOverride: (config) => {
          config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            os: false
          };
          return config;
        }
      });
      
      console.log('Bundle criado com sucesso');
      
      // Busca composições
      console.log('Buscando composições...');
      const compositions = await getCompositions(bundleResult, {
        browserExecutable: null,
        chromiumOptions: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        onBrowserDownload: () => Promise.resolve()
      });
      
      console.log('Composições encontradas:', compositions.map(c => c.id));
      
      // Encontra a composição VideoComposition
      const composition = compositions.find(c => c.id === 'VideoComposition');
      if (!composition) {
        throw new Error('Composição VideoComposition não encontrada');
      }
      
      console.log('Composição encontrada:', composition.id);
      
      // Prepara props para o vídeo
      const props = {
        texto_principal: videoData.texto_principal,
        cor_primaria: videoData.cor_primaria || '#FF6B6B',
        cor_secundaria: videoData.cor_secundaria || '#4ECDC4',
        cor_fundo: videoData.cor_fundo || '#1E90FF',
        duracao: videoData.duracao || 6
      };
      
      // Arquivo de saída
      const outputFile = path.join('/tmp', `video-${uuidv4()}.mp4`);
      
      console.log('Iniciando renderização...');
      console.log('Props:', props);
      console.log('Output:', outputFile);
      
      // Renderiza o vídeo
      await renderMedia({
        composition,
        serveUrl: bundleResult,
        codec: 'h264',
        outputLocation: outputFile,
        inputProps: props,
        browserExecutable: null,
        chromiumOptions: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        onBrowserDownload: () => Promise.resolve(),
        onProgress: (progress) => {
          console.log(`Progresso: ${Math.round(progress * 100)}%`);
        }
      });
      
      console.log('Renderização concluída!');
      
      // Verifica se o arquivo foi criado
      if (!fs.existsSync(outputFile)) {
        throw new Error('Arquivo de vídeo não foi criado');
      }
      
      const stats = fs.statSync(outputFile);
      console.log(`Arquivo criado: ${outputFile} (${stats.size} bytes)`);
      
      // Lê o arquivo
      const videoBuffer = fs.readFileSync(outputFile);
      
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

// Função para iniciar renderização
const startRenderJob = async (videoData) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Iniciando job de renderização real...');
      
      // Cria um job ID
      const jobId = uuidv4();
      const job = {
        id: jobId,
        status: 'pending',
        progress: 0,
        data: videoData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Salva o job em arquivo
      saveJob(jobId, job);
      
      // Inicia renderização em background
      setTimeout(async () => {
        try {
          console.log(`Processando job ${jobId}...`);
          
          // Carrega o job atualizado
          const currentJob = loadJob(jobId);
          if (!currentJob) {
            console.error(`Job ${jobId} não encontrado durante processamento`);
            return;
          }
          
          // Atualiza status
          currentJob.status = 'processing';
          currentJob.progress = 25;
          currentJob.updatedAt = new Date().toISOString();
          saveJob(jobId, currentJob);
          
          // Renderiza vídeo real
          console.log('Iniciando renderização real...');
          const videoBuffer = await renderRealVideo(videoData);
          
          // Finaliza job
          currentJob.status = 'completed';
          currentJob.progress = 100;
          currentJob.result = {
            videoBuffer: videoBuffer.toString('base64'),
            size: videoBuffer.length,
            timestamp: new Date().toISOString()
          };
          currentJob.updatedAt = new Date().toISOString();
          saveJob(jobId, currentJob);
          
          console.log(`Job ${jobId} concluído com sucesso!`);
          
        } catch (error) {
          console.error(`Erro no job ${jobId}:`, error);
          const currentJob = loadJob(jobId);
          if (currentJob) {
            currentJob.status = 'failed';
            currentJob.error = error.message;
            currentJob.updatedAt = new Date().toISOString();
            saveJob(jobId, currentJob);
          }
        }
      }, 100);
      
      resolve(jobId);
      
    } catch (error) {
      console.error('Erro ao iniciar job:', error);
      reject(new Error(`Erro ao iniciar job: ${error.message}`));
    }
  });
};

// Rota para iniciar renderização (retorna job ID)
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

    console.log('Iniciando job de renderização real');
    console.log('Dados recebidos:', videoData);

    // Inicia o job de renderização
    const jobId = await startRenderJob(videoData);

    // Retorna o job ID para polling
    res.json({
      success: true,
      jobId: jobId,
      message: 'Job de renderização real iniciado. Use o jobId para verificar o status.',
      statusUrl: `/api/job-status/${jobId}`,
      downloadUrl: `/api/download-video/${jobId}`
    });

  } catch (error) {
    console.error('Erro ao iniciar job:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

// Rota para verificar status do job
app.get('/api/job-status/:jobId', (req, res) => {
  try {
    const {jobId} = req.params;
    const job = loadJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job não encontrado'
      });
    }
    
    res.json({
      success: true,
      jobId: jobId,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      error: job.error,
      result: job.result ? {
        size: job.result.size,
        timestamp: job.result.timestamp
      } : null
    });
    
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para download do vídeo
app.get('/api/download-video/:jobId', (req, res) => {
  try {
    const {jobId} = req.params;
    const job = loadJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job não encontrado'
      });
    }
    
    if (job.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Job ainda não foi concluído',
        status: job.status,
        progress: job.progress
      });
    }
    
    // Converte base64 para buffer
    const videoBuffer = Buffer.from(job.result.videoBuffer, 'base64');
    
    // Retorna o vídeo
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="video-${jobId}.mp4"`);
    res.setHeader('Content-Length', videoBuffer.length);
    res.send(videoBuffer);
    
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota para listar jobs
app.get('/api/jobs', (req, res) => {
  try {
    const jobList = [];
    
    // Lista todos os arquivos de job no /tmp
    const tmpFiles = fs.readdirSync('/tmp');
    const jobFiles = tmpFiles.filter(file => file.startsWith('job-') && file.endsWith('.json'));
    
    for (const jobFile of jobFiles) {
      try {
        const jobId = jobFile.replace('job-', '').replace('.json', '');
        const job = loadJob(jobId);
        if (job) {
          jobList.push({
            id: job.id,
            status: job.status,
            progress: job.progress,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
          });
        }
      } catch (e) {
        console.log(`Erro ao carregar job file ${jobFile}:`, e);
      }
    }
    
    res.json({
      success: true,
      jobs: jobList,
      total: jobList.length
    });
    
  } catch (error) {
    console.error('Erro ao listar jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Video Generator API (Real Remotion Rendering)',
    environment: process.env.NODE_ENV || 'development',
    message: 'API funcionando! Renderização real com Remotion.',
    template: 'teste.json',
    capabilities: [
      'Sistema de polling para jobs',
      'Armazenamento persistente em /tmp',
      'Renderização real com Remotion',
      'Template teste.json real',
      'Aplicação de cores personalizadas',
      'Otimizado para Vercel'
    ]
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
