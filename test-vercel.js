// Teste da API na Vercel
const API_URL = 'https://remotion-ezr6.vercel.app';

async function testAPI() {
  console.log('🧪 Testando API na Vercel...\n');
  
  // 1. Health Check
  console.log('1. 🔍 Health Check...');
  try {
    const healthResponse = await fetch(`${API_URL}/api/health`);
    const health = await healthResponse.json();
    console.log('✅ Health:', health);
  } catch (error) {
    console.log('❌ Erro no health check:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 2. Gerar Vídeo
  console.log('2. 🎬 Gerando vídeo...');
  try {
    const videoData = {
      texto_principal: "Vídeo gerado na Vercel!",
      cor_primaria: "#FF6B6B",
      cor_secundaria: "#4ECDC4",
      cor_fundo: "#1E90FF",
      duracao: 6
    };
    
    console.log('📊 Dados enviados:', videoData);
    
    const response = await fetch(`${API_URL}/api/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData)
    });
    
    if (response.ok) {
      const videoBlob = await response.blob();
      console.log('✅ Vídeo gerado com sucesso!');
      console.log('📏 Tamanho:', videoBlob.size, 'bytes');
      console.log('🎬 Tipo:', videoBlob.type);
      
      // Salva o vídeo localmente
      const fs = require('fs');
      const buffer = await videoBlob.arrayBuffer();
      fs.writeFileSync('video-gerado.mp4', Buffer.from(buffer));
      console.log('💾 Vídeo salvo como: video-gerado.mp4');
    } else {
      const error = await response.json();
      console.log('❌ Erro:', error);
    }
  } catch (error) {
    console.log('❌ Erro ao gerar vídeo:', error.message);
  }
}

// Executa o teste
testAPI();
