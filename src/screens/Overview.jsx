import { useState } from 'react';
import { useApp } from '../state/store.jsx';
import { Icon, Badge, DataTable, LineChart } from '../components/ui/index.jsx';
import FarmMap from '../components/map/FarmMap.jsx';
import { f1, cultColor, st, timeAgo, PRIO_COLOR, PRIO_LABEL, PRIO_ORDER } from '../lib/format.js';
import { areaHa } from '../lib/geo.js';
import { stOf } from '../state/model.js';
import { JANELAS, MARKET_BASE, mockAlerts } from '../data/mock.js';

export function Kpi({ label, icon, val, unit, l1, v1, l2, v2 }) {
  return (
    <div className="kpi">
      <div className="lbl"><span>{label}</span><Icon n={icon} /></div>
      <div className="vals" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div className="big">{val}<small>{unit}</small></div>
        {l1 && <div className="mm"><span>{l1}</span><span>{v1}</span><span>{l2}</span><span>{v2}</span></div>}
      </div>
    </div>
  );
}

const dts = d => { const x = new Date(2026, 10, 23 + d); return String(x.getDate()).padStart(2, '0') + ' ' + ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][x.getMonth()]; };
export const janelaOf = (S, t, i) => (S.apiJanelas || JANELAS)[t.id] || [14 + (i % 5) * 6, 26 + (i % 5) * 6, 20 + (i % 5) * 6, 34 + (i % 5) * 6, 'A definir', 'Aguardando leituras suficientes para recomendar'];
export const fmtJanela = j => ({ colTxt: dts(j[0]) + ' – ' + dts(j[1]), expTxt: dts(j[2]) + ' – ' + dts(j[3]) });

export default function Overview() {
  const { S, M, A, set } = useApp();
  const { T, lives, sens, online } = M;
  const [hovBar, setHovBar] = useState(null);
  const has = T.length > 0;
  const avg = k => (has ? lives.reduce((a, l) => a + l[k], 0) / lives.length : null);
  const mx = k => (has ? Math.max(...lives.map(l => l[k])) : null);
  const mn = k => (has ? Math.min(...lives.map(l => l[k])) : null);
  const t0 = lives[0] || {};
  const RS = S.apiResumo;
  const leit = RS ? RS.leituras_total : 18240 + S.tick * 12;
  const lowBat = sens.filter(x => !x.off && x.bat < 20).length;

  const kpis = [
    { label: 'Temperatura atual', icon: 'device_thermostat', val: f1(t0.temp), unit: '°C', l1: 'Média', v1: f1(avg('temp')) + '°', l2: 'Máx', v2: f1(mx('temp')) + '°' },
    { label: 'Umidade atual', icon: 'humidity_percentage', val: f1(t0.hum, 0), unit: '%', l1: 'Média', v1: f1(avg('hum'), 0) + '%', l2: 'Mín', v2: f1(mn('hum'), 0) + '%' },
    { label: 'Umidade do solo', icon: 'water_drop', val: f1(avg('solo'), 0), unit: 'kPa', l1: 'Máx', v1: f1(mx('solo'), 0), l2: 'Mín', v2: f1(mn('solo'), 0) },
    { label: 'Sensores ativos', icon: 'sensors', val: String(online), unit: '/' + sens.length, l1: 'Bat. baixa', v1: String(lowBat), l2: 'Offline', v2: String(sens.length - online) },
    { label: 'Leituras registradas', icon: 'database', val: leit.toLocaleString('pt-BR'), unit: '', l1: 'Hoje', v1: (RS ? RS.leituras_hoje : 3456 + S.tick * 12).toLocaleString('pt-BR'), l2: 'Última h', v2: String(RS ? RS.leituras_ultima_hora : 144) }
  ];

  const totA = T.reduce((a, t) => a + areaHa(t.pts), 0) || 1;
  const prioSum = ['alta', 'media', 'baixa'].map(k => { const L = T.filter(t => t.prio === k), ha = L.reduce((a, t) => a + areaHa(t.pts), 0); return { k, label: PRIO_LABEL[k], color: PRIO_COLOR[k], n: L.length, unit: L.length === 1 ? 'talhão' : 'talhões', area: f1(ha) + ' ha', pct: Math.round((ha / totA) * 100) + '%', ids: L.length ? L.map(t => t.id).join(', ') : 'Nenhum talhão' }; });
  const prioList = [...T].sort((a, b) => PRIO_ORDER[a.prio] - PRIO_ORDER[b.prio]).slice(0, 4);
  const worst = prioList[0];

  const soilBars = Array.from({ length: 24 }, (_, i) => { const v = 41 + Math.sin(i / 3.2) * 6 + Math.sin(i * 1.3) * 2.2 - (i > 11 && i < 16 ? 5 : 0); return { v, h: (((v - 20) / 35) * 100).toFixed(0) + '%', c: v < 35 ? '#D8452E' : v < 40 ? '#EE8A1F' : v <= 48 ? '#3FA34D' : '#2F7BC4', t: String(i).padStart(2, '0') + ':00 · ' + (v < 35 ? 'seco' : v < 40 ? 'atenção' : v <= 48 ? 'ideal' : 'úmido') }; });
  const readings = sens.filter(x => !x.off).slice(0, 7).map((sn, i) => { const ti = T.indexOf(sn.tal), l = lives[ti], s2 = stOf(l); return { hora: timeAgo(i * 37 + (S.tick % 3) * 3), sensor: sn.id, tal: sn.tal.id + ' · ' + sn.tal.nome, hum: f1(l.hum, 0) + '%', temp: f1(l.temp) + ' °C', solo: f1(l.solo, 0) + ' kPa', ph: f1(l.ph), status: s2[0], k: s2[1] }; });

  const propSit = M.fazendasView.map(x => { const al = mockAlerts(x.id).filter(a => a.sev === 'crit' && !M.isAcked(a)).length; return { ...x, al, k: al > 1 ? 'crit' : al ? 'warn' : 'ok' }; });
  const proxCol = T.map((t, i) => ({ t, j: janelaOf(S, t, i) })).sort((a, b) => a.j[0] - b.j[0]).slice(0, 4);
  const precoMed = Object.keys(MARKET_BASE).map((k, i) => { const v = [2.4, -1.1, 0.8, 3.2][i % 4]; return { nome: k, preco: 'R$ ' + MARKET_BASE[k][0].toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + '/kg', v: (v > 0 ? '+' : '') + f1(v) + '%', vc: v >= 0 ? '#2B7A3D' : '#B3321F' }; });
  const destinos = [['Roterdã (UE)', 38], ['Filadélfia (EUA)', 22], ['Londres (UK)', 16], ['CEAGESP (SP)', 14], ['Nordeste (interno)', 10]];

  return (
    <div className="stack" data-screen-label="Visão geral">
      <div className="grid-kpi">{kpis.map(k => <Kpi key={k.label} {...k} />)}</div>

      <div className="grid-2">
        <div className="card pad">
          <div className="card-h">
            <div className="tblock"><h3 className="ttl">Mapa de prioridade</h3><span className="sub">Talhões ordenados pela urgência de intervenção</span></div>
            <div className="legend">{['alta', 'media', 'baixa'].map(k => <span key={k}><i className="sw" style={{ background: PRIO_COLOR[k] }} />{PRIO_LABEL[k]}</span>)}</div>
          </div>
          <FarmMap T={T} lives={lives} mode="prioridade" farm={M.farm} layer={S.mapLayer} scrollZoom={false} zoomControl mini focus={S.focus}
            onSelect={id => { A.focusTal(id); A.go('mapa'); }} style={{ minHeight: 340, flex: 1, borderRadius: 14 }}>
            <button className="btn btn-ghost map-ctrl" onClick={() => A.go('mapa')} style={{ right: 12, bottom: 22, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,.18)' }}><Icon n="open_in_full" size={17} />Abrir mapa</button>
          </FarmMap>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
            {prioSum.map(p => (
              <div key={p.k} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 12, background: 'var(--soft)', minWidth: 0 }}>
                <div className="between wrap" style={{ gap: '2px 6px' }}><span className="row" style={{ gap: 6, fontSize: 12.5, color: 'var(--ink2)' }}><i className="sw" style={{ width: 9, height: 9, background: p.color }} />{p.label}</span><span style={{ fontSize: 11.5, color: 'var(--muted2)' }}>{p.area}</span></div>
                <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>{p.n} <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--muted)', letterSpacing: 0 }}>{p.unit}</span></span>
                <div className="bar" style={{ flex: 'none', height: 5 }}><i style={{ width: p.pct, background: p.color }} /></div>
                <span style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>{p.ids}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="card pad">
            <div className="between"><span className="row" style={{ fontSize: 13, color: 'var(--ink2)' }}><Icon n="partly_cloudy_day" size={20} />Clima · {M.farm.mun}</span><Badge k="ok">Parcialmente nublado</Badge></div>
            <div className="between tnum" style={{ fontSize: 11.5, color: 'var(--muted2)', padding: '0 2px' }}><span>25°</span><span>27°</span><span style={{ fontSize: 30, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>29°</span><span>31°</span><span>33°</span></div>
            <div style={{ position: 'relative', height: 30, borderRadius: 9, background: 'linear-gradient(90deg,#7ACB62,#C3D95A 42%,#F1BE4C 66%,#E5583B)' }}>
              <div style={{ position: 'absolute', left: '50%', top: -6, bottom: -6, width: 5, marginLeft: -2.5, borderRadius: 3, background: '#fff', boxShadow: '0 0 0 1px rgba(0,0,0,.15)' }} />
            </div>
            <div className="between" style={{ fontSize: 11.5, color: 'var(--muted2)' }}><span>09h</span><span>11h</span><span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--ink)', color: '#fff', fontWeight: 600 }}>13h</span><span>15h</span><span>17h</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              <div className="soft-box"><span className="k">Índice UV</span><span className="v">06</span></div>
              <div className="soft-box"><span className="k">Vento</span><span className="v">14<small style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}> km/h</small></span></div>
              <div className="soft-box"><span className="k">Chuva</span><span className="v">20<small style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>%</small></span></div>
            </div>
          </div>
          <div className="card" style={{ padding: '6px 0', display: 'flex', flexDirection: 'column' }}>
            {prioList.map(t => (
              <button key={t.id} className="list-btn" style={{ padding: '11px 18px' }} onClick={() => { A.focusTal(t.id); A.go('mapa'); }}>
                <span style={{ width: 8, alignSelf: 'stretch', borderRadius: 4, background: PRIO_COLOR[t.prio], flex: 'none' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}><span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.id} · {t.nome}</span><span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.reason || 'Talhão novo, aguardando leituras'}</span></div>
                <span style={{ fontSize: 12, fontWeight: 600, color: PRIO_COLOR[t.prio] }}>{PRIO_LABEL[t.prio]}</span>
              </button>
            ))}
            {!prioList.length && <span className="empty">Nenhum talhão cadastrado nesta propriedade.</span>}
          </div>
          {S.toggles.ia && worst && (
            <div className="ai-box">
              <span className="row" style={{ alignSelf: 'flex-start', gap: 6, fontSize: 12, fontWeight: 600 }}><span className="ai-tag">IA</span>Recomendação</span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, textWrap: 'pretty' }}>
                {worst.prio === 'alta'
                  ? `Priorizar o ${worst.id} (${worst.cultura}${worst.variedade ? ' ' + worst.variedade : ''}) nas próximas 24 h: ${worst.reason.charAt(0).toLowerCase() + worst.reason.slice(1)}. Irrigar 12 mm nas horas mais frescas e acompanhar as leituras.`
                  : 'Todos os talhões estão dentro das faixas recomendadas. Manter o manejo atual e revisar as leituras no fim do dia.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card pad">
          <div className="between"><h3 className="ttl">Umidade do solo · 24 h</h3><span className="sub" style={{ fontSize: 12 }}>média dos talhões, kPa</span></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 150, paddingTop: 6, borderBottom: '1px solid var(--line2)' }}>
            {soilBars.map((b, i) => (
              <div key={i} onMouseEnter={() => setHovBar(i)} onMouseLeave={() => setHovBar(null)} onClick={() => setHovBar(hovBar === i ? null : i)}
                style={{ position: 'relative', flex: 1, height: b.h, background: b.c, borderRadius: '4px 4px 2px 2px', minWidth: 3, opacity: hovBar == null || hovBar === i ? 1 : 0.45, cursor: 'default' }}>
                {hovBar === i && <span style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: `translateX(${i < 3 ? '-15%' : i > 20 ? '-85%' : '-50%'})`, whiteSpace: 'nowrap', background: 'var(--dark)', color: '#fff', borderRadius: 8, padding: '6px 9px', fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 5, pointerEvents: 'none' }}><b style={{ fontWeight: 600 }}>{f1(b.v, 0)} kPa</b><span style={{ opacity: 0.75 }}>{b.t}</span></span>}
              </div>
            ))}
          </div>
          <div className="axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
          <div className="legend"><span><i className="sw" style={{ background: '#D8452E' }} />&lt; 35 seco</span><span><i className="sw" style={{ background: '#EE8A1F' }} />35–40</span><span><i className="sw" style={{ background: '#3FA34D' }} />40–48 ideal</span><span><i className="sw" style={{ background: '#2F7BC4' }} />&gt; 48 úmido</span></div>
        </div>
        <div className="card pad">
          <div className="between"><h3 className="ttl">Temperatura · 7 dias</h3>
            <div className="legend"><span><i className="sw line" style={{ background: '#EE6A1F' }} />Máx</span><span><i className="sw line" style={{ background: '#3FA34D' }} />Mín</span></div>
          </div>
          <div style={{ height: 156 }}><LineChart h={156} min={16} max={35} fmt={v => f1(v) + ' °C'} labels={i => ['Qui', 'Sex', 'Sáb', 'Dom', 'Seg', 'Ter', 'Qua'][i]} series={[{ v: [31.2, 32.4, 30.8, 29.6, 31.9, 33.1, 32.2], color: '#EE6A1F', area: true }, { v: [19.4, 20.1, 19.8, 18.6, 20.4, 21.2, 20.6], color: '#3FA34D' }]} /></div>
          <div className="axis"><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span></div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card pad" style={{ gap: 12 }}>
          <h3 className="ttl">Situação das propriedades</h3>
          {propSit.map((p, i) => (
            <button key={p.id ?? i} className="between" onClick={() => A.selectFarm(i)} style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--soft)', border: i === S.farm ? '1.5px solid var(--green)' : '1.5px solid transparent', cursor: 'pointer', textAlign: 'left' }}>
              <div className="tblock"><span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.nome}</span><span style={{ fontSize: 12, color: 'var(--muted)' }}>{p.mun}, {p.uf} · {p.talhoes} talhões · {p.sens} sensores</span></div>
              <Badge k={p.k}>{p.al ? p.al + ' alertas críticos' : 'Normal'}</Badge>
            </button>
          ))}
        </div>
        <div className="card pad" style={{ gap: 12 }}>
          <div className="between"><h3 className="ttl">Próximas colheitas</h3>{M.acc.ia > 0 && <button className="btn-link" onClick={() => A.go('ia')}>Ver janelas</button>}</div>
          {proxCol.map(({ t, j }) => { const f = fmtJanela(j); return (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '10px 1fr auto', gap: 10, alignItems: 'center' }}>
              <span className="cdot" style={{ width: 10, height: 10, background: cultColor(t.cultura) }} />
              <div className="tblock" style={{ gap: 1 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{t.id} · {t.cultura}{t.variedade ? ' · ' + t.variedade : ''}</span><span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Exportação {f.expTxt} · {j[4]}</span></div>
              <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{f.colTxt}</span>
            </div>
          ); })}
          {!proxCol.length && <span className="empty">Sem talhões cadastrados.</span>}
        </div>
        <div className="card pad" style={{ gap: 12 }}>
          <h3 className="ttl">Preço médio das culturas</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {precoMed.map(p => (
              <div key={p.nome} style={{ background: 'var(--soft)', borderRadius: 10, padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span className="row" style={{ gap: 6, fontSize: 12, color: 'var(--ink2)' }}><i className="cdot" style={{ width: 8, height: 8, background: cultColor(p.nome) }} />{p.nome}</span>
                <span className="tnum" style={{ fontSize: 14, fontWeight: 600 }}>{p.preco} <span style={{ fontSize: 11.5, color: p.vc }}>{p.v}</span></span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>Mercados de destino</span>
          {destinos.map(([n, p]) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: 'minmax(100px,130px) 1fr 34px', gap: 8, alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: 'var(--ink2)' }}>{n}</span><span className="bar"><i style={{ width: p + '%', background: '#EE8A1F' }} /></span><span style={{ textAlign: 'right', fontWeight: 600 }}>{p}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card clip">
        <div className="card-h pad">
          <div className="row" style={{ gap: 10 }}><h3 className="ttl">Últimas leituras</h3><Badge k="crit"><i style={{ width: 6, height: 6, borderRadius: '50%', background: '#D8452E' }} />Ao vivo</Badge></div>
          <button className="btn btn-ghost" onClick={() => A.go('mon')}>Ver histórico</button>
        </div>
        <DataTable minW={760} rows={readings} rowKey={r => r.sensor}
          onRow={r => { set({ monT: r.tal.split(' ')[0], monSens: 'Todos' }); A.go('mon'); }}
          cols={[
            { k: 'hora', label: 'Horário', w: '90px', render: r => <span className="c-soft tnum">{r.hora}</span> },
            { k: 'sensor', label: 'Sensor', w: '90px', render: r => <b style={{ fontWeight: 600 }}>{r.sensor}</b> },
            { k: 'tal', label: 'Talhão', w: 'minmax(140px,1.4fr)', wide: true },
            { k: 'hum', label: 'Umidade' }, { k: 'temp', label: 'Temp.' }, { k: 'solo', label: 'Solo' }, { k: 'ph', label: 'pH' },
            { k: 'status', label: 'Status', w: '100px', render: r => <Badge bg={st(r.k)[0]} fg={st(r.k)[1]}>{r.status}</Badge> }
          ]} />
      </div>
    </div>
  );
}
