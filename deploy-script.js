#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Script de Deploy - Gerador de Vídeos');
console.log('==========================================\n');

// Verifica se o projeto está pronto
function checkProject() {
  console.log('📋 Verificando projeto...');
  
  const requiredFiles = [
    'package.json',
    'api/server.js',
    'src/VideoComposition.tsx',
    'vercel.json',
    'railway.json'
  ];
  
  const missing = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missing.length > 0) {
    console.log('❌ Arquivos faltando:', missing);
    return false;
  }
  
  console.log('✅ Projeto está pronto!');
  return true;
}

// Mostra opções de deploy
function showOptions() {
  console.log('\n🎯 Escolha uma opção de deploy:\n');
  console.log('1. 🚂 Railway (Mais fácil)');
  console.log('2. 🌐 Render.com (Gratuito)');
  console.log('3. ⚡ Vercel (Via Dashboard)');
  console.log('4. 📦 Netlify (Serverless)');
  console.log('5. 🔧 Deploy Manual');
  console.log('6. ❌ Sair');
}

// Deploy no Railway
function deployRailway() {
  console.log('\n🚂 Deploy no Railway...');
  console.log('1. Vá para https://railway.app');
  console.log('2. Crie uma conta');
  console.log('3. Clique em "New Project"');
  console.log('4. Escolha "Deploy from GitHub"');
  console.log('5. Conecte seu GitHub');
  console.log('6. Selecione este repositório');
  console.log('7. Railway detectará automaticamente as configurações');
}

// Deploy no Render
function deployRender() {
  console.log('\n🌐 Deploy no Render.com...');
  console.log('1. Vá para https://render.com');
  console.log('2. Crie uma conta gratuita');
  console.log('3. Clique em "New Web Service"');
  console.log('4. Conecte seu GitHub');
  console.log('5. Configure:');
  console.log('   - Name: remotion-video-api');
  console.log('   - Environment: Node');
  console.log('   - Build Command: npm install');
  console.log('   - Start Command: npm run api');
  console.log('   - Plan: Free');
}

// Deploy na Vercel
function deployVercel() {
  console.log('\n⚡ Deploy na Vercel...');
  console.log('1. Vá para https://vercel.com');
  console.log('2. Crie uma conta');
  console.log('3. Clique em "New Project"');
  console.log('4. Importe do GitHub');
  console.log('5. Selecione este repositório');
  console.log('6. Vercel detectará automaticamente as configurações');
}

// Deploy no Netlify
function deployNetlify() {
  console.log('\n📦 Deploy no Netlify...');
  console.log('1. Vá para https://netlify.com');
  console.log('2. Crie uma conta');
  console.log('3. Clique em "New site from Git"');
  console.log('4. Conecte seu GitHub');
  console.log('5. Selecione este repositório');
  console.log('6. Configure:');
  console.log('   - Build command: npm run build');
  console.log('   - Publish directory: public');
}

// Deploy Manual
function deployManual() {
  console.log('\n🔧 Deploy Manual...');
  console.log('1. Crie um repositório no GitHub');
  console.log('2. Execute: git remote add origin SEU_REPO_URL');
  console.log('3. Execute: git push -u origin main');
  console.log('4. Escolha uma plataforma e conecte o GitHub');
}

// Testa a API localmente
function testLocal() {
  console.log('\n🧪 Testando API localmente...');
  console.log('Executando: npm run api');
  
  exec('npm run api', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Erro ao iniciar servidor:', error.message);
      return;
    }
    console.log('✅ Servidor iniciado com sucesso!');
    console.log('🌐 Acesse: http://localhost:3001');
    console.log('🔍 Health check: http://localhost:3001/api/health');
  });
}

// Menu principal
function main() {
  if (!checkProject()) {
    console.log('\n❌ Projeto não está pronto. Verifique os arquivos.');
    return;
  }
  
  showOptions();
  
  // Simula interação do usuário
  console.log('\n💡 Para testar localmente primeiro, execute:');
  console.log('   npm run api');
  console.log('\n💡 Para fazer deploy, siga as instruções acima.');
  console.log('\n📚 Documentação completa: README.md');
}

// Executa o script
main();
