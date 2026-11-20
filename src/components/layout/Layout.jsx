import { useState } from 'react';
import { useApp } from '../../state/store.jsx';
import { Icon } from '../ui/index.jsx';
import { ini } from '../../lib/format.js';
import { NAV } from '../../data/mock.js';

export function Sidebar() {
  const { S, M, A, set } = useApp();
  const [tip, setTip] = useState(null);
  return (
    <aside className="sidebar">
      <div className="logo" title="Campo Vivo"><Icon n="eco" fill /></div>
      <nav aria-label="Menu principal">
        {M.nav.map(([k, label, icon]) => (
          <button key={k} className={'nav-btn' + (S.screen === k ? ' on' : '')} aria-label={label} aria-current={S.screen === k ? 'page' : undefined}
            onClick={() => A.go(k)}
            onMouseEnter={e => { const r = e.currentTarget.getBoundingClientRect(); setTip({ label, top: r.top + r.height / 2, left: r.right + 12 }); }}
            onMouseLeave={() => setTip(null)}>
            <Icon n={icon} />
            {k === 'al' && M.totalOpen > 0 && <span className="badge-n">{M.totalOpen}</span>}
          </button>
        ))}
      </nav>
      {tip && <span className="nav-tip" style={{ top: tip.top, left: tip.left }}>{tip.label}</span>}
      <button className="avatar" onClick={() => set({ logoutAsk: true })} title={M.userName + ' · ' + M.role.label + ' · clique para sair'}>{ini(M.userName)}</button>
    </aside>
  );
}

const SUBS = (S, M) => ({
  overview: `${M.farm.nome} · ${M.farm.mun}, ${M.farm.uf} · atualizado há 3 s`,
  mapa: 'Telemetria, umidade e temperatura por talhão',
  mon: 'Leituras em tempo real e histórico dos sensores',
  faz: 'Cadastro de fazendas, produtores e culturas',
  tal: 'Demarque talhões no mapa real e defina a cultura',
  col: S.colTab === 'reg' ? 'Organize os registros e acompanhe o andamento de cada cultivo' : 'Acompanhe rotas, prazos e o andamento das operações de cada colheita.',
  ia: 'Do comportamento do cultivo às oportunidades de mercado.',
  eq: 'Dispositivos e sensores',
  al: 'Alertas e planejamento da propriedade selecionada.',
  mk: 'Consultar referências de preço por cultura, destino e período.',
  adm: 'Pessoas, perfis, auditoria e parâmetros do ambiente'
});

export function Header() {
  const { S, M, set } = useApp();
  const title = (NAV.find(n => n[0] === S.screen) || NAV[0])[1];
  return (
    <header className="hdr">
      <div className="hdr-title"><h1>{title}</h1><span>{SUBS(S, M)[S.screen]}</span></div>
      <div className="hdr-actions">
        <button className="pill farm" onClick={() => set({ farmModal: true, farmQ: '' })} aria-label="Trocar propriedade">
          <Icon n="agriculture" style={{ color: 'var(--green)' }} /><span className="txt">{M.farm.nome}</span><Icon n="unfold_more" style={{ color: 'var(--muted2)', marginLeft: 'auto' }} />
        </button>
        <span className="pill hide-m"><Icon n="badge" size={17} style={{ color: '#2563A0' }} />{M.role.label}</span>
        <span className="pill hide-m"><span className="dot-live" />{M.online}/{M.sens.length} sensores online</span>
        <button className="icon-btn" onClick={() => set(s => ({ notifOpen: !s.notifOpen }))} aria-label="Notificações">
          <Icon n="notifications" />{M.notifAlerts.some(a => !M.isAcked(a) && !S.readAll[a.key]) && <span className="ndot" />}
        </button>
      </div>
    </header>
  );
}

export function MobileNav() {
  const { S, M, A, set } = useApp();
  const prim = ['overview', 'mapa', 'mon', 'al'].filter(k => M.acc[k]);
  const rest = NAV.map(n => n[0]).filter(k => M.acc[k] && !prim.includes(k));
  const it = k => NAV.find(n => n[0] === k);
  const moreActive = rest.includes(S.screen) || S.moreOpen;
  return (
    <>
      <nav className="mnav" aria-label="Navegação">
        {prim.map(k => { const [, label, icon] = it(k); const on = S.screen === k && !S.moreOpen; return (
          <button key={k} className={on ? 'on' : ''} title={label} aria-label={label} onClick={() => A.go(k)}>
            <Icon n={icon} />{k === 'al' && M.totalOpen > 0 && <span className="bn">{M.totalOpen}</span>}
          </button>
        ); })}
        <button className={moreActive ? 'on' : ''} title="Mais" aria-label="Mais opções" onClick={() => set(s => ({ moreOpen: !s.moreOpen }))}><Icon n={S.moreOpen ? 'close' : 'grid_view'} /></button>
      </nav>
      {S.moreOpen && (
        <>
          <div className="sheet-bg" onClick={() => set({ moreOpen: false })} />
          <div className="sheet">
            <span className="grab" />
            <div className="sheet-grid">
              {rest.map(k => { const [, label, icon] = it(k); return (
                <button key={k} className={S.screen === k ? 'on' : ''} onClick={() => A.go(k)}><Icon n={icon} />{label}</button>
              ); })}
            </div>
            <button className="opt-card" style={{ background: 'var(--soft)' }} onClick={() => set({ logoutAsk: true, moreOpen: false })}>
              <span className="avatar" style={{ width: 32, height: 32, fontSize: 11.5 }}>{ini(M.userName)}</span>
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><b style={{ fontWeight: 600, fontSize: 13 }}>{M.userName} · {M.role.label}</b><span className="sub" style={{ fontSize: 12 }}>Sair da conta</span></span>
              <Icon n="logout" size={20} style={{ color: 'var(--muted2)' }} />
            </button>
          </div>
        </>
      )}
    </>
  );
}
