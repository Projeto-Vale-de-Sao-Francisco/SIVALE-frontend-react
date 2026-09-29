# SIVALE — Diagrama ER

Fonte da verdade: `prisma/schema.prisma`. Cole o bloco abaixo em https://mermaid.live para exportar PNG/SVG.

```mermaid
erDiagram
    usuario ||--o{ usuarioPropriedade : "vinculado a"
    propriedade ||--o{ usuarioPropriedade : "tem"
    propriedade ||--o{ talhao : "possui"
    propriedade ||--o{ operacaoLogistica : "origina"
    cultura ||--o{ talhao : "cultivada em"
    cultura ||--o{ valorMercado : "tem valores"
    talhao ||--o{ dispositivo : "monitorado por"
    talhao ||--o{ alerta : "recebe"
    talhao |o--o{ operacaoLogistica : "origem do lote"
    dispositivo ||--o{ sensor : "possui"
    dispositivo ||--o{ medicao : "gera"
    medicao |o--o{ alerta : "dispara"

    usuario {
        int id PK
        string nomeCompleto
        string cpf UK
        string email UK
        string telefone
        string senha "hash bcrypt"
        Perfil perfil "ADMINISTRADOR|GESTOR|TECNICO|PRODUTOR"
        string status
        datetime dataCadastro
    }
    propriedade {
        int id PK
        string nome
        string localizacao
        string municipio
        string estado
        float latitude
        float longitude
        float areaTotal
        string status
        datetime dataCadastro
    }
    usuarioPropriedade {
        int id PK
        int usuarioId FK
        int propriedadeId FK
        string status
        datetime dataAssociacao
    }
    cultura {
        int id PK
        string nome
        string variedade
        float temperaturaMin
        float temperaturaMax
        float umidadeMin
        float umidadeMax
        int cicloMedioDias
        string descricao
    }
    talhao {
        int id PK
        int propriedadeId FK
        int culturaId FK
        string nome
        string descricao
        float latitude
        float longitude
        float area
        date dataPlantio
        date previsaoColheita
        string status
    }
    dispositivo {
        int id PK
        int talhaoId FK
        string codigo UK
        string nome
        string tipo
        float latitude
        float longitude
        string status
        datetime dataInstalacao
    }
    sensor {
        int id PK
        int dispositivoId FK
        string tipo
        string unidadeMedida
        string status
    }
    medicao {
        int id PK
        int dispositivoId FK
        datetime dataHora
        float temperatura
        float umidade
        float umidadeSolo
        float luminosidade
        float precipitacao
    }
    alerta {
        int id PK
        int talhaoId FK
        int medicaoId FK
        string tipo
        NivelAlerta nivel "ATENCAO|CRITICO"
        string titulo
        string descricao
        datetime dataHora
        boolean visualizado
    }
    valorMercado {
        int id PK
        int culturaId FK
        string mercadoDestino
        float precoMedio
        string moeda
        date dataReferencia
        string demandaEstimada
        OrigemValor origem "MANUAL|ATUALIZACAO"
    }
    operacaoLogistica {
        int id PK
        int propriedadeId FK
        int talhaoId FK
        string origem
        string destino
        string modal
        date dataPrevista
        string tempoEstimado
        float custoEstimado
        string transportadora
        string situacao
    }
```

## Decisões de modelagem

- **Usuário ↔ Propriedade é N:N** por `usuarioPropriedade`. O papel vem de `usuario.perfil`. No MVP, TÉCNICO e PRODUTOR têm as mesmas permissões (V2: restrição por menor privilégio).
- **Talhão** é a área física; a cultura é atributo dele (`culturaId`). Latitude e longitude existem em Propriedade e Talhão (e no Dispositivo).
- **Medição** guarda temperatura e umidade coletadas juntas por dispositivo. Os campos extras são opcionais.
- **Alerta** nasce de uma medição fora da faixa da cultura do talhão (regra no service, sem tabela de regras no MVP).
- **valorMercado** guarda valores de mercado/exportação por cultura. `origem` diferencia cadastro manual de atualização pelo botão do site. Não há job agendado.
- **operacaoLogistica** guarda as informações logísticas (requisito 11).
