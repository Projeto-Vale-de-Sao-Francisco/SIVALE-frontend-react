# SIVALE — Modelo de Banco de Dados

Baseado no ERD original do projeto (arquivo BANCO_-_VSF), simplificado para o escopo da 1ª entrega.

## Tabelas

- **empresas** — produtores/empresas exportadoras (razão social, CNPJ, cidade, estado)
- **usuarios** — login, perfil (ADMINISTRADOR/GESTOR/TECNICO/PRODUTOR), vínculo com empresa
- **propriedades** — fazendas, vinculadas a uma empresa
- **culturas** — manga, uva etc., com faixas de temperatura/umidade recomendadas
- **lotes** — talhões/áreas de produção dentro de uma propriedade, vinculados a uma cultura
- **sensores** — dispositivos IoT (simulados), vinculados a um lote
- **leituras_sensor** — temperatura/umidade coletadas por sensor, com data/hora
- **dados_mercado** — preço médio, mercado de destino e demanda por cultura
- **operacoes_logisticas** — origem/destino/modal/transportadora por lote
- **alertas** — gerados automaticamente quando uma leitura sai da faixa da cultura

## Relacionamentos

```
Empresa 1───N Propriedade 1───N Lote N───1 Cultura
                                  │
                                  1───N Sensor 1───N LeituraSensor
                                  │
                                  1───N Alerta
Empresa 1───N Usuario
Empresa 1───N OperacaoLogistica N───1(opcional) Lote
Cultura 1───N DadoMercado
```

## Evolução prevista (2ª entrega)

- Tabela associativa `usuario_propriedade` (N:N) para RBAC fino por propriedade.
- Tabelas `recomendacao_colheita` e `recomendacao_exportacao` (Data Science / IA).
- Migração de SQLite para PostgreSQL em nuvem (AWS RDS), mantendo o mesmo desenho lógico.
