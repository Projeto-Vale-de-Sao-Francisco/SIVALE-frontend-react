# SIVALE — Endpoints da API REST

Base URL local: `http://localhost:3333`
Todas as rotas (exceto `/auth/*`) exigem header `Authorization: Bearer <token>`.

## Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/cadastro` | Cria um usuário (nome, cpf, email, senha, perfil, empresaId) |
| POST | `/auth/login` | Autentica e retorna `{ token, usuario }` |

## Usuários
| Método | Rota | Descrição |
|---|---|---|
| GET | `/usuarios` | Lista usuários (admin/gestor) |
| GET | `/usuarios/:id` | Detalhe |
| PATCH | `/usuarios/:id/status` | Ativa/inativa (admin) |

## Empresas / Propriedades / Culturas / Lotes / Sensores
CRUD padrão (`GET` lista e detalhe, `POST` cria, `PUT` atualiza, `DELETE` inativa):
`/empresas`, `/propriedades`, `/culturas`, `/lotes`, `/sensores`

Filtros por query string: `/propriedades?empresaId=1`, `/lotes?propriedadeId=1&culturaId=2`, `/sensores?loteId=1&status=ativo`

## Leituras de sensores (dados IoT)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/leituras` | Registra uma leitura `{ sensorId, temperatura, umidade }` e dispara verificação de alerta |
| GET | `/leituras` | Consulta com filtros `sensorId, loteId, propriedadeId, culturaId, inicio, fim, limite` |

## Mercado e Logística
| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/mercado` | Dados de preço/mercado por cultura |
| GET/POST | `/logistica` | Operações logísticas (origem, destino, modal, transportadora) |

## Dashboard
| Método | Rota | Descrição |
|---|---|---|
| GET | `/dashboard/resumo` | Indicadores atuais (temp/umidade atual e média, sensores ativos, leituras, alertas) |
| GET | `/dashboard/historico` | Série temporal de temperatura/umidade com filtros |

## Alertas
| Método | Rota | Descrição |
|---|---|---|
| GET | `/alertas` | Lista alertas, filtro `loteId`, `visualizado` |
| PATCH | `/alertas/:id/visualizar` | Marca alerta como visualizado |
