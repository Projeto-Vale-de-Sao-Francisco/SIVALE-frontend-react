# SIVALE — Arquitetura

## Visão geral

```
Sensor IoT (simulado) → API REST (Express) → Banco de Dados (SQLite/PostgreSQL)
                                ↓
                         Regras de Alerta
                                ↓
                    PWA React (Dashboard, Cadastros)
```

## Componentes

| Camada | Tecnologia | Papel |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript (PWA) | Login, dashboard, cadastros, gráficos (Recharts) |
| Backend | Node.js + Express + TypeScript | API REST, autenticação JWT, regras de alerta |
| Banco de dados | SQLite nativo (`node:sqlite`) | Persistência local; caminho de migração documentado para PostgreSQL |
| Simulador IoT | Script Node (`simulate.ts`) | Gera leituras de temperatura/umidade no lugar do ESP32 físico |

## Fluxo principal (requisito de integração da 1ª entrega)

1. O simulador (ou um ESP32 real futuramente) envia `POST /leituras` com `sensorId`, `temperatura`, `umidade`.
2. A API grava a leitura e roda `verificarAlerta()`, comparando com os limites da cultura do lote.
3. Fora da faixa → cria um registro em `alertas`.
4. O dashboard (`GET /dashboard/resumo` e `GET /dashboard/historico`) consome os dados agregados e exibe gráficos e indicadores.
5. Todo cadastro (usuários, propriedades, culturas, lotes, sensores, mercado, logística) passa pela mesma API REST autenticada por JWT.

## Decisão de banco de dados

O modelo de dados é o mesmo desenhado no ERD do projeto (empresas, usuários, propriedades, culturas, lotes, sensores, leituras, alertas, dados de mercado, operações logísticas). Para rodar localmente sem dependências externas, o backend usa o módulo nativo `node:sqlite` do Node 22 (arquivo `sivale.db`). Para a 2ª entrega (banco em nuvem), a camada `src/lib/db.ts` deve ser substituída por um driver PostgreSQL (`pg` ou Prisma apontando para AWS RDS) — os mapeadores de resposta (`mapUsuario`, `mapPropriedade` etc.) e as rotas continuam iguais, pois já retornam objetos no formato final da API.

## Autenticação e perfis

- Login gera um JWT (`Authorization: Bearer <token>`), válido por 8h.
- Perfis: `ADMINISTRADOR`, `GESTOR`, `TECNICO`, `PRODUTOR` (conforme PDF de modelagem entregue). No MVP, técnico e produtor têm as mesmas permissões — a restrição fina fica para a 2ª entrega (RBAC completo).

## Alertas automáticos

Cada leitura é comparada aos limites de temperatura/umidade cadastrados na cultura do lote. Fora da faixa, um alerta é criado automaticamente (sem intervenção manual), atendendo ao requisito 14.
