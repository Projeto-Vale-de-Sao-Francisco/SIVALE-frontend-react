import { useApp } from '../state/store.jsx';
import { Icon, Badge, DataTable, LineChart, Seg, DropdownRow } from '../components/ui/index.jsx';
import { f1, cultColor, st, timeAgo, dateShort } from '../lib/format.js';
import { stOf } from '../state/model.js';

const UNIT = { hum: '%', temp: ' °C', solo: ' kPa', ph: '' };
const COLOR = { hum: '#2F7BC4', temp: '#EE6A1F', solo: '#2F8F46', ph: '#8A5A3C' };

export default function Monitor() {
  const { S, M, A, set } = useApp();
  const { T, lives, sens } = M;
  if (!T.length) return <div className="card"><div className="empty">Nenhum talhão cadastrado em {M.farm.nome}. {M.acc.tal === 2 && <button className="btn-link" onClick={A.startDraw}>Demarcar talhão</button>}</div></div>;

  const TF = S.monCult === 'Todas' ? T : T.filter(t => t.cultura === S.monCult);
  const TFx = TF.length ? TF : T;
  const mt = TFx.find(t => t.id === S.monT) || TFx[0];
  const mi = T.indexOf(mt);
  const ml = lives[mi];
  const ms = sens.filter(x => x.tal === mt);
  const msF = ms.filter(x => x.id === S.monSens).length ? ms.filter(x => x.id === S.monSens) : ms;

  const rng = (v, lo, hi, u) => (v < lo ? ['Abaixo da faixa ideal (' + lo + '–' + hi + u + ')', '#B3321F'] : v > hi ? ['Acima da faixa ideal (' + lo + '–' + hi + u + ')', '#B9561A'] : ['Dentro da faixa ideal (' + lo + '–' + hi + u + ')', '#2B7A3D']);
  const cards = [['Umidade do ar', 'humidity_percentage', f1(ml.hum, 0), '%', rng(ml.hum, 50, 75, '%')], ['Temperatura', 'device_thermostat', f1(ml.temp), '°C', rng(ml.temp, 20, 30, ' °C')], ['Umidade do solo', 'water_drop', f1(ml.solo, 0), 'kPa', rng(ml.solo, 38, 48, ' kPa')], ['pH do solo', 'science', f1(ml.ph), '', rng(ml.ph, 5.5, 6.8, '')]];

  const np = { '24h': 48, '7d': 42, '30d': 30 }[S.monPeriod];
  const amp = { hum: 9, temp: 4, solo: 5, ph: 0.15 }[S.monMetric];
  const base = mt[S.monMetric];
  const hv = S.apiHist && S.apiHist.length
    ? S.apiHist.map(r => r[S.monMetric]).filter(v => v != null)
    : Array.from({ length: np }, (_, i) => base + Math.sin((i / np) * Math.PI * (S.monPeriod === '24h' ? 2 : S.monPeriod === '7d' ? 14 : 4) + mi) * amp + Math.sin(i * 2.3 + mi) * amp * 0.25);
  const dd = S.monMetric === 'ph' || S.monMetric === 'temp' ? 1 : 0;
  const unit = UNIT[S.monMetric];
  const sum = hv.length ? { min: f1(Math.min(...hv), dd) + unit, avg: f1(hv.reduce((a, b) => a + b, 0) / hv.length, dd) + unit, max: f1(Math.max(...hv), dd) + unit } : { min: '—', avg: '—', max: '—' };

  // rótulos do eixo calculados a partir da data atual (o protótipo tinha datas fixas)
  const now = new Date();
  const back = (days) => { const d = new Date(now.getTime() - days * 86400000); return String(d.getDate()).padStart(2, '0') + ' ' + ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][d.getMonth()]; };
  const axis = { '24h': ['00:00', '06:00', '12:00', '18:00', 'Agora'], '7d': [back(6), back(4.5), back(3), back(1.5), 'Hoje'], '30d': [back(30), back(22), back(15), back(7), 'Hoje'] }[S.monPeriod];
  const span = { '24h': 24, '7d': 168, '30d': 720 }[S.monPeriod];
  const pointLabel = i => { const d = new Date(now.getTime() - ((hv.length - 1 - i) / Math.max(1, hv.length - 1)) * span * 3600000); return S.monPeriod === '24h' ? d.toTimeString().slice(0, 5) : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); };

  const logApi = S.apiHist && S.apiHist.length ? S.apiHist.slice(-8).reverse().map(r => { const s2 = stOf(r), sn = ms.find(x => x.id === r.sensor) || {}; return { key: r.data + r.sensor, hora: r.hora, sensor: r.sensor, tipo: sn.tipo || '—', hum: f1(r.hum, 0) + '%', temp: f1(r.temp) + ' °C', solo: f1(r.solo, 0) + ' kPa', ph: f1(r.ph), status: s2[0], k: s2[1] }; }) : null;
  const log = logApi || (msF.length ? Array.from({ length: 8 }, (_, i) => {
    const sn = msF[i % msF.length], k = S.tick - i;
    const l = { hum: mt.hum + Math.sin(k * 0.9 + mi) * 1.4, temp: mt.temp + Math.sin(k * 0.7 + mi * 2) * 0.4, solo: mt.solo + Math.sin(k * 0.5 + mi) * 0.8, ph: mt.ph + Math.sin(k * 0.3 + mi) * 0.04 };
    const s2 = sn.off ? ['Sem sinal', 'mute'] : stOf(l);
    return { key: i, hora: dateShort(new Date(Date.now() - i * 300000)) + ' ' + timeAgo(i * 300).slice(0, 5), sensor: sn.id, tipo: sn.tipo, hum: sn.off ? '—' : f1(l.hum, 0) + '%', temp: sn.off ? '—' : f1(l.temp) + ' °C', solo: sn.off ? '—' : f1(l.solo, 0) + ' kPa', ph: sn.off ? '—' : f1(l.ph), status: s2[0], k: s2[1] };
  }) : []);

  const ddDefs = [
    { id: 'mfarm', label: 'Propriedade', icon: 'agriculture', w: '210px', options: S.fazendas.map((x, i) => ({ v: i, label: x.nome })), value: S.farm, onChange: i => A.selectFarm(i, false) },
    { id: 'mcult', label: 'Cultura', icon: 'nutrition', w: '150px', options: ['Todas'].concat(S.culturas.map(c => c.nome)).map(v => ({ v, label: v, dot: v === 'Todas' ? '#C9CDC2' : cultColor(v) })), value: S.monCult, onChange: v => { const f = v === 'Todas' ? T : T.filter(t => t.cultura === v); set({ monCult: v, ...(f.length && !f.includes(mt) ? { monT: f[0].id, monSens: 'Todos' } : {}) }); } },
    { id: 'mtal', label: 'Talhão', icon: 'pentagon', w: '210px', options: TFx.map(t => ({ v: t.id, label: t.id + ' · ' + t.nome })), value: mt.id, onChange: v => set({ monT: v, monSens: 'Todos' }) },
    { id: 'msens', label: 'Sensor', icon: 'sensors', w: '150px', options: ['Todos'].concat(ms.map(x => x.id)).map(v => ({ v, label: v === 'Todos' ? 'Todos' : v + ' · ' + ms.find(x => x.id === v).tipo })), value: msF.length === ms.length ? 'Todos' : S.monSens, onChange: v => set({ monSens: v }) },
    { id: 'mper', label: 'Período', icon: 'calendar_month', w: '170px', options: [['24h', 'Últimas 24 horas'], ['7d', 'Últimos 7 dias'], ['30d', 'Últimos 30 dias']].map(x => ({ v: x[0], label: x[1] })), value: S.monPeriod, onChange: v => set({ monPeriod: v }) }
  ];

  return (
    <div className="stack" data-screen-label="Monitoramento">
      <DropdownRow defs={ddDefs} />
      {S.monCult !== 'Todas' && !TF.length && <div className="notice warn"><Icon n="info" />Nenhum talhão de {S.monCult} nesta propriedade — mostrando todos.</div>}
      <div className="grid-kpi">
        {cards.map(c => (
          <div key={c[0]} className="kpi">
            <div className="lbl">
              <span className="row" style={{ gap: 8, color: 'var(--ink2)' }}><Icon n={c[1]} size={17} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--soft3)', display: 'grid', placeItems: 'center' }} />{c[0]}</span>
              <span className="row hide-m" style={{ gap: 5, fontSize: 11, fontWeight: 600, color: '#B3321F' }}><i className="cdot" style={{ width: 6, height: 6, background: '#D8452E' }} />Ao vivo</span>
            </div>
            <div className="big" style={{ fontSize: 34 }}>{c[2]}<small>{c[3]}</small></div>
            <span style={{ fontSize: 12, color: c[4][1] }}>{c[4][0]}</span>
          </div>
        ))}
      </div>
      <div className="card pad">
        <div className="card-h">
          <div className="tblock"><h3 className="ttl">Histórico de leituras</h3><span className="sub">{mt.id} · {mt.nome} · {ms.length} sensores</span></div>
          <div className="row wrap">
            <Seg items={[{ v: 'hum', label: 'Umidade' }, { v: 'temp', label: 'Temperatura' }, { v: 'solo', label: 'Solo' }, { v: 'ph', label: 'pH' }]} value={S.monMetric} onChange={v => set({ monMetric: v })} />
            <Seg items={[{ v: '24h', label: '24 h' }, { v: '7d', label: '7 dias' }, { v: '30d', label: '30 dias' }]} value={S.monPeriod} onChange={v => set({ monPeriod: v })} />
          </div>
        </div>
        <div className="row wrap" style={{ gap: 16, fontSize: 13 }}><span>Mín <b className="tnum">{sum.min}</b></span><span>Média <b className="tnum">{sum.avg}</b></span><span>Máx <b className="tnum">{sum.max}</b></span></div>
        <div style={{ height: 230 }}><LineChart h={230} series={[{ v: hv, color: COLOR[S.monMetric], area: true }]} fmt={v => f1(v, dd) + unit} labels={pointLabel} /></div>
        <div className="axis">{axis.map(a => <span key={a}>{a}</span>)}</div>
      </div>
      <div className="card clip">
        <div className="card-h pad"><h3 className="ttl">Registro de leituras</h3></div>
        <DataTable minW={760} rows={log} rowKey={r => r.key} empty="Nenhum sensor neste talhão."
          cols={[
            { k: 'hora', label: 'Data/hora', w: '110px', render: r => <span className="c-soft tnum">{r.hora}</span> },
            { k: 'sensor', label: 'Sensor', w: '90px', render: r => <b style={{ fontWeight: 600 }}>{r.sensor}</b> },
            { k: 'tipo', label: 'Tipo', w: '160px', render: r => <span className="c-muted">{r.tipo}</span> },
            { k: 'hum', label: 'Umidade' }, { k: 'temp', label: 'Temp.' }, { k: 'solo', label: 'Solo' }, { k: 'ph', label: 'pH' },
            { k: 'status', label: 'Status', w: '100px', render: r => <Badge bg={st(r.k)[0]} fg={st(r.k)[1]}>{r.status}</Badge> }
          ]} />
      </div>
    </div>
  );
}
