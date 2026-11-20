import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Tooltip, Rectangle, useMap, useMapEvents, ScaleControl } from 'react-leaflet';
import { centroid, boundsOf, areaHa } from '../../lib/geo.js';
import { f1, cultColor, PRIO_COLOR, PRIO_LABEL } from '../../lib/format.js';

export const LAYERS = {
  sat: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagens &copy; Esri, Maxar, Earthstar Geographics',
    maxNativeZoom: 18,
    labels: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
  },
  map: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxNativeZoom: 19
  }
};

/** Cor do talhão por modo de visualização (mesma regra do protótipo). */
export function tColor(t, mode, l, sel) {
  if (mode === 'telemetria') return sel ? { fill: '#5FBF3E', stroke: '#fff', op: 0.62 } : { fill: '#F07A2A', stroke: '#F58A3A', op: 0.42 };
  if (mode === 'umidade') { const h = 45 + Math.max(0, Math.min(1, (l.hum - 35) / 40)) * 165; return { fill: `hsl(${h} 70% 52%)`, stroke: `hsl(${h} 80% 70%)`, op: 0.5 }; }
  if (mode === 'temperatura') { const h = 130 - Math.max(0, Math.min(1, (l.temp - 24) / 9)) * 125; return { fill: `hsl(${h} 75% 50%)`, stroke: `hsl(${h} 85% 68%)`, op: 0.5 }; }
  if (mode === 'prioridade') { const c = PRIO_COLOR[t.prio] || '#3FA34D'; return { fill: c, stroke: c, op: 0.45 }; }
  if (mode === 'cultura') { const c = cultColor(t.cultura); return { fill: c, stroke: c, op: 0.45 }; }
  return { fill: '#E8C547', stroke: '#F2D46A', op: 0.36 };
}

const subOf = (t, mode, l) =>
  mode === 'umidade' ? 'Umidade ' + f1(l.hum, 0) + '%'
    : mode === 'temperatura' ? 'Temperatura ' + f1(l.temp) + ' °C'
      : mode === 'prioridade' ? 'Prioridade ' + (PRIO_LABEL[t.prio] || '').toLowerCase()
        : mode === 'cultura' ? t.cultura
          : 'Monitoramento ativo';

const labelIcon = (t, mode, l, mini) => L.divIcon({
  className: 'tal-label' + (mini ? ' mini' : ''),
  iconSize: [0, 0],
  html: `<div class="in"><span class="ms">wifi</span><b>${t.id} · ${escapeHtml(t.nome)}</b><small>${subOf(t, mode, l)}</small></div>`
});
const sensorIcon = off => L.divIcon({ className: 'sensor-pin' + (off ? ' off' : ''), iconSize: [20, 20], iconAnchor: [10, 10], html: '<div class="pin"><i></i></div>' });
const draftIcon = (i, first) => L.divIcon({ className: 'draft-pt' + (first ? ' first' : ''), iconSize: [22, 22], iconAnchor: [11, 11], html: `<div class="p">${i + 1}</div>` });

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Enquadra a propriedade ao trocar de fazenda e reage a pedidos de foco. */
function Framer({ T, farm, focus, padding }) {
  const map = useMap();
  const farmId = farm && farm.id;
  const fit = () => {
    const b = boundsOf(T.map(t => t.pts));
    if (b) map.fitBounds(b, { padding: [padding, padding], maxZoom: 17 });
    else if (farm && isFinite(farm.lat) && isFinite(farm.lng)) map.setView([farm.lat, farm.lng], 15);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fit(); }, [farmId]);
  useEffect(() => {
    if (!focus) return;
    if (focus.tal) {
      const t = T.find(x => x.id === focus.tal);
      if (t) map.flyToBounds(boundsOf([t.pts]), { padding: [80, 80], maxZoom: 17, duration: 0.7 });
    } else if (focus.reset || focus.farm) fit();
  }, [focus && focus.n]); // eslint-disable-line react-hooks/exhaustive-deps
  // recalcula o tamanho quando o contêiner muda (layout responsivo, tela cheia)
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

/** Classe de zoom no contêiner: esconde/encolhe rótulos quando o mapa está afastado. */
function ZoomClass({ T }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const upd = () => {
      const z = map.getZoom();
      // largura média dos talhões em pixels decide o nível de detalhe dos rótulos
      let w = 0;
      T.forEach(t => {
        const lngs = t.pts.map(p => p[1]);
        const a = map.latLngToContainerPoint([t.pts[0][0], Math.min(...lngs)]);
        const b = map.latLngToContainerPoint([t.pts[0][0], Math.max(...lngs)]);
        w += Math.abs(b.x - a.x);
      });
      w = T.length ? w / T.length : 999;
      el.classList.toggle('lbl-sm', w < 150);
      el.classList.toggle('lbl-xs', w < 90);
      el.classList.toggle('lbl-none', w < 45 || z < 12);
    };
    upd();
    map.on('zoomend resize', upd);
    return () => map.off('zoomend resize', upd);
  }, [map, T]);
  return null;
}

function Ready({ onReady }) {
  const map = useMap();
  useEffect(() => { onReady && onReady(map); }, [map, onReady]);
  return null;
}

function DrawClicks({ active, onAdd }) {
  const map = useMapEvents({ click: e => active && onAdd([+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)]) });
  useEffect(() => {
    map.getContainer().style.cursor = active ? 'crosshair' : '';
    if (active) map.doubleClickZoom.disable(); else map.doubleClickZoom.enable();
  }, [active, map]);
  return null;
}

/**
 * Mapa real da propriedade.
 * props: T, lives, mode, sel, onSelect, sensors, farm, layer, focus, mini, hover,
 *        drawing { pts, closed, onAdd, onClose }, scrollZoom, zoomControl, scale, onReady, children
 */
export default function FarmMap({
  T, lives, mode = 'telemetria', sel, onSelect, sensors, farm, layer = 'sat', focus, mini, hover = true,
  drawing, scrollZoom = true, zoomControl = false, scale = false, onReady, children, className = '', style
}) {
  const lay = LAYERS[layer] || LAYERS.sat;
  const center = useMemo(() => {
    const b = boundsOf(T.map(t => t.pts));
    if (b) return [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
    return farm && isFinite(farm.lat) ? [farm.lat, farm.lng] : [-9.39, -40.5];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const isDrawing = !!(drawing && drawing.pts);
  const canAdd = isDrawing && !drawing.closed;

  return (
    <div className={'map-box ' + className} style={style}>
      <MapContainer center={center} zoom={15} maxZoom={19} zoomControl={zoomControl} scrollWheelZoom={scrollZoom} attributionControl preferCanvas={false} style={{ position: 'absolute', inset: 0 }}>
        <TileLayer key={layer} url={lay.url} attribution={lay.attribution} maxNativeZoom={lay.maxNativeZoom} maxZoom={19} />
        {layer === 'sat' && !mini && <TileLayer key="lbl" url={LAYERS.sat.labels} maxNativeZoom={18} maxZoom={19} opacity={0.85} />}
        {scale && <ScaleControl position="bottomleft" imperial={false} />}
        <Framer T={T} farm={farm} focus={focus} padding={mini ? 24 : 60} />
        <ZoomClass T={T} />
        {onReady && <Ready onReady={onReady} />}
        <DrawClicks active={canAdd} onAdd={drawing ? drawing.onAdd : () => {}} />

        {T.map((t, i) => {
          const l = (lives && lives[i]) || t;
          const isSel = sel === t.id;
          const col = tColor(t, mode, l, isSel);
          const c = centroid(t.pts);
          return (
            <Fragment key={t.id}>
            <Polygon
              key={t.id + ':' + mode + ':' + (isSel ? 1 : 0)}
              positions={t.pts}
              interactive={!isDrawing}
              pathOptions={{ color: isSel ? '#fff' : col.stroke, weight: isSel ? 3.5 : 2, fillColor: col.fill, fillOpacity: col.op, lineJoin: 'round', dashArray: isSel && mode !== 'telemetria' ? '6 4' : undefined }}
              eventHandlers={onSelect && !isDrawing ? { click: e => { L.DomEvent.stopPropagation(e); onSelect(t.id); } } : undefined}
            >
              {hover && !isDrawing && (
                <Tooltip sticky className="lf-card" direction="top" offset={[0, -12]} opacity={1}>
                  <div className="in">
                    <b>{t.id} · {t.nome}</b>
                    <small>{t.cultura}{t.variedade ? ' ' + t.variedade : ''} · {f1(areaHa(t.pts))} ha</small>
                    <div><span>Temperatura</span><span>{f1(l.temp)} °C</span></div>
                    <div><span>Umidade</span><span>{f1(l.hum, 0)}%</span></div>
                    <div><span>Umidade do solo</span><span>{f1(l.solo, 0)} kPa</span></div>
                    <div><span>Prioridade</span><span>{PRIO_LABEL[t.prio]}</span></div>
                  </div>
                </Tooltip>
              )}
            </Polygon>
            <LabelMarker pos={c} icon={labelIcon(t, mode, l, mini)} />
            </Fragment>
          );
        })}

        {sensors && !isDrawing && sensors.map(sn => (
          <Marker key={sn.id} position={[sn.lat, sn.lng]} icon={sensorIcon(sn.off)}>
            <Tooltip className="lf-card" direction="top" offset={[0, -10]} opacity={1}>
              <div className="in">
                <b>{sn.id}</b>
                <small>{sn.tipo} · {sn.talId}</small>
                <div><span>Status</span><span>{sn.off ? 'Offline' : 'Online'}</span></div>
                <div><span>Bateria</span><span>{sn.bat}%</span></div>
                <div><span>Sinal</span><span>{sn.off ? '—' : sn.sinal + ' dBm'}</span></div>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {isDrawing && drawing.pts.length > 0 && (
          <>
            {drawing.closed
              ? <Polygon positions={drawing.pts} interactive={false} pathOptions={{ color: '#fff', weight: 2.5, fillColor: '#EE6A1F', fillOpacity: 0.32 }} />
              : <Polyline positions={drawing.pts} interactive={false} pathOptions={{ color: '#fff', weight: 2.5, dashArray: '7 6' }} />}
            {drawing.pts.map((p, i) => {
              const first = i === 0 && !drawing.closed && drawing.pts.length >= 3;
              return (
                <Marker key={i + ':' + (first ? 1 : 0)} position={p} icon={draftIcon(i, first)} interactive={first}
                  eventHandlers={first ? { click: e => { L.DomEvent.stopPropagation(e); drawing.onClose(); } } : undefined} />
              );
            })}
          </>
        )}
      </MapContainer>
      {children}
    </div>
  );
}

// marcador de rótulo não interativo, posicionado no centro do talhão
function LabelMarker({ pos, icon }) {
  return <Marker position={pos} icon={icon} interactive={false} keyboard={false} />;
}

/** Minimapa sincronizado com um mapa principal, mostrando o retângulo da área visível. */
export function MiniMap({ main, layer = 'sat' }) {
  const [view, setView] = useState(null);
  useEffect(() => {
    if (!main) return;
    const upd = () => setView({ c: main.getCenter(), z: Math.max(3, main.getZoom() - 4), b: main.getBounds() });
    upd();
    main.on('move zoom resize', upd);
    return () => main.off('move zoom resize', upd);
  }, [main]);
  const lay = LAYERS[layer] || LAYERS.sat;
  if (!view) return <div className="mm-wrap" />;
  return (
    <div className="mm-wrap">
      <MapContainer center={view.c} zoom={view.z} zoomControl={false} attributionControl={false} dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} boxZoom={false} keyboard={false}>
        <TileLayer key={layer} url={lay.url} maxNativeZoom={lay.maxNativeZoom} />
        <MiniSync view={view} />
        <Rectangle bounds={view.b} pathOptions={{ color: '#fff', weight: 1.5, fillOpacity: 0.08 }} interactive={false} />
      </MapContainer>
    </div>
  );
}
function MiniSync({ view }) {
  const map = useMap();
  const last = useRef('');
  useEffect(() => {
    const k = view.c.lat.toFixed(5) + view.c.lng.toFixed(5) + view.z;
    if (k !== last.current) { last.current = k; map.setView(view.c, view.z, { animate: false }); }
  }, [view, map]);
  return null;
}
