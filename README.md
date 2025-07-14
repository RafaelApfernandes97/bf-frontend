# Frontend - Sistema de Fotos Ballet em Foco

Este é o frontend da aplicação de fotos do Ballet em Foco, desenvolvido em React.

## 🚀 Configuração de Desenvolvimento

### Backend Local vs Produção

Por padrão, o frontend em desenvolvimento usa o **backend de produção** (`https://backend.rfsolutionbr.com.br`). 

Para usar o **backend LOCAL** durante o desenvolvimento:

1. **Crie um arquivo `.env.local` na pasta `frontend/`:**
```env
REACT_APP_USE_LOCAL_BACKEND=true
```

2. **Certifique-se de que o backend local está rodando:**
```bash
cd backend
npm start
```

3. **Inicie o frontend:**
```bash
cd frontend
npm start
```

### Alternativas de Configuração

- **Backend customizado (IP específico):**
```env
REACT_APP_BACKEND_URL=http://192.168.1.100:3001
```

- **Forçar backend de produção:**
```env
# Não defina nenhuma variável ou:
REACT_APP_USE_LOCAL_BACKEND=false
```

### Logs de Debug

O sistema mostrará no console qual backend está sendo usado:

- 🔧 **Desenvolvimento + Backend Local:** `Modo desenvolvimento - usando backend LOCAL`
- 🔧 **Desenvolvimento + Backend Produção:** `Modo desenvolvimento - usando backend de PRODUÇÃO`
- 🚀 **Produção:** `Modo produção - usando backend:`

## 🔧 Solução de Problemas

### Erro de CORS

Se você encontrar erros de CORS como:
```
Access to fetch at 'https://backend.rfsolutionbr.com.br/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Soluções:**

1. **Use o backend local:**
   - Crie o arquivo `.env.local` com `REACT_APP_USE_LOCAL_BACKEND=true`
   - Garanta que o backend local está rodando

2. **Verifique se o backend de produção está online:**
   - Teste: `https://backend.rfsolutionbr.com.br/health`

3. **Limpe o cache do navegador:**
   - F12 → Network → Disable Cache
   - Ou Ctrl+Shift+R para hard refresh

### Backend Indisponível (502 Bad Gateway)

Se o backend de produção estiver retornando erro 502:

1. **Force o uso do backend local temporariamente**
2. **Aguarde o backend de produção voltar ao ar**
3. **Verifique com o administrador do sistema**

## 📚 Scripts Disponíveis

```bash
npm start          # Desenvolvimento
npm run build      # Build de produção
npm test           # Testes
npm run eject      # Ejetar configuração (cuidado!)
```

## 🌟 Funcionalidades

- ✅ Sistema de banners configuráveis (Vale Coreografia + Vídeo)
- ✅ Modal com preços e carrinho integrado
- ✅ Painel administrativo completo
- ✅ Busca por reconhecimento facial
- ✅ Navegação de fotos responsiva
- ✅ Sistema de pedidos e carrinho
- ✅ Configuração flexível de backend (local/produção)

## 🔒 Problemas Conhecidos Resolvidos

- ❌ ~~Warning sobre valores null em inputs~~ → ✅ **Corrigido**
- ❌ ~~Valores de banners não salvavam~~ → ✅ **Corrigido**  
- ❌ ~~Problemas de CORS em desenvolvimento~~ → ✅ **Corrigido**
- ❌ ~~Configuração rígida de backend~~ → ✅ **Corrigido** 