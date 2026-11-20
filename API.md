# Integração com a API — Campo Vivo

O front-end já faz todas as chamadas por `api/client.js`. Para ligar na sua API:

1. Abra o painel de ajustes do protótipo, desative **useMockApi** e informe **apiBaseUrl** (ou edite `CONFIG` em `api/client.js`).
2. Se os nomes dos campos da sua API forem diferentes, ajuste só os adaptadores em `MAP` (`toUI` = API → tela, `toAPI` = tela → API).
3. Enquanto `mock: true`, nenhuma requisição é feita e a tela usa os dados de demonstração.

## Convenções

- JSON em `snake_case`. Listas podem vir como `[...]` ou `{ "data": [...] }`.
- Datas em ISO 8601 (`2026-11-19T14:32:05Z`; datas simples `2026-12-05`).
- Autenticação: `Authorization: Bearer <token>`. Resposta `401` desloga o usuário automaticamente.
- Erros: corpo `{ "message": "texto para o usuário" }` — o texto aparece no formulário ou na faixa vermelha do topo.
- Geometria: talhões em GeoJSON `Polygon` (lon, lat). O cliente projeta para o mapa e faz o caminho inverso ao salvar.

## Fluxo de carregamento

| Momento | Chamadas |
|---|---|
| Login | `POST /auth/login` |
| Após login | propriedades, produtores, culturas, mercado, logística, rotas, usuários, auditoria, aplicação, série de mercado |
| Ao trocar de propriedade | talhões → sensores → histórico; janelas; resumo; alertas |
| A cada `pollMs` (5 s) | `GET /leituras/ultimas` |
| Filtros do Monitoramento | `GET /leituras` |
| Filtros do Mercado | `GET /mercado/serie` |
| Tela Alertas → propriedade | `GET /alertas` |

## Endpoints

### Autenticação
`POST /auth/login` — `{ "email", "senha" }` →
```json
{ "token": "eyJ...", "usuario": { "id": 1, "nome": "Marcos Ribeiro", "email": "marcos@santahelena.agr.br", "perfil": "Administrador" } }
```
`perfil` ∈ `Administrador | Produtor | Analista | Operador` e define o menu exibido.
`POST /auth/logout` · `GET /auth/me`

### Usuários — `GET | POST /usuarios`
```json
{ "id": 1, "nome": "", "cpf": "", "email": "", "telefone": "", "senha": "(só no POST)", "tipo_usuario": "Operador", "vinculo": "Fazenda Santa Helena", "status": "Ativo", "ultimo_acesso": "2026-11-19T14:00:00Z" }
```

### Produtores / empresas — `GET | POST /produtores`
```json
{ "id": 1, "razao_social": "", "cpf_cnpj": "", "telefone": "", "email": "", "cidade": "", "estado": "PE", "responsavel": "" }
```

### Propriedades — `GET | POST /propriedades`
```json
{ "id": 1, "nome": "", "produtor_nome": "", "municipio": "", "estado": "PE", "latitude": -9.39, "longitude": -40.50, "area_total": 1240, "status": "Ativa",
  "qtd_talhoes": 6, "qtd_sensores": 12, "culturas": ["Manga", "Uva"], "indice_saude": 76 }
```
Os quatro últimos campos são calculados pela API e só aparecem no GET.

### Culturas — `GET | POST /culturas`
```json
{ "id": 1, "nome": "Uva", "variedade": "Vitória", "temperatura_min": 20, "temperatura_max": 30, "umidade_min": 45, "umidade_max": 65, "ciclo_medio_dias": 120, "descricao": "" }
```

### Talhões / lotes — `GET /talhoes?propriedade_id=` · `POST /talhoes` · `PUT /talhoes/:id` · `DELETE /talhoes/:id`
```json
{ "id": 10, "codigo": "T-01", "nome": "Talhão Norte", "propriedade_id": 1, "cultura_nome": "Manga", "variedade": "Palmer",
  "data_plantio": "2026-07-12", "previsao_colheita": "2026-12-05", "situacao": "ativo",
  "estagio": "maturacao", "prioridade": "baixa", "motivo_prioridade": "", "indice_saude": 86,
  "poligono": { "type": "Polygon", "coordinates": [[[-40.51, -9.38], [-40.50, -9.38], [-40.50, -9.39], [-40.51, -9.39], [-40.51, -9.38]]] },
  "ultima_leitura": { "temperatura": 29.1, "umidade": 58, "umidade_solo": 43, "ph": 6.2 } }
```
`estagio` ∈ `poda_inducao | floracao | frutificacao | maturacao | colheita` · `prioridade` ∈ `alta | media | baixa`.

### Sensores — `GET /sensores?propriedade_id=` · `POST /sensores`
```json
{ "id": 5, "codigo": "SN-101", "tipo": "Estação climática", "propriedade_id": 1, "talhao_codigo": "T-01",
  "latitude": -9.385, "longitude": -40.505, "data_instalacao": "2026-03-10", "status": "online", "bateria": 82, "sinal_dbm": -71 }
```

### Leituras
`GET /leituras/ultimas?propriedade_id=` — uma linha por talhão:
```json
[{ "talhao_codigo": "T-01", "temperatura": 29.1, "umidade": 58, "umidade_solo": 43, "ph": 6.2, "registrada_em": "..." }]
```
`GET /leituras?propriedade_id=&talhao_codigo=&sensor_codigo=&inicio=&fim=` — ordem cronológica:
```json
[{ "sensor_codigo": "SN-101", "talhao_codigo": "T-01", "registrada_em": "...", "temperatura": 29.1, "umidade": 58, "umidade_solo": 43, "ph": 6.2 }]
```

### Dashboard — `GET /dashboard/resumo?propriedade_id=`
```json
{ "leituras_total": 18240, "leituras_hoje": 3456, "leituras_ultima_hora": 144 }
```

### Alertas — `GET /alertas?propriedade_id=` · `PATCH /alertas/:id/reconhecer`
```json
{ "id": 77, "severidade": "critico", "tipo": "temperatura", "titulo": "Temperatura acima do recomendado para o lote de uvas",
  "descricao": "", "talhao_codigo": "T-02", "talhao_nome": "Talhão Lagoa", "criado_em": "...", "reconhecido": false }
```
`severidade` ∈ `critico | atencao | info` · `tipo` ∈ `temperatura | umidade | umidade_solo | ph | sensor_offline | bateria`.

### Mercado
`GET | POST /mercado`
```json
{ "id": 1, "cultura": "Manga", "mercado_destino": "Roterdã (Países Baixos)", "preco_medio": 1.45, "moeda": "EUR/kg", "data_referencia": "2026-11-15", "demanda_estimada": "Alta" }
```
`GET /mercado/serie?cultura=&destino=&periodo=30d|90d|12m` → `[{ "data": "...", "preco": 4.8 }]`

### Logística
`GET | POST /logistica`
```json
{ "id": 1, "origem": "", "destino": "", "modal_transporte": "", "tempo_estimado": "14 h", "custo_estimado": "R$ 6.800", "empresa_transportadora": "", "situacao": "Ativa" }
```
`GET /rotas`
```json
{ "codigo": "RT-0412", "carga": "", "origem": "", "destino": "", "transportadora": "", "placa": "", "prazo": "...", "previsao_texto": "Chega em 6 h", "etapa": "em_transito", "atrasada": false }
```
`etapa` ∈ `carregamento | em_transito | inspecao | entregue`.

### Predições — `GET /predicoes/janelas?propriedade_id=`
```json
[{ "talhao_codigo": "T-01", "colheita_inicio": "2026-12-01", "colheita_fim": "2026-12-12", "exportacao_inicio": "2026-12-10", "exportacao_fim": "2026-12-24", "destino": "Roterdã (UE)", "motivo": "" }]
```

### Auditoria — `GET /auditoria`
```json
{ "data_hora": "...", "usuario_nome": "", "operacao": "cadastrou o sensor", "recurso": "SN-112", "ip": "177.38.12.4" }
```

### Monitoramento da aplicação — `GET /monitoramento/aplicacao`
```json
{ "disponibilidade": 99.94, "taxa_erros": 0.31, "falhas_ultima_hora": 12, "p95_ms": 182, "media_ms": 96, "rpm": 1284 }
```

## Ainda em dados de demonstração
Mesmo com a API ligada, estes blocos continuam com valores fixos: clima/previsão do tempo, oportunidades de mercado e fatores do modelo (Predições), gateways, planejamento de 7 dias (Alertas), cartões de logística, preço médio e mercados de destino da Visão geral, módulos e ocorrências da aba Aplicação. Cada um pode ganhar um endpoint seguindo o mesmo padrão em `client.js`.
