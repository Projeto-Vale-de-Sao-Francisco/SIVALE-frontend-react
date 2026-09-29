# SIVALE — Sistema Inteligente do Vale

Projeto Integrador (UE Mobile / Senac) — plataforma de monitoramento climático e logístico
da fruticultura do Vale do São Francisco. Este repositório cobre a **1ª entrega** (13/10/2026):
PWA + Backend + Banco de Dados, com fluxo completo `sensor simulado → API → banco → dashboard`.

## Estrutura

```
sivale/
├── backend/     API REST (Node.js + Express + TypeScript + SQLite nativo)
├── frontend/    PWA (React + Vite + TypeScript + Recharts)
└── docs/        Arquitetura, modelo de banco e endpoints
```

## Como rodar (local)

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed        # popula o banco com empresa, propriedades, culturas, lotes, sensores e histórico
npm run dev          # inicia em http://localhost:3333
```

Login de teste: `admin@sivale.com.br` / `123456`

Para gerar novas leituras simuladas (substituindo o ESP32 físico):
```bash
npm run simulate         # gera 1 rodada de leituras e encerra
npm run simulate -- loop # gera leituras a cada 30s continuamente
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env   # aponta VITE_API_URL para o backend
npm run dev             # inicia em http://localhost:5173
```

Abra `http://localhost:5173`, faça login e explore o Dashboard, Propriedades, Sensores e Alertas.

## Tecnologias

- **Backend**: Node.js, Express, TypeScript, `node:sqlite` (nativo, sem dependências binárias externas), JWT, bcrypt, Zod.
- **Frontend**: React 18, Vite, TypeScript, React Router, Recharts, PWA (manifest + service worker).
- **Banco de dados**: SQLite local por padrão. Caminho de migração para PostgreSQL/AWS RDS documentado em `docs/ARQUITETURA.md` (para a 2ª entrega).

## Cobertura dos requisitos da 1ª entrega

Todos os 16 itens do documento de requisitos estão implementados: cadastro e autenticação de
usuários, produtores/empresas, propriedades, culturas, lotes, sensores IoT simulados, registro
e consulta de leituras via API REST, dados de mercado, informações logísticas, dashboard com
indicadores e gráficos históricos, alertas climáticos automáticos, e o fluxo integrado
PWA → API → Banco de Dados → Dashboard. Detalhes técnicos em `docs/`.

## Próximos passos (2ª entrega)

- Deploy em nuvem (AWS/Azure) do backend e do banco (migrar `node:sqlite` → PostgreSQL gerenciado).
- Pipeline de dados e modelo/regra de recomendação de janela de colheita e exportação (Python).
- RBAC completo por perfil e por propriedade, testes automatizados, CI/CD e monitoramento.
