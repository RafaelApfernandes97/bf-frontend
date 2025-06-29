# Frontend - Sistema de Fotos de Ballet

Interface web React para o sistema de fotos de ballet.

## 🚀 Funcionalidades

- Visualização de fotos por evento e coreografia
- Autenticação com Google OAuth
- Carrinho de compras
- Interface responsiva
- PWA (Progressive Web App)

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

4. Configure a URL da API no arquivo `.env`:
   ```
   REACT_APP_API_URL=http://localhost:3001
   ```

## 🏃‍♂️ Executando

### Desenvolvimento
```bash
npm start
```

### Build para produção
```bash
npm run build
```

### Testes
```bash
npm test
```

## 🐳 Docker

### Build
```bash
docker build -t frontend-fotos .
```

### Executar
```bash
docker run -p 3000:80 frontend-fotos
```

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── pages/         # Páginas da aplicação
├── config/        # Configurações (API, etc.)
├── assets/        # Recursos estáticos
└── App.js         # Componente principal
```

## 🔧 Tecnologias

- React 18
- React Router DOM
- Axios
- @react-oauth/google
- CSS3
- HTML5

## 🌐 Deploy

O projeto está configurado para deploy no Easy Panel com Docker e Nginx. 