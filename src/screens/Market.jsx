import { useApp } from '../state/store.jsx';
import { Icon, DataTable, LineChart, DropdownRow } from '../components/ui/index.jsx';
import { f1, cultColor } from '../lib/format.js';
import { MARKET_BASE, MARKET_DESTS } from '../data/mock.js';

export default function Market() {
  const { S, M, set } = useApp();
  const cults = Object.keys(MARKET_BASE);
  const mkCult = MARKET_BASE[S.mkCult] ? S.mkCult : cults[0];
  const [pb, pu] = MARKET_BASE[mkCult];
  const [dm] = MARKET_DESTS[S.mkDest] || [1];
  const cs = cults.indexOf(mkCult);
  const nP = { '30d': 30, '90d': 45, '12m': 12 }[S.mkPer];
  const ser = S.apiMkSerie && S.apiMkSerie.length > 1 ? S.apiMkSerie : Array.from({ length: nP }, (_, i) => pb * dm * (1 + 0.05 * Math.sin((i / nP) * 5 + cs) + 0.018 * Math.sin(i * 1.9 + cs * 2) + (i / nP - 0.5) * 0.04));
  const cur = ser[ser.length - 1], vr = (cur / ser[0] - 1) * 100;
  const money = v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const axis = { '30d': ['20 out', '27 out', '03 nov', '10 nov', 'Hoje'], '90d': ['21 ago', '20 set', '10 out', '30 out', 'Hoje'], '12m': ['Dez 25', 'Mar 26', 'Jun 26', 'Set 26', 'Nov 26'] }[S.mkPer];
  const rows = Object.entries(MARKET_DESTS).map(([k, [m, fr]], i) => { const p = pb * m * (1 + 0.01 * Math.sin(i + cs)), v = [1.2, 2.4, -0.8, 1.9, -1.6][(i + cs) % 5]; return { praca: k, preco: money(p), var: (v > 0 ? '+' : '') + f1(v) + '%', vc: v >= 0 ? '#2B7A3D' : '#B3321F', frete: fr ? money(fr) : '—', liq: money(p - fr), liqN: p - fr }; });
  const best = rows.reduce((a, b) => (b.liqN > a.liqN ? b : a), rows[0]);

  const defs = [
    { id: 'cult', label: 'Cultura', icon: 'nutrition', w: '170px', options: cults.map(v => ({ v, label: v, dot: cultColor(v) })), value: mkCult, onChange: v => set({ mkCult: v }) },
    { id: 'dest', label: 'Mercado de destino', icon: 'public', w: '240px', options: Object.keys(MARKET_DESTS).map(v => ({ v, label: v })), value: S.mkDest, onChange: v => set({ mkDest: v }) },
    { id: 'per', label: 'Período', icon: 'calendar_month', w: '170px', options: [['30d', 'Últimos 30 dias'], ['90d', 'Últimos 90 dias'], ['12m', 'Últimos 12 meses']].map(x => ({ v: x[0], label: x[1] })), value: S.mkPer, onChange: v => set({ mkPer: v }) }
  ];
  const labelOf = i => { const span = { '30d': 30, '90d': 90, '12m': 365 }[S.mkPer]; const d = new Date(Date.now() - ((ser.length - 1 - i) / Math.max(1, ser.length - 1)) * span * 86400000); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: S.mkPer === '12m' ? '2-digit' : undefined }); };

  return (
    <div className="stack" data-screen-label="Mercado">
      <DropdownRow defs={defs} />
      <div className="card pad">
        <div className="between wrap" style={{ alignItems: 'flex-end', gap: 16 }}>
          <div className="tblock" style={{ gap: 4 }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>{mkCult} · {S.mkDest} · referência atual</span><span className="tnum" style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em' }}>{money(cur)}<span style={{ fontSize: 14, color: 'var(--muted)', letterSpacing: 0, marginLeft: 4, fontWeight: 500 }}>{pu}</span></span></div>
          <div className="row" style={{ gap: 20, fontSize: 13 }}>
            <div className="tblock"><span style={{ color: 'var(--muted)', fontSize: 12 }}>Variação</span><b style={{ color: vr >= 0 ? '#2B7A3D' : '#B3321F' }}>{(vr > 0 ? '+' : '') + f1(vr)}%</b></div>
            <div className="tblock"><span style={{ color: 'var(--muted)', fontSize: 12 }}>Mínima</span><b>{money(Math.min(...ser))}</b></div>
            <div className="tblock"><span style={{ color: 'var(--muted)', fontSize: 12 }}>Máxima</span><b>{money(Math.max(...ser))}</b></div>
          </div>
        </div>
        <div style={{ height: 240 }}><LineChart h={240} series={[{ v: ser, color: '#2F8F46', area: true }]} fmt={money} labels={labelOf} /></div>
        <div className="axis">{axis.map(a => <span key={a}>{a}</span>)}</div>
      </div>
      <div className="card clip">
        <div className="card-h pad"><h3 className="ttl">Referências por praça · {mkCult}</h3><span className="sub" style={{ fontSize: 12 }}>Melhor líquido: <b style={{ color: '#2B7A3D' }}>{best.praca}</b> · valores ilustrativos</span></div>
        <DataTable minW={640} rows={rows} rowKey={r => r.praca} onRow={r => set({ mkDest: r.praca })} rowStyle={r => (r.praca === S.mkDest ? { background: '#F4F8F2' } : undefined)}
          cols={[
            { k: 'praca', label: 'Praça', w: 'minmax(200px,1.5fr)', main: true, render: r => <b style={{ fontWeight: 600 }}>{r.praca}</b> },
            { k: 'preco', label: 'Preço', w: '140px', render: r => <span className="tnum">{r.preco}</span> },
            { k: 'var', label: 'Variação', w: '110px', render: r => <b style={{ color: r.vc, fontWeight: 600 }}>{r.var}</b> },
            { k: 'frete', label: 'Frete estimado', w: '130px', render: r => <span className="c-muted tnum">{r.frete}</span> },
            { k: 'liq', label: 'Líquido', w: '120px', render: r => <b className="tnum" style={{ fontWeight: 600 }}>{r.liq}</b> }
          ]} />
      </div>
      <div className="card clip">
        <div className="card-h pad"><h3 className="ttl">Dados de mercado cadastrados</h3>{M.acc.mk === 2 && <button className="btn btn-orange" onClick={() => set({ modal: 'mercado', mf: {}, modalErr: '' })}><Icon n="add" />Novo registro</button>}</div>
        <DataTable minW={860} rows={S.mercadoRegs} rowKey={(r, i) => r.id ?? i}
          cols={[
            { k: 'cultura', label: 'Cultura', w: 'minmax(110px,.8fr)', render: r => <span className="row" style={{ fontWeight: 600 }}><i className="cdot" style={{ background: cultColor(r.cultura) }} />{r.cultura}</span> },
            { k: 'mercado', label: 'Mercado de destino', w: 'minmax(190px,1.4fr)' },
            { k: 'preco', label: 'Preço médio', w: '110px', render: r => <b className="tnum" style={{ fontWeight: 600 }}>{r.preco}</b> },
            { k: 'moeda', label: 'Moeda', w: '100px', render: r => <span className="c-muted">{r.moeda}</span> },
            { k: 'data', label: 'Data de referência', w: '130px', render: r => <span className="c-muted">{r.data}</span> },
            { k: 'demanda', label: 'Demanda estimada', w: 'minmax(170px,1.2fr)', render: r => <span className="c-muted">{r.demanda}</span> }
          ]} />
      </div>
    </div>
  );
}
