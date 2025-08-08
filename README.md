# 🎬 Gerador de Vídeos Dinâmicos com Remotion

Sistema de geração de vídeos dinâmicos usando **Remotion** e **Lottie** com API REST.

## 🚀 Funcionalidades

- ✅ Geração de vídeos dinâmicos com cores customizáveis
- ✅ API REST para integração
- ✅ Suporte a animações Lottie
- ✅ Deploy serverless na Vercel
- ✅ Upload de arquivos
- ✅ Health check da API

## 🛠️ Tecnologias

- **Remotion** - Framework para renderização de vídeos
- **Lottie** - Animações vetoriais
- **Express.js** - API REST
- **TypeScript** - Tipagem estática
- **Vercel** - Deploy serverless

## 📦 Instalação

```bash
# Clone o repositório
git clone <seu-repositorio>
cd remotionV4

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env
```

## 🏃‍♂️ Execução Local

### Desenvolvimento
```bash
# Inicia o servidor de desenvolvimento
npm run api

# Em outro terminal, inicia o preview do Remotion
npm run dev
```

### Teste da API
```bash
# Testa a API com exemplos
npm run test-api
```

## 🌐 Deploy na Vercel

### 1. Preparação

O projeto já está configurado para deploy na Vercel com os seguintes arquivos:

- `vercel.json` - Configuração da Vercel
- `api/vercel.js` - Versão serverless da API
- `package.json` - Scripts otimizados

### 2. Deploy

```bash
# Instale a CLI da Vercel
npm i -g vercel

# Faça login na Vercel
vercel login

# Deploy
vercel

# Para produção
vercel --prod
```

### 3. Variáveis de Ambiente (Opcional)

Configure no dashboard da Vercel:
- `NODE_ENV=production`
- `PORT=3001`

## 📡 API Endpoints

### Base URL
- **Local:** `http://localhost:3001`
- **Vercel:** `https://seu-projeto.vercel.app`

### Endpoints

#### 🎬 Gerar Vídeo
```http
POST /api/generate-video
Content-Type: application/json

{
  "texto_principal": "Seu texto aqui!",
  "cor_primaria": "#FF6B6B",
  "cor_secundaria": "#4ECDC4",
  "cor_fundo": "#1E90FF",
  "duracao": 6
}
```

**Resposta:**
```json
{
  "success": true,
  "videoId": "uuid-do-video",
  "videoUrl": "/videos/uuid-do-video.mp4",
  "message": "Vídeo gerado com sucesso"
}
```

#### 📤 Upload de Arquivo
```http
POST /api/upload
Content-Type: multipart/form-data

file: [arquivo]
```

#### 🔍 Health Check
```http
GET /api/health
```

## 🎨 Parâmetros do Vídeo

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `texto_principal` | string | ✅ | Texto principal do vídeo |
| `cor_primaria` | string | ❌ | Cor principal (hex) |
| `cor_secundaria` | string | ❌ | Cor secundária (hex) |
| `cor_fundo` | string | ❌ | Cor de fundo (hex) |
| `duracao` | number | ❌ | Duração em segundos |

## 📝 Exemplos de Uso

### cURL
```bash
curl -X POST https://seu-projeto.vercel.app/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "texto_principal": "Meu vídeo personalizado!",
    "cor_primaria": "#FF6B6B",
    "cor_secundaria": "#4ECDC4",
    "cor_fundo": "#1E90FF",
    "duracao": 6
  }'
```

### JavaScript
```javascript
const response = await fetch('https://seu-projeto.vercel.app/api/generate-video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    texto_principal: "Seu texto aqui!",
    cor_primaria: "#FF0000",
    cor_secundaria: "#00FF00",
    cor_fundo: "#0000FF",
    duracao: 8
  })
});

const result = await response.json();
console.log(result.videoUrl);
```

## 🔧 Desenvolvimento

### Estrutura do Projeto
```
remotionV4/
├── api/
│   ├── server.js          # Servidor local
│   └── vercel.js          # Versão serverless
├── src/
│   ├── components/
│   │   └── LottieAnimation.tsx
│   ├── VideoComposition.tsx
│   └── index.ts
├── examples/
│   └── client-example.js
├── outputs/               # Vídeos gerados
├── vercel.json           # Config Vercel
└── package.json
```

### Scripts Disponíveis
- `npm run api` - Servidor local
- `npm run api:vercel` - Servidor serverless
- `npm run dev` - Preview Remotion
- `npm run test-api` - Testa a API
- `npm run build` - Build do vídeo

## 🚨 Limitações da Vercel

⚠️ **Importante:** A Vercel tem limitações para renderização de vídeo:

1. **Timeout:** Máximo 10 segundos por função
2. **Memória:** Limite de 1024MB
3. **Tamanho:** Máximo 50MB de resposta

**Solução:** Para produção em larga escala, considere:
- AWS Lambda com mais recursos
- Servidor dedicado
- Queue system (Redis + Workers)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Email: seu-email@exemplo.com
- 🐛 Issues: [GitHub Issues](link-para-issues)
- 📖 Docs: [Documentação](link-para-docs) 