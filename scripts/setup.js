#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

console.log('🚀 Configurando o projeto Remotion Video Generator...\n');

// Função para criar diretórios
function createDirectories() {
  const dirs = [
    'outputs',
    'uploads',
    'cache',
    'src/components'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
      console.log(`✅ Criado diretório: ${dir}`);
    } else {
      console.log(`📁 Diretório já existe: ${dir}`);
    }
  });
}

// Função para verificar dependências
function checkDependencies() {
  console.log('\n🔍 Verificando dependências...');
  
  try {
    // Verifica se o Node.js está instalado
    const nodeVersion = execSync('node --version', {encoding: 'utf8'});
    console.log(`✅ Node.js: ${nodeVersion.trim()}`);
    
    // Verifica se o npm está instalado
    const npmVersion = execSync('npm --version', {encoding: 'utf8'});
    console.log(`✅ npm: ${npmVersion.trim()}`);
    
    // Verifica se o FFmpeg está instalado
    try {
      const ffmpegVersion = execSync('ffmpeg -version', {encoding: 'utf8'});
      const versionLine = ffmpegVersion.split('\n')[0];
      console.log(`✅ FFmpeg: ${versionLine}`);
    } catch (error) {
      console.log('⚠️  FFmpeg não encontrado. Instale o FFmpeg para renderização de vídeos.');
      console.log('   Windows: https://ffmpeg.org/download.html');
      console.log('   macOS: brew install ffmpeg');
      console.log('   Linux: sudo apt install ffmpeg');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dependências:', error.message);
  }
}

// Função para instalar dependências
function installDependencies() {
  console.log('\n📦 Instalando dependências...');
  
  try {
    execSync('npm install', {stdio: 'inherit'});
    console.log('✅ Dependências instaladas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao instalar dependências:', error.message);
    process.exit(1);
  }
}

// Função para configurar arquivo .env
function setupEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', 'env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Arquivo .env criado a partir do exemplo');
    } catch (error) {
      console.error('❌ Erro ao criar arquivo .env:', error.message);
    }
  } else if (fs.existsSync(envPath)) {
    console.log('📄 Arquivo .env já existe');
  } else {
    console.log('⚠️  Arquivo env.example não encontrado');
  }
}

// Função para verificar arquivo Lottie
function checkLottieFile() {
  const lottieFiles = ['teste.json'];
  
  console.log('\n🎬 Verificando arquivos Lottie...');
  
  lottieFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ Arquivo Lottie encontrado: ${file}`);
    } else {
      console.log(`⚠️  Arquivo Lottie não encontrado: ${file}`);
    }
  });
}

// Função principal
function main() {
  console.log('🎬 Remotion Video Generator Setup\n');
  
  // Cria diretórios
  createDirectories();
  
  // Verifica dependências
  checkDependencies();
  
  // Instala dependências
  installDependencies();
  
  // Configura .env
  setupEnv();
  
  // Verifica arquivo Lottie
  checkLottieFile();
  
  console.log('\n🎉 Setup concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Configure o arquivo .env com suas configurações');
  console.log('2. Execute: npm run start');
  console.log('3. Acesse: http://localhost:3001/api/health');
  console.log('4. Teste a API com: node examples/client-example.js');
  
  console.log('\n📚 Documentação completa em: README.md');
}

// Executa o setup
if (require.main === module) {
  main();
}

module.exports = {
  createDirectories,
  checkDependencies,
  installDependencies,
  setupEnv,
  checkLottieFile
}; 