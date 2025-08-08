// Exemplo de cliente para testar a API na Vercel

const API_BASE_URL = 'https://seu-projeto.vercel.app/api'; // Substitua pela sua URL

// Função para gerar vídeo na Vercel
async function generateVideoOnVercel(videoData) {
  try {
    console.log('🚀 Enviando requisição para gerar vídeo na Vercel...');
    console.log('📊 Dados:', videoData);
    
    const response = await fetch(`${API_BASE_URL}/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ${response.status}: ${errorData.error || 'Erro desconhecido'}`);
    }
    
    // Verifica se a resposta é um vídeo
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('video/')) {
      // É um vídeo, vamos salvar
      const videoBlob = await response.blob();
      const videoUrl = URL.createObjectURL(videoBlob);
      
      console.log('✅ Vídeo gerado com sucesso!');
      console.log('🔗 URL do vídeo:', videoUrl);
      
      return {
        success: true,
        videoUrl,
        videoBlob,
        size: videoBlob.size
      };
    } else {
      // É JSON (erro ou resposta de texto)
      const result = await response.json();
      console.log('📄 Resposta:', result);
      return result;
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para verificar health da API
async function checkVercelHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    
    console.log('✅ API Health:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erro ao verificar health:', error);
    return null;
  }
}

// Função para fazer upload de arquivo
async function uploadFileToVercel(file) {
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
      console.log('📁 Arquivo:', result.filename);
      console.log('📏 Tamanho:', result.size, 'bytes');
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
async function runVercelExamples() {
  console.log('🎬 Iniciando exemplos de uso da API na Vercel...\n');
  
  // Exemplo 1: Verificar health da API
  console.log('🔍 Verificando status da API...');
  await checkVercelHealth();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Exemplo 2: Gerar vídeo básico
  console.log('📝 Exemplo 1: Vídeo básico');
  const videoData1 = {
    texto_principal: "Vídeo gerado na Vercel!",
    cor_primaria: "#FF6B6B",
    cor_secundaria: "#4ECDC4",
    cor_fundo: "#1E90FF",
    duracao: 6
  };
  
  const result1 = await generateVideoOnVercel(videoData1);
  if (result1 && result1.success) {
    console.log('✅ Vídeo gerado! Tamanho:', result1.size, 'bytes');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Exemplo 3: Gerar vídeo corporativo
  console.log('🏢 Exemplo 2: Vídeo corporativo');
  const videoData2 = {
    texto_principal: "Bem-vindo à nossa empresa!",
    cor_primaria: "#2C3E50",
    cor_secundaria: "#3498DB",
    cor_fundo: "#ECF0F1",
    duracao: 8
  };
  
  const result2 = await generateVideoOnVercel(videoData2);
  if (result2 && result2.success) {
    console.log('✅ Vídeo corporativo gerado! Tamanho:', result2.size, 'bytes');
  }
}

// Função para usar no navegador
function setupBrowserExample() {
  // Cria interface HTML simples
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1>🎬 Gerador de Vídeos - Vercel API</h1>
      
      <div style="margin: 20px 0;">
        <h3>📝 Gerar Vídeo</h3>
        <textarea id="videoData" rows="8" cols="60" placeholder="Cole aqui o JSON com os dados do vídeo...">${JSON.stringify({
          texto_principal: "Seu texto aqui!",
          cor_primaria: "#FF6B6B",
          cor_secundaria: "#4ECDC4",
          cor_fundo: "#1E90FF",
          duracao: 6
        }, null, 2)}</textarea>
        <br><br>
        <button onclick="generateVideoFromUI()">🚀 Gerar Vídeo</button>
      </div>
      
      <div id="result" style="margin: 20px 0; padding: 10px; border: 1px solid #ccc; min-height: 100px;">
        <p>Resultado aparecerá aqui...</p>
      </div>
      
      <div id="videoContainer" style="margin: 20px 0;">
        <!-- Vídeo será exibido aqui -->
      </div>
    </div>
  `;
  
  document.body.innerHTML = html;
}

// Função para gerar vídeo a partir da UI
async function generateVideoFromUI() {
  const videoDataText = document.getElementById('videoData').value;
  const resultDiv = document.getElementById('result');
  const videoContainer = document.getElementById('videoContainer');
  
  try {
    const videoData = JSON.parse(videoDataText);
    resultDiv.innerHTML = '<p>⏳ Gerando vídeo...</p>';
    videoContainer.innerHTML = '';
    
    const result = await generateVideoOnVercel(videoData);
    
    if (result && result.success) {
      resultDiv.innerHTML = `
        <h4>✅ Vídeo gerado com sucesso!</h4>
        <p><strong>Tamanho:</strong> ${result.size} bytes</p>
        <p><strong>URL:</strong> ${result.videoUrl}</p>
      `;
      
      // Exibe o vídeo
      videoContainer.innerHTML = `
        <h4>🎬 Vídeo Gerado:</h4>
        <video controls style="max-width: 100%; height: auto;">
          <source src="${result.videoUrl}" type="video/mp4">
          Seu navegador não suporta vídeos.
        </video>
        <br>
        <a href="${result.videoUrl}" download="video.mp4" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          📥 Download do Vídeo
        </a>
      `;
    } else {
      resultDiv.innerHTML = `<p style="color: red;">❌ Erro ao gerar vídeo: ${result.error}</p>`;
    }
    
  } catch (error) {
    resultDiv.innerHTML = `<p style="color: red;">❌ Erro: ${error.message}</p>`;
  }
}

// Exporta funções para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateVideoOnVercel,
    checkVercelHealth,
    uploadFileToVercel,
    runVercelExamples
  };
} else {
  // Para uso no navegador
  window.VercelVideoAPI = {
    generateVideoOnVercel,
    checkVercelHealth,
    uploadFileToVercel,
    setupBrowserExample
  };
}

console.log('📚 Cliente Vercel carregado!');
console.log('💡 Use runVercelExamples() para testar a API');
console.log('🌐 Use setupBrowserExample() para interface no navegador');
console.log('⚠️  Lembre-se de atualizar API_BASE_URL com sua URL da Vercel!');
