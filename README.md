# Campo Vivo · Monitoramento Agrícola IoT (React + Vite)

Front-end do sistema de monitoramento agrícola, migrado do protótipo HTML para **React 18 + Vite 5**, com **mapa real (Leaflet + imagens de satélite Esri / OpenStreetMap)** e layout responsivo (desktop, tablet e celular). Também pode ser instalado como PWA (manifest incluso).

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera /dist
npm run preview    # serve o /dist
```

## API

Copie `.env.example` para `.env`:

```
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCK=true    # false = usa a API real
```

Os endpoints e os formatos estão em `API.md`. Os adaptadores ficam em `src/api/client.js` (objeto `MAP`).
Os talhões usam **GeoJSON real** (lon, lat). Agora o cliente só converte para [lat, lng], sem a projeção de pixels.

## Estrutura

```
src/
  api/client.js            cliente REST + adaptadores
  data/mock.js             dados de demonstração (3 fazendas com coordenadas reais)
  state/store.jsx          estado global, carregamento da API, ações
  state/model.js           valores derivados (talhões da fazenda, sensores, alertas, perfis)
  lib/geo.js               área geodésica, centroide, limites
  components/map/FarmMap   mapa Leaflet (satélite/ruas, rótulos, sensores, desenho, minimapa)
  components/ui            Seg, Dropdown, DataTable responsiva, LineChart, Dialog…
  components/layout        Sidebar, Header, navegação mobile
  components/overlays      cadastros, seletor de fazenda, notificações, exportação, sair
  screens/                 as 11 telas + login
```

## Perfis de demonstração
Na tela de login, escolha Administrador, Produtor, Analista ou Operador. No modo demo, qualquer senha funciona. O menu é filtrado pela matriz de acesso.
