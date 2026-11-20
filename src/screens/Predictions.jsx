import { useState } from 'react';
import { useApp } from '../state/store.jsx';
import { DataTable, LineChart } from '../components/ui/index.jsx';
import { f1, cultColor } from '../lib/format.js';
import { janelaOf, fmtJanela } from './Overview.jsx';

const PV = { Manga: [28.4, 't/ha'], Uva: [32, 't/ha'], Goiaba: [45, 't/ha'], 'Melão': [30, 't/ha'] };

export default function Predictions() {
  const { S, M } = useApp();
  const { T } = M;
  const [focusId, setFocusId] = useState(null);
  const ft = T.find(t => t.id === focusId) || T[0];

  const janelas = T.map((t, i) => { const j = janelaOf(S, t, i); return { t, j, ...fmtJanela(j), cl: ((j[0] / 69) * 100).toFixed(1) + '%', cw: (((j[1] - j[0]) / 69) * 100).toFixed(1) + '%', el: ((j[2] / 69) * 100).toFixed(1) + '%', ew: (((Math.min(j[3], 69) - j[2]) / 69) * 100).toFixed(1) + '%' }; });
  const iaList = T.map((t, i) => { const p = PV[t.cultura] || [60, 'sc/ha'], d = [7.8, -4.2, 3.1, -6.5, 9.4, 1.2][i % 6]; const jw = janelas.find(j => j.t.id === t.id); return { id: t.id, nome: t.nome, cultura: t.cultura, prod: f1(p[0] * (1 + d / 200), 1) + ' ' + p[1], delta: (d > 0 ? '+' : '') + f1(d) + '%', dc: d > 0 ? '#2B7A3D' : '#B3321F', janela: jw ? jw.colTxt : t.colheita, conf: [91, 78, 84, 72, 93, 81][i % 6] }; });

  // curva de vigor deslocada pelo talhão em foco
  const fi = Math.max(0, T.indexOf(ft));
  const off = (fi % 6) * 0.015;
  const real = [0.18, 0.22, 0.28, 0.35, 0.42, 0.5, 0.57, 0.63, 0.69, 0.73, null, null, null, null, null, null, null, null].map(v => (v == null ? null : v + off));
  const prev = real.map((v, i) => (i < 9 ? null : i === 9 ? real[9] : real[9] + Math.sin(((i - 9) / 8) * Math.PI * 0.9) * 0.16 - (i > 15 ? (i - 15) * 0.04 : 0)));
  const lo = prev.map((v, i) => (v == null ? null : v - (i - 9) * 0.012));
  const hi = prev.map((v, i) => (v == null ? null : v + (i - 9) * 0.012));

  const first = janelas.slice().sort((a, b) => a.j[0] - b.j[0])[0];
  const risk = T.filter(t => t.temp > 31).map(t => t.id);
  const manga = iaList.find(x => x.cultura === 'Manga');
  const kpis = [
    { label: 'Produtividade prevista' + (manga ? ' · manga' : ''), val: manga ? manga.prod : iaList[0] ? iaList[0].prod : '—', sub: manga ? manga.delta + ' sobre a safra anterior' : 'Sem histórico', c: '#2B7A3D' },
    { label: 'Janela ideal de colheita', val: first ? first.colTxt : '—', sub: first ? first.t.id + ' ' + first.t.cultura + ' · confiança ' + (iaList.find(x => x.id === first.t.id) || {}).conf + '%' : '—', c: '#6B7068' },
    { label: 'Janela de exportação', val: first ? first.expTxt : '—', sub: first ? first.j[4] : '—', c: '#6B7068' },
    { label: 'Risco climático · 7 dias', val: risk.length > 1 ? 'Moderado' : risk.length ? 'Baixo' : 'Mínimo', sub: risk.length ? risk.join(' e ') + ' acima da faixa de temperatura' : 'Todos os talhões dentro da faixa', c: risk.length ? '#B9561A' : '#2B7A3D' }
  ];

  const oport = [
    { cult: 'Manga', ganho: '+€ 0,09/kg', title: 'Exportar para a União Europeia em dezembro', txt: 'Referência em Roterdã está 6% acima da média de 90 dias. A janela de exportação coincide com a menor oferta do Peru.' },
    { cult: 'Uva', ganho: '+R$ 1,20/kg', title: 'Direcionar a Vitória para o mercado de fim de ano', txt: 'Demanda alta no CEAGESP entre 10 e 24 de dezembro. A colheita prevista cabe nessa janela.' },
    { cult: 'Melão', ganho: '+£ 0,06/kg', title: 'Embarque semanal pelo Porto de Natal', txt: 'Contratos no Reino Unido sobem na 2ª quinzena de dezembro. Frete refrigerado disponível às quintas-feiras.' }
  ];
  const fatores = [['Umidade do solo', 34], ['Temperatura', 22], ['Chuva prevista', 18], ['Histórico do talhão', 14], ['Índice de vigor', 12]];

  if (!T.length) return <div className="card"><div className="empty">Cadastre talhões em {M.farm.nome} para gerar predições.</div></div>;

  return (
    <div className="stack" data-screen-label="Predições de IA">
      <div className="grid-kpi">
        {kpis.map(k => <div key={k.label} className="kpi" style={{ gap: 10 }}><span className="sub">{k.label}</span><span style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{k.val}</span><span style={{ fontSize: 12, color: k.c }}>{k.sub}</span></div>)}
      </div>
      <div className="grid-2">
        <div className="card pad">
          <div className="card-h">
            <div className="tblock"><h3 className="ttl">Comportamento do cultivo · {ft.id} {ft.cultura}{ft.variedade ? ' ' + ft.variedade : ''}</h3><span className="sub">Índice de vigor medido e projeção do modelo · clique na tabela para trocar</span></div>
            <div className="legend"><span><i className="sw line" style={{ background: '#2F8F46' }} />Medido</span><span><i className="sw line" style={{ background: '#EE6A1F' }} />Previsto</span><span><i className="sw" style={{ width: 12, background: '#FCE3D2' }} />Intervalo 90%</span></div>
          </div>
          <div style={{ height: 220 }}><LineChart h={220} min={0.1} max={1} marker={9} fmt={v => 'Vigor ' + f1(v, 2)} labels={i => ['Set', 'Set', 'Set', 'Out', 'Out', 'Out', 'Out', 'Nov', 'Nov', 'Nov · hoje', 'Nov', 'Dez', 'Dez', 'Dez', 'Dez', 'Jan', 'Jan', 'Jan'][i]} series={[{ v: real, color: '#2F8F46', area: true }, { v: prev, color: '#EE6A1F', dash: true, band: [lo, hi] }]} /></div>
          <div className="axis"><span>Set</span><span>Out</span><span>Nov · hoje</span><span>Dez</span><span>Jan</span></div>
        </div>
        <div className="card pad">
          <h3 className="ttl">Fatores do modelo</h3>
          {fatores.map(([n, w]) => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="between" style={{ fontSize: 13 }}><span>{n}</span><b style={{ fontWeight: 600 }}>{w}%</b></div>
              <div className="bar" style={{ flex: 'none', height: 8, borderRadius: 4 }}><i style={{ width: w + '%', background: '#2F8F46', borderRadius: 4 }} /></div>
            </div>
          ))}
          <div style={{ marginTop: 'auto', background: 'var(--dark)', color: '#F2F3EF', borderRadius: 12, padding: '12px 14px', fontSize: 13, lineHeight: 1.45 }}><span className="ai-tag" style={{ marginRight: 6 }}>IA</span>Modelo treinado com 4 safras da propriedade e leituras de {M.sens.length} sensores. Última atualização há 2 h.</div>
        </div>
      </div>
      <div className="card clip">
        <div className="card-h pad"><h3 className="ttl">Previsão por talhão</h3></div>
        <DataTable minW={720} rows={iaList} rowKey={r => r.id} onRow={r => setFocusId(r.id)} rowStyle={r => (r.id === ft.id ? { background: '#F4F8F2' } : undefined)}
          cols={[
            { k: 'id', label: 'Talhão', w: 'minmax(170px,1.3fr)', main: true, render: p => <b style={{ fontWeight: 600 }}>{p.id} · {p.nome}</b> },
            { k: 'cultura', label: 'Cultura', w: '100px' },
            { k: 'prod', label: 'Produtividade', w: '150px', render: p => <span className="tnum"><b>{p.prod}</b> <span style={{ color: p.dc, fontSize: 12 }}>{p.delta}</span></span> },
            { k: 'janela', label: 'Janela de colheita', w: '160px', render: p => <span className="c-muted">{p.janela}</span> },
            { k: 'conf', label: 'Confiança', w: '150px', render: p => <span className="row"><span className="bar"><i style={{ width: p.conf + '%', background: '#2F7BC4' }} /></span><b style={{ fontSize: 12, fontWeight: 600 }}>{p.conf}%</b></span> }
          ]} />
      </div>
      <div className="card pad">
        <div className="card-h" style={{ alignItems: 'flex-start' }}>
          <div className="tblock"><h3 className="ttl">Janela recomendada de colheita e exportação</h3><span className="sub">Regras e modelo estatístico com temperatura, umidade, cultura, histórico, preço, demanda e transporte</span></div>
          <div className="legend"><span><i className="sw" style={{ width: 14, height: 8, background: '#2F8F46' }} />Colheita</span><span><i className="sw" style={{ width: 14, height: 8, background: '#EE8A1F' }} />Exportação</span></div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 640, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(170px,230px) 1fr', gap: 16 }}><span /><div className="axis" style={{ fontSize: 11 }}>{['23 nov', '07 dez', '21 dez', '04 jan', '18 jan', '31 jan'].map(a => <span key={a}>{a}</span>)}</div></div>
            {janelas.map(j => (
              <div key={j.t.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(170px,230px) 1fr', gap: 16, alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--line2)' }}>
                <div className="tblock"><span className="row" style={{ gap: 7, fontSize: 13, fontWeight: 600 }}><i className="cdot" style={{ background: cultColor(j.t.cultura) }} />{j.t.id} · {j.t.cultura}{j.t.variedade ? ' · ' + j.t.variedade : ''}</span><span style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>{j.j[5]}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ position: 'relative', height: 36, borderRadius: 8, background: 'repeating-linear-gradient(90deg,#F7F8F5 0,#F7F8F5 calc(20% - 1px),#ECEEE8 calc(20% - 1px),#ECEEE8 20%)' }}>
                    <span style={{ position: 'absolute', top: 5, height: 11, left: j.cl, width: j.cw, borderRadius: 4, background: '#2F8F46' }} />
                    <span style={{ position: 'absolute', top: 20, height: 11, left: j.el, width: j.ew, borderRadius: 4, background: '#EE8A1F' }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--ink2)' }}>Colheita <b>{j.colTxt}</b> · Exportação <b>{j.expTxt}</b> · {j.j[4]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <h3 className="ttl" style={{ marginTop: 4 }}>Oportunidades de mercado</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 12 }}>
        {oport.map(o => (
          <div key={o.title} className="card pad" style={{ gap: 10 }}>
            <div className="between"><span className="row" style={{ gap: 6, fontSize: 12.5, color: 'var(--ink2)' }}><i className="cdot" style={{ background: cultColor(o.cult) }} />{o.cult}</span><b style={{ fontSize: 14, fontWeight: 700, color: '#2B7A3D' }}>{o.ganho}</b></div>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{o.title}</span>
            <span style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5, textWrap: 'pretty' }}>{o.txt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
