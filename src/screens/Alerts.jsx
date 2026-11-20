import { useApp } from '../state/store.jsx';
import { Icon, Seg, Chips } from '../components/ui/index.jsx';
import { st } from '../lib/format.js';
import { mockPlan } from '../data/mock.js';

export default function Alerts() {
  const { S, M, set, api, A } = useApp();
  const af = S.alertFilter;
  const canAck = M.acc.al === 2;
  const list = M.aBase.filter(a => af === 'todos' || a.sev === af);
  const plan = mockPlan(M.alertFarmObj.id);
  const ack = a => {
    if (M.isAcked(a) || !canAck) return;
    set(s => ({ acked: { ...s.acked, [a.key]: true } }));
    api.alertas.reconhecer(a.key).catch(e => { A.apiErr(e); set(s => ({ acked: { ...s.acked, [a.key]: false } })); });
  };
  return (
    <div className="stack" data-screen-label="Alertas">
      <div className="row wrap"><span className="sub" style={{ marginRight: 4 }}>Propriedade</span>
        <Chips items={S.fazendas.map((f, i) => ({ v: i, label: f.nome }))} value={S.alertFarm} onChange={v => set({ alertFarm: v })} />
      </div>
      <div className="grid-2" style={{ alignItems: 'start', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))' }}>
        <div className="stack" style={{ gap: 12 }}>
          <div className="between wrap"><h3 className="ttl">Alertas ativos <span className="cnt">· {M.alertOpenN}</span></h3>
            <Seg alt items={[{ v: 'todos', label: 'Todos' }, { v: 'crit', label: 'Críticos' }, { v: 'warn', label: 'Atenção' }, { v: 'info', label: 'Info' }]} value={af} onChange={v => set({ alertFilter: v })} />
          </div>
          {list.map(a => { const c = st(a.sev), done = M.isAcked(a); return (
            <div key={a.key} className="card" style={{ borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', opacity: done ? 0.55 : 1 }}>
              <Icon n={a.icon} size={20} style={{ width: 36, height: 36, borderRadius: 10, background: c[0], color: c[1], display: 'grid', placeItems: 'center' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <div className="between" style={{ alignItems: 'flex-start', gap: 8 }}><b style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</b><span style={{ fontSize: 11.5, color: 'var(--muted2)', whiteSpace: 'nowrap' }}>{a.hora}</span></div>
                <span style={{ fontSize: 12.5, color: 'var(--ink2)', lineHeight: 1.45 }}>{a.desc}</span>
                <div className="between wrap" style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{a.tal}</span>
                  {canAck
                    ? <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12, borderRadius: 8 }} onClick={() => ack(a)} disabled={done}>{done ? <><Icon n="check" size={15} />Reconhecido</> : 'Reconhecer'}</button>
                    : <span style={{ fontSize: 12, color: 'var(--muted2)' }}>{done ? 'Reconhecido' : 'Somente leitura'}</span>}
                </div>
              </div>
            </div>
          ); })}
          {!list.length && <div className="card"><div className="empty">Nenhum alerta {af !== 'todos' ? 'nesta categoria' : 'para esta propriedade'}.</div></div>}
        </div>
        <div className="card pad" style={{ gap: 16 }}>
          <div className="tblock"><h3 className="ttl">Planejamento · próximos 7 dias</h3><span className="sub">Ações sugeridas a partir dos alertas de {M.alertFarmObj.nome}</span></div>
          {plan.map(d => (
            <div key={d.dia} style={{ display: 'grid', gridTemplateColumns: '54px 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, paddingTop: 2 }}><span style={{ fontSize: 11, color: 'var(--muted2)', textTransform: 'uppercase' }}>{d.dow}</span><span style={{ fontSize: 20, fontWeight: 600 }}>{d.dia}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                {d.tasks.map(t => (
                  <div key={t.txt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'var(--soft)' }}>
                    <span style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: t.c, flex: 'none' }} />
                    <div className="tblock" style={{ gap: 1 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{t.txt}</span><span style={{ fontSize: 11.5, color: 'var(--muted2)' }}>{t.hora} · {t.tal}</span></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!plan.length && <span className="empty">Sem ações planejadas.</span>}
        </div>
      </div>
    </div>
  );
}
