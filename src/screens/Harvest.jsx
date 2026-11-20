import { useApp } from '../state/store.jsx';
import { Icon, Badge, DataTable, Seg } from '../components/ui/index.jsx';
import { f1, cultColor, st, stK } from '../lib/format.js';
import { areaHa } from '../lib/geo.js';
import { ROTAS } from '../data/mock.js';

const STAGES = ['Poda / indução', 'Floração', 'Frutificação', 'Maturação', 'Colheita'];
const STEPS = ['Carregamento', 'Em trânsito', 'Inspeção', 'Entregue'];

export default function Harvest() {
  const { S, M, set } = useApp();
  const { T } = M;
  const routes = S.apiRoutes || ROTAS;
  const cultivos = T.map(t => ({ ...t, area: f1(areaHa(t.pts)) + ' ha', safra: t.cultura === 'Melão' ? '2026/2' : 'Safra 2º sem.', pct: Math.round(((t.est + 0.5) / 5) * 100) + '%' }));
  const kpis = [
    { label: 'Cargas hoje', val: String(routes.filter(r => /hoje/i.test(r.prazo)).length + 5), c: '#1A1E19' },
    { label: 'Em trânsito', val: String(routes.filter(r => r.e === 1 || r.e === 2).length), c: '#2563A0' },
    { label: 'Entregues na semana', val: String(13 + routes.filter(r => r.s === 'ok').length), c: '#2B7A3D' },
    { label: 'Com atraso', val: String(routes.filter(r => r.s === 'crit').length), c: '#B3321F' }
  ];
  return (
    <div className="stack" data-screen-label="Colheita e logística">
      <div className="between wrap">
        <Seg alt items={[{ v: 'reg', label: 'Registros de cultivo' }, { v: 'log', label: 'Logística' }]} value={S.colTab} onChange={v => set({ colTab: v })} />
        <span className="sub" style={{ fontSize: 13 }}>{S.colTab === 'reg' ? 'Safra 2026/27 · ' + T.length + ' cultivos' : routes.length + ' rotas ativas nesta semana'}</span>
      </div>

      {S.colTab === 'reg' && (
        <div className="card clip">
          <DataTable minW={900} rows={cultivos} rowKey={r => r.id} empty="Nenhum cultivo nesta propriedade."
            cols={[
              { k: 'id', label: 'Talhão', w: 'minmax(170px,1.3fr)', main: true, render: c => <span className="tblock"><b style={{ fontWeight: 600 }}>{c.id} · {c.nome}</b><small style={{ fontSize: 11.5, color: 'var(--muted2)' }}>{c.area}</small></span> },
              { k: 'cultura', label: 'Cultura', w: '120px', render: c => <span className="row" style={{ gap: 6 }}><i className="cdot" style={{ background: cultColor(c.cultura) }} />{c.cultura}{c.variedade ? ' · ' + c.variedade : ''}</span> },
              { k: 'safra', label: 'Safra', w: '100px', render: c => <span className="c-muted">{c.safra}</span> },
              { k: 'plantio', label: 'Plantio', w: '100px', render: c => <span className="c-muted">{c.plantio}</span> },
              { k: 'colheita', label: 'Colheita', w: '100px', render: c => <span className="c-muted">{c.colheita}</span> },
              { k: 'est', label: 'Estágio', w: '220px', wide: true, render: c => (
                <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ display: 'flex', gap: 3 }}>{STAGES.map((_, i) => <span key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < c.est ? '#2F8F46' : i === c.est ? '#EE6A1F' : '#E7E9E3' }} />)}</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{STAGES[c.est]}</span>
                </span>
              ) },
              { k: 'pct', label: 'Andamento', w: '140px', wide: true, render: c => <span className="row"><span className="bar"><i style={{ width: c.pct, background: '#2F8F46' }} /></span><b className="tnum" style={{ fontSize: 12, fontWeight: 600 }}>{c.pct}</b></span> }
            ]} />
        </div>
      )}

      {S.colTab === 'log' && (
        <>
          <div className="grid-kpi sm">
            {kpis.map(k => <div key={k.label} className="kpi" style={{ gap: 10 }}><span className="sub">{k.label}</span><span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', color: k.c }}>{k.val}</span></div>)}
          </div>
          <div className="stack" style={{ gap: 12 }}>
            {routes.map(r => { const c = st(r.s); const done = r.s === 'ok'; return (
              <div key={r.id} className="card pad" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 18, alignItems: 'center' }}>
                <div className="tblock" style={{ gap: 6 }}>
                  <div className="row"><b style={{ fontSize: 14, fontWeight: 600 }}>{r.id}</b><Badge bg={c[0]} fg={c[1]}>{r.st}</Badge></div>
                  <span style={{ fontSize: 13, color: 'var(--ink2)' }}>{r.carga}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted2)' }}>{r.transp} · {r.placa}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <span className="row"><span style={{ width: 10, height: 10, borderRadius: '50%', border: '2.5px solid #2F8F46', flex: 'none' }} />{r.origem}</span>
                  <span className="row"><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EE6A1F', flex: 'none' }} />{r.destino}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="between" style={{ fontSize: 12 }}><span style={{ color: 'var(--muted)' }}>Prazo <b style={{ color: 'var(--ink)' }}>{r.prazo}</b></span><b style={{ fontWeight: 600 }}>{r.eta}</b></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
                    {STEPS.map((label, i) => (
                      <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <span style={{ height: 6, borderRadius: 3, background: done || i < r.e ? '#2F8F46' : i === r.e ? (r.s === 'crit' ? '#D8452E' : '#EE6A1F') : '#E7E9E3' }} />
                        <span style={{ fontSize: 10.5, color: done || i <= r.e ? 'var(--ink)' : 'var(--muted3)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ); })}
          </div>
          <div className="card clip">
            <div className="card-h pad"><h3 className="ttl">Informações logísticas</h3>{M.acc.col === 2 && <button className="btn btn-orange" onClick={() => set({ modal: 'logistica', mf: {}, modalErr: '' })}><Icon n="add" />Nova informação</button>}</div>
            <DataTable minW={1000} rows={S.logInfos} rowKey={(r, i) => r.id ?? i}
              cols={[
                { k: 'origem', label: 'Origem', w: 'minmax(140px,1fr)', render: r => <b style={{ fontWeight: 600 }}>{r.origem}</b> },
                { k: 'destino', label: 'Destino', w: 'minmax(170px,1.2fr)' },
                { k: 'modal', label: 'Modal', w: 'minmax(170px,1.2fr)', wide: true, render: r => <span className="c-muted">{r.modal}</span> },
                { k: 'tempo', label: 'Tempo est.', w: '100px' },
                { k: 'custo', label: 'Custo est.', w: '150px' },
                { k: 'transp', label: 'Transportadora', w: '140px', render: r => <span className="c-muted">{r.transp}</span> },
                { k: 'sit', label: 'Situação', w: '110px', render: r => { const c = st(stK(r.sit)); return <Badge bg={c[0]} fg={c[1]}>{r.sit}</Badge>; } }
              ]} />
          </div>
        </>
      )}
    </div>
  );
}
