# SIVALE — Frontend

Interface web/PWA do Projeto Integrador do Vale do São Francisco.

Este projeto não contém backend próprio. Todas as informações são consumidas da API Chico Talhão publicada em:

`https://chico-talhao-backend.onrender.com`

## Estrutura

```text
sivale/
├── frontend/   React + Vite + TypeScript
└── docs/       Documentação de referência do projeto
```

## Executar localmente

Requisitos: Node.js e npm.

```bash
cd frontend
npm install
npm run dev
```

A aplicação fica disponível em `http://127.0.0.1:5173`.

Durante o desenvolvimento, o frontend usa `/api` e o proxy configurado no Vite encaminha as requisições para o backend no Render. Isso evita bloqueios de CORS no navegador local.

## Configuração

- `.env`: `VITE_API_URL=/api` para desenvolvimento local.
- `.env.production`: URL pública do backend Chico Talhão.
- `vite.config.ts`: proxy local de `/api` para o Render.

## Verificação

```bash
cd frontend
npm test -- --run
npm run build
```

## Funcionalidades mantidas

- autenticação e encerramento de sessão;
- mapa e resumo climático;
- histórico de leituras;
- alertas;
- lotes, culturas e dispositivos;
- mercado e logística;
- administração de usuários.

Telas e chamadas que não possuem endpoint correspondente no backend Chico Talhão foram removidas.
