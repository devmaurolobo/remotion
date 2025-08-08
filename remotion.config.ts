import {Config} from '@remotion/cli/config';

// Configurações otimizadas para melhor qualidade e fluidez
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setEntryPoint('./src/index.ts');

// Configurações de qualidade
Config.setConcurrency(1); // Renderização sequencial para melhor qualidade 