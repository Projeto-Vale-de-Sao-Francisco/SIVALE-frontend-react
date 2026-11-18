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

Durante o desenvolvimento, o frontend usa `/api` e o proxy configurado no Vite encaminha as requisições para o backend no Render. Em produção, o rewrite do Vercel encaminha `/api` ao mesmo backend; o navegador mantém chamadas same-origin.

## Configuração

- `.env.example`: `VITE_API_URL=/api`; `VITE_API_URL` é configuração pública de roteamento, não segredo.
- Arquivos `.env` locais são ignorados pelo Git. Em deploy, configure qualquer `VITE_API_URL` não padrão nas variáveis do provedor.
- `vite.config.ts`: proxy local de `/api` para o Render.
- `vercel.json`: rewrite da API e headers CSP, HSTS, anti-clickjacking, MIME e referrer.

O arquivo `vercel.json` configura headers HSTS/CSP, mas isso não comprova HTTPS no domínio publicado; valide o domínio e o redirecionamento no provedor após o deploy. O login usa cookie `HttpOnly`, `SameSite=Strict` e não expõe JWT ao JavaScript. O navegador mantém somente ID, nome e perfil em `sessionStorage`; chamadas de API incluem credenciais e devem usar `/api` same-origin.

## Verificação

```bash
cd frontend
npm test -- --run
npm run build
```

Revisão de dependências (11/11/2026): foram atualizados React Router para 7.18.5,
Vite para 8.3.8, Vitest para 5.1.0 e `@vitejs/plugin-react` para 6.3.0 para corrigir
alertas de open redirect, desenvolvimento do Vite e execução de testes. `npm audit`
reportou zero vulnerabilidades após as atualizações.

## Funcionalidades mantidas

- autenticação e encerramento de sessão;
- mapa e resumo climático;
- histórico de leituras;
- alertas;
- lotes, culturas e dispositivos;
- mercado e logística;
- administração de usuários.
- consulta administrativa somente leitura dos registros de auditoria.

Telas e chamadas que não possuem endpoint correspondente no backend Chico Talhão foram removidas.
