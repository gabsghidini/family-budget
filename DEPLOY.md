# Deploy no Vercel - Family Budget

## 📋 Pré-requisitos

1. **Conta no Vercel** (conectar com GitHub)
2. **Repositório no GitHub** com o código

## 🚀 Passos para Deploy

### 1. Configurar Variáveis de Ambiente no Vercel

Acesse: `Dashboard > Projeto > Settings > Environment Variables`

Adicione:
```
NODE_ENV=production
SESSION_SECRET=seu-secret-super-secreto-aqui-2024
DATABASE_URL=sqlite:///tmp/family-budget.db
```

### 2. Deploy Automático

- ✅ O Vercel fará deploy automático ao fazer push no GitHub
- ✅ Build command: `npm run build:client`
- ✅ Output directory: `client/dist`
- ✅ API routes: `/api/*` → `server/index.ts`

### 3. Estrutura do Projeto

```
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Schemas compartilhados
├── vercel.json      # Configuração do Vercel
└── package.json     # Scripts de build
```

### 4. Funcionamento

- **Frontend**: Servido estaticamente pelo Vercel
- **Backend**: Rodando como Serverless Functions
- **Banco**: SQLite em `/tmp/` (temporário por session)

### ⚠️ Importante

- O banco SQLite será **temporário** no Vercel
- Para produção real, considere migrar para **PostgreSQL** ou **PlanetScale**
- Sessions ficam em memória (reiniciam a cada deploy)

### 🔧 Troubleshooting

Se aparecer "tela cheia de texto":
1. Verifique se as variáveis de ambiente estão configuradas
2. Confirme se o build foi feito corretamente
3. Verifique os logs do Vercel Dashboard

**Erro comum**: `Function Runtimes must have a valid version`
- ✅ **Solução**: Configuração do `vercel.json` foi simplificada
- ✅ **Usar**: Build command `npm run build:client`
- ✅ **Output**: `client/dist`

### 📝 Configuração do Vercel Dashboard

1. **Build Command**: `npm run build:client`
2. **Output Directory**: `client/dist`
3. **Install Command**: `npm install`
4. **Node.js Version**: 18.x ou 20.x

## 📁 Estrutura de Deploy

```
Vercel Edge     →  Static Assets (client/dist/)
Vercel Function →  API Routes (server/index.ts)
```
