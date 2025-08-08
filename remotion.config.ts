import {Config} from '@remotion/cli/config';

// Configuração para ambiente serverless (Vercel)
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Em ambiente serverless, usa /tmp para cache e outputs
if (process.env.NODE_ENV === 'production') {
  Config.setOutputLocation('/tmp');
  Config.setCacheLocation('/tmp');
}

// Configurações de qualidade
Config.setConcurrency(1); // Renderização sequencial para melhor qualidade 