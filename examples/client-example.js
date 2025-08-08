// Exemplo de cliente para testar a API de geração de vídeos

const API_BASE_URL = 'http://localhost:3001/api';

// Função para gerar vídeo
async function generateVideo(videoData) {
  try {
    console.log('🚀 Enviando requisição para gerar vídeo...');
    console.log('📊 Dados:', videoData);
    
    const response = await fetch(`${API_BASE_URL}/generate-video`, {
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
      console.log('🔗 URL do vídeo:', `http://localhost:3001${result.videoUrl}`);
      return result;
    } else {
      console.error('❌ Erro ao gerar vídeo:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return null;
  }
}

// Função para verificar status do vídeo
async function checkVideoStatus(videoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/video/${videoId}/status`);
    const result = await response.json();
    
    if (result.success) {
      if (result.exists) {
        console.log('✅ Vídeo existe!');
        console.log('📏 Tamanho:', result.size, 'bytes');
        console.log('📅 Criado em:', result.createdAt);
      } else {
        console.log('⏳ Vídeo ainda não foi gerado');
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    return null;
  }
}

// Função para fazer upload de arquivo
async function uploadFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Arquivo enviado com sucesso!');
      console.log('🔗 URL:', `http://localhost:3001${result.fileUrl}`);
      return result;
    } else {
      console.error('❌ Erro no upload:', result.error);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    return null;
  }
}

// Exemplos de uso
async function runExamples() {
  console.log('🎬 Iniciando exemplos de uso da API...\n');
  
  // Exemplo 1: Gerar vídeo com dados básicos
  console.log('📝 Exemplo 1: Vídeo com texto personalizado');
  const videoData1 = {
    texto_principal: "Seu texto personalizado aqui!",
    cor_primaria: "#FF6B6B",
    cor_secundaria: "#4ECDC4",
    duracao: 8
  };
  
  const result1 = await generateVideo(videoData1);
  if (result1) {
    await checkVideoStatus(result1.videoId);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Exemplo 2: Gerar vídeo com logo e cores corporativas
  console.log('🏢 Exemplo 2: Vídeo corporativo');
  const videoData2 = {
    texto_principal: "Bem-vindo à nossa empresa!",
    logo_empresa: "https://exemplo.com/logo.png",
    cor_primaria: "#2C3E50",
    cor_secundaria: "#3498DB",
    duracao: 10
  };
  
  const result2 = await generateVideo(videoData2);
  if (result2) {
    await checkVideoStatus(result2.videoId);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Exemplo 3: Verificar health da API
  console.log('🔍 Verificando status da API...');
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const health = await healthResponse.json();
    console.log('✅ API Status:', health);
  } catch (error) {
    console.error('❌ Erro ao verificar health:', error);
  }
}

// Função para usar no navegador
function setupBrowserExample() {
  // Cria interface HTML simples
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1>🎬 Gerador de Vídeos - Teste da API</h1>
      
      <div style="margin: 20px 0;">
        <h3>📝 Gerar Vídeo</h3>
        <textarea id="videoData" rows="8" cols="60" placeholder="Cole aqui o JSON com os dados do vídeo...">${JSON.stringify({
          texto_principal: "Seu texto aqui!",
          cor_primaria: "#FF6B6B",
          cor_secundaria: "#4ECDC4",
          duracao: 8
        }, null, 2)}</textarea>
        <br><br>
        <button onclick="generateVideoFromUI()">🚀 Gerar Vídeo</button>
      </div>
      
      <div id="result" style="margin: 20px 0; padding: 10px; border: 1px solid #ccc; min-height: 100px;">
        <p>Resultado aparecerá aqui...</p>
      </div>
    </div>
  `;
  
  document.body.innerHTML = html;
}

// Função para gerar vídeo a partir da UI
async function generateVideoFromUI() {
  const videoDataText = document.getElementById('videoData').value;
  const resultDiv = document.getElementById('result');
  
  try {
    const videoData = JSON.parse(videoDataText);
    resultDiv.innerHTML = '<p>⏳ Gerando vídeo...</p>';
    
    const result = await generateVideo(videoData);
    
    if (result) {
      resultDiv.innerHTML = `
        <h4>✅ Vídeo gerado com sucesso!</h4>
        <p><strong>Video ID:</strong> ${result.videoId}</p>
        <p><strong>URL:</strong> <a href="http://localhost:3001${result.videoUrl}" target="_blank">Ver vídeo</a></p>
        <p><strong>Mensagem:</strong> ${result.message}</p>
      `;
    } else {
      resultDiv.innerHTML = '<p style="color: red;">❌ Erro ao gerar vídeo</p>';
    }
    
  } catch (error) {
    resultDiv.innerHTML = `<p style="color: red;">❌ Erro: ${error.message}</p>`;
  }
}

// Exporta funções para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateVideo,
    checkVideoStatus,
    uploadFile,
    runExamples
  };
} else {
  // Para uso no navegador
  window.VideoAPI = {
    generateVideo,
    checkVideoStatus,
    uploadFile,
    setupBrowserExample
  };
}

console.log('📚 Cliente de exemplo carregado!');
console.log('💡 Use runExamples() para testar a API');
console.log('🌐 Use setupBrowserExample() para interface no navegador'); 