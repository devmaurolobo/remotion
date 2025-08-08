// Teste específico para modificações dinâmicas

const API_URL = 'http://localhost:3001/api';

async function testDynamicModifications() {
  console.log('🧪 Testando modificações dinâmicas...\n');

  try {
    // Teste com cores muito diferentes para ver a mudança
    const videoData = {
      texto_principal: "TEXTO DINÂMICO TESTE!",
      cor_primaria: "#FF0000", // Vermelho brilhante
      cor_secundaria: "#00FF00", // Verde brilhante
      cor_fundo: "#1E90FF", // Azul DodgerBlue para o fundo
      duracao: 6 // 6 segundos (3 ciclos da animação)
    };

    console.log('📤 Enviando dados:', videoData);

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

      // Verificar status
      const statusResponse = await fetch(`${API_URL}/video/${result.videoId}/status`);
      const status = await statusResponse.json();

      if (status.exists) {
        console.log('✅ Vídeo existe no servidor');
        console.log('📏 Tamanho:', status.size, 'bytes');
        console.log('📅 Criado em:', status.createdAt);
      }
    } else {
      console.error('❌ Erro ao gerar vídeo:', result.error);
      if (result.details) {
        console.error('📋 Detalhes:', result.details);
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executa o teste
testDynamicModifications(); 