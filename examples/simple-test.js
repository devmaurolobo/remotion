// Exemplo simples para testar a API de geração de vídeos

const API_URL = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testando a API de geração de vídeos...\n');

  try {
    // Teste 1: Health Check
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await fetch(`${API_URL}/health`);
    const health = await healthResponse.json();
    console.log('✅ Health Check:', health.status);
    console.log('');

    // Teste 2: Gerar vídeo simples
    console.log('2️⃣ Gerando vídeo simples...');
    const videoData = {
      texto_principal: "Olá! Este é um teste da API!",
      cor_primaria: "#FF6B6B",
      cor_secundaria: "#4ECDC4",
      duracao: 8
    };

    const response = await fetch(`${API_URL}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Vídeo gerado com sucesso!');
      console.log('🆔 Video ID:', result.videoId);
      console.log('🔗 URL:', `http://localhost:3001${result.videoUrl}`);
      console.log('');

      // Teste 3: Verificar status do vídeo
      console.log('3️⃣ Verificando status do vídeo...');
      const statusResponse = await fetch(`${API_URL}/video/${result.videoId}/status`);
      const status = await statusResponse.json();
      
      if (status.exists) {
        console.log('✅ Vídeo existe no servidor');
        console.log('📏 Tamanho:', status.size, 'bytes');
      } else {
        console.log('⏳ Vídeo ainda está sendo processado');
      }
    } else {
      console.error('❌ Erro ao gerar vídeo:', result.error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.log('\n💡 Certifique-se de que a API está rodando: npm run api');
  }
}

// Executa o teste
testAPI(); 