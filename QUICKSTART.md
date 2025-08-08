# 🚀 Guia de Início Rápido

## ⚡ Setup em 5 minutos

### 1. Instalação Automática
```bash
# Execute o setup automático
npm run setup
```

### 2. Iniciar o Projeto
```bash
# Inicia API + Preview do Remotion
npm run start
```

### 3. Testar a API
```bash
# Teste simples
npm run test-simple

# Teste completo
npm run test-api
```

## 📋 Checklist de Verificação

- [ ] Node.js 16+ instalado
- [ ] FFmpeg instalado (para renderização)
- [ ] Arquivo `teste.json` presente (seu Lottie)
- [ ] API rodando na porta 3001
- [ ] Preview do Remotion funcionando

## 🔧 Comandos Úteis

```bash
# Apenas API
npm run api

# Apenas Preview Remotion
npm run dev

# Renderizar vídeo
npm run render

# Build do projeto
npm run build
```

## 🌐 URLs Importantes

- **API Health Check**: http://localhost:3001/api/health
- **Preview Remotion**: http://localhost:3000
- **Vídeos Gerados**: http://localhost:3001/videos/
- **Uploads**: http://localhost:3001/uploads/

## 📝 Exemplo de Uso

```javascript
// Gerar vídeo via API
const response = await fetch('http://localhost:3001/api/generate-video', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    texto_principal: "Seu texto aqui!",
    cor_primaria: "#FF6B6B",
    cor_secundaria: "#4ECDC4",
    duracao: 8
  })
});

const result = await response.json();
console.log('Vídeo gerado:', result.videoUrl);
```

## 🐛 Problemas Comuns

### API não responde
```bash
# Verifique se está rodando
curl http://localhost:3001/api/health
```

### Erro de renderização
```bash
# Verifique FFmpeg
ffmpeg -version
```

### Arquivo Lottie não carrega
- Verifique se `teste.json` está na raiz
- Confirme se o JSON é válido

## 📚 Próximos Passos

1. Leia o `README.md` completo
2. Personalize o template no After Effects
3. Configure variáveis de ambiente em `.env`
4. Implemente upload para S3 (opcional)

---

**🎬 Pronto para gerar vídeos dinâmicos!** 