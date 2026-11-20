import { useApp } from '../state/store.jsx';
import { Icon, Badge, DataTable, LineChart, Seg, Toggle } from '../components/ui/index.jsx';
import { f1, st, stK, ini } from '../lib/format.js';
import { ACC, NAV, AUDIT } from '../data/mock.js';

const SUBS = { pessoas: 'Pessoas, perfis e escopo de acesso', perfis: 'Responsabilidades e limites dos perfis', audit: 'Histórico das operações realizadas no ambiente', params: 'Parâmetros do ambiente', app: 'Disponibilidade, erros e tempo de resposta da aplicação' };

export default function Admin() {
  const { S, set, api } = useApp();
  const tab = S.admTab;
  const cnt = r => S.usuarios.filter(u => u.perfil === r).length;
  const perfis = [
    { nome: 'Administrador', pode: ['Gerenciar usuários, perfis e escopos de acesso', 'Cadastrar propriedades, talhões, culturas e sensores', 'Alterar parâmetros e acompanhar a aplicação'], nao: ['Excluir registros de auditoria'] },
    { nome: 'Produtor', pode: ['Gerenciar as próprias propriedades, talhões e culturas', 'Acompanhar leituras, alertas, colheita e logística', 'Consultar predições e mercado'], nao: ['Ver propriedades fora do seu escopo', 'Gerenciar usuários e parâmetros'] },
    { nome: 'Analista', pode: ['Consultar dashboards, histórico e predições', 'Cadastrar e atualizar dados de mercado'], nao: ['Alterar cadastros de campo', 'Reconhecer alertas'] },
    { nome: 'Operador', pode: ['Acompanhar leituras dos talhões atribuídos', 'Cadastrar sensores e demarcar talhões', 'Reconhecer alertas e atualizar a logística'], nao: ['Ver predições de IA e mercado', 'Gerenciar usuários'] }
  ];
  const audit = S.apiAudit || AUDIT;
  const tg = k => ({ toggle: true, on: S.toggles[k], flip: () => set(s => ({ toggles: { ...s.toggles, [k]: !s.toggles[k] } })) });
  const params = [
    { label: 'Endereço da API', desc: 'Defina VITE_API_URL no arquivo .env', val: api.config.baseUrl },
    { label: 'Origem dos dados', desc: 'Defina VITE_USE_MOCK=false no .env para usar a API real', val: api.isMock ? 'Demonstração' : 'API' },
    { label: 'Intervalo de leitura', desc: 'Frequência de envio dos sensores ao gateway', val: '5 min' },
    { label: 'Umidade do solo mínima', desc: 'Abaixo deste valor um alerta crítico é gerado', val: '35 kPa' },
    { label: 'Temperatura máxima', desc: 'Limite para alerta de estresse térmico', val: '31 °C' },
    { label: 'Faixa de pH', desc: 'Faixa considerada ideal para as culturas', val: '5,5 – 6,8' },
    { label: 'Fuso horário', desc: 'Usado em leituras, alertas e relatórios', val: 'America/Sao_Paulo' },
    { label: 'Notificações por e-mail', desc: 'Enviar alertas críticos aos responsáveis do talhão', ...tg('notif') },
    { label: 'Recomendações de IA', desc: 'Exibir insights gerados pelo modelo nos painéis', ...tg('ia') },
    { label: 'Alertar sensor offline', desc: 'Gerar alerta após 30 min sem comunicação', ...tg('offline') },
    { label: 'Notificações por SMS', desc: 'Enviar alertas críticos por mensagem de texto', ...tg('sms') }
  ];
  const app = S.apiApp;
  const appKpis = app
    ? [{ label: 'Disponibilidade · 30 dias', val: f1(app.disponibilidade, 2) + '%', sub: 'Meta 99,5%', c: '#2B7A3D' }, { label: 'Taxa de erros', val: f1(app.taxa_erros, 2) + '%', sub: (app.falhas_ultima_hora ?? 0) + ' falhas na última hora', c: '#B9561A' }, { label: 'Tempo de resposta p95', val: app.p95_ms + ' ms', sub: 'Média ' + app.media_ms + ' ms', c: '#1A1E19' }, { label: 'Requisições por minuto', val: Number(app.rpm).toLocaleString('pt-BR'), sub: 'Dados da API', c: '#1A1E19' }]
    : [{ label: 'Disponibilidade · 30 dias', val: '99,94%', sub: 'Meta 99,5%', c: '#2B7A3D' }, { label: 'Taxa de erros', val: f1(0.31 + Math.sin(S.tick) * 0.04, 2) + '%', sub: '12 falhas na última hora', c: '#B9561A' }, { label: 'Tempo de resposta p95', val: Math.round(182 + Math.sin(S.tick * 0.8) * 14) + ' ms', sub: 'Média 96 ms', c: '#1A1E19' }, { label: 'Requisições por minuto', val: (1284 + Math.round(Math.sin(S.tick * 0.6) * 60)).toLocaleString('pt-BR'), sub: 'Pico de 2.140 às 06:00', c: '#1A1E19' }];
  const mods = [['Painel web', '99,98%', 'ok', 'Operacional'], ['Recebimento de leituras', '99,91%', 'ok', 'Operacional'], ['Alertas e notificações', '99,95%', 'ok', 'Operacional'], ['Relatórios e exportação', '99,62%', 'warn', 'Lentidão']];
  const inc = [['19/11 13:00', 'warn', 'Lentidão', 'Tempo de resposta acima de 400 ms por 6 minutos na geração de relatórios.'], ['18/11 05:40', 'crit', 'Falha', 'SN-108 parou de enviar leituras. Gateway Sul com perda de pacotes.'], ['16/11 22:10', 'info', 'Manutenção', 'Atualização programada concluída em 4 minutos.']];
  const cell = v => (v === 2 ? ['Total', '#E3F1E2', '#2B7A3D'] : v === 1 ? ['Leitura', '#E3EEF8', '#2563A0'] : ['Sem acesso', '#EFF0EC', '#8A8F86']);

  return (
    <div className="stack" data-screen-label="Administração">
      {api.isMock && <div className="notice warn"><Icon n="science" />Ambiente de demonstração. Pessoas, perfis e registros são ilustrativos.</div>}
      <div className="between wrap">
        <Seg alt items={[{ v: 'pessoas', label: 'Pessoas' }, { v: 'perfis', label: 'Perfis' }, { v: 'audit', label: 'Auditoria' }, { v: 'params', label: 'Parâmetros' }, { v: 'app', label: 'Aplicação' }]} value={tab} onChange={v => set({ admTab: v })} />
        <span className="sub" style={{ fontSize: 13 }}>{SUBS[tab]}</span>
      </div>

      {tab === 'pessoas' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-orange" onClick={() => set({ modal: 'usuario', mf: {}, modalErr: '' })}><Icon n="person_add" />Novo usuário</button></div>
          <div className="card clip">
            <DataTable minW={780} rows={S.usuarios} rowKey={(r, i) => r.id ?? r.email + i}
              cols={[
                { k: 'nome', label: 'Pessoa', w: 'minmax(220px,1.5fr)', main: true, render: p => <span className="person"><span className="av">{ini(p.nome)}</span><span className="nm"><b>{p.nome}</b><small>{p.email}</small></span></span> },
                { k: 'perfil', label: 'Perfil', w: '150px' },
                { k: 'escopo', label: 'Escopo de acesso', w: 'minmax(200px,1.3fr)', render: p => <span className="c-muted">{p.escopo}</span> },
                { k: 'ult', label: 'Último acesso', w: '110px', render: p => <span className="c-muted">{p.ult}</span> },
                { k: 'status', label: 'Status', w: '130px', render: p => { const c = st(stK(p.status)); return <Badge bg={c[0]} fg={c[1]}>{p.status}</Badge>; } }
              ]} />
          </div>
        </>
      )}

      {tab === 'perfis' && (
        <>
          <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))' }}>
            {perfis.map(p => (
              <div key={p.nome} className="card pad" style={{ gap: 12 }}>
                <div className="between"><b style={{ fontSize: 15, fontWeight: 600 }}>{p.nome}</b><span style={{ fontSize: 12, color: 'var(--muted2)' }}>{cnt(p.nome)} pessoa(s)</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ fontSize: 11.5, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Responsabilidades</span>{p.pode.map(x => <span key={x} className="row" style={{ alignItems: 'flex-start', fontSize: 13, lineHeight: 1.4 }}><Icon n="check" size={17} style={{ color: 'var(--green)' }} />{x}</span>)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10, borderTop: '1px solid var(--line2)' }}><span style={{ fontSize: 11.5, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Limites</span>{p.nao.map(x => <span key={x} className="row" style={{ alignItems: 'flex-start', fontSize: 13, lineHeight: 1.4, color: 'var(--ink2)' }}><Icon n="block" size={17} style={{ color: '#D8452E' }} />{x}</span>)}</div>
              </div>
            ))}
          </div>
          <div className="card clip">
            <div className="card-h pad"><div className="tblock"><h3 className="ttl">Matriz de acesso por módulo</h3><span className="sub">Entre com outro perfil na tela de login para ver o menu filtrado.</span></div></div>
            <DataTable minW={640} rows={NAV} rowKey={r => r[0]}
              cols={[
                { k: 'mod', label: 'Módulo', w: 'minmax(180px,1.4fr)', main: true, render: r => <b style={{ fontWeight: 500 }}>{r[1]}</b> },
                ...['admin', 'prod', 'anal', 'oper'].map((ro, i) => ({ k: ro, label: ['Administrador', 'Produtor', 'Analista', 'Operador'][i], render: r => { const c = cell(ACC[ro][r[0]]); return <Badge bg={c[1]} fg={c[2]}>{c[0]}</Badge>; } }))
              ]} />
          </div>
        </>
      )}

      {tab === 'audit' && (
        <div className="card" style={{ padding: '8px 20px' }}>
          {audit.map((a, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 32px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: i < audit.length - 1 ? '1px solid var(--line2)' : 'none' }} className="audit-row">
              <span className="tnum" style={{ fontSize: 12, color: 'var(--muted2)', minWidth: 80 }}>{a.t}</span>
              <Icon n={a.icon} size={17} style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--soft3)', display: 'grid', placeItems: 'center' }} />
              <span style={{ fontSize: 13, lineHeight: 1.4, minWidth: 0 }}><b>{a.who}</b> {a.acao} <span className="c-muted">{a.alvo}</span></span>
              <span className="tnum hide-m" style={{ fontSize: 12, color: 'var(--muted2)' }}>IP {a.ip}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'params' && (
        <div className="card" style={{ padding: '4px 20px' }}>
          {params.map((p, i) => (
            <div key={p.label} className="between" style={{ gap: 16, padding: '14px 0', borderBottom: i < params.length - 1 ? '1px solid var(--line2)' : 'none' }}>
              <div className="tblock"><b style={{ fontSize: 13.5, fontWeight: 600 }}>{p.label}</b><span className="sub">{p.desc}</span></div>
              {p.toggle ? <Toggle on={p.on} onClick={p.flip} label={p.label} /> : <span className="tnum" style={{ padding: '7px 12px', borderRadius: 10, background: 'var(--soft2)', fontSize: 13, fontWeight: 600, maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.val}</span>}
            </div>
          ))}
        </div>
      )}

      {tab === 'app' && (
        <>
          <div className="grid-kpi">{appKpis.map(k => <div key={k.label} className="kpi" style={{ gap: 8 }}><span className="sub">{k.label}</span><span className="tnum" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{k.val}</span><span style={{ fontSize: 12, color: k.c }}>{k.sub}</span></div>)}</div>
          <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,400px),1fr))' }}>
            <div className="card pad" style={{ gap: 12 }}>
              <div className="between"><h3 className="ttl">Tempo de resposta · 24 h</h3><span className="sub" style={{ fontSize: 12 }}>ms</span></div>
              <div style={{ height: 180 }}><LineChart h={180} fmt={v => Math.round(v) + ' ms'} labels={i => String(Math.floor(i / 2)).padStart(2, '0') + ':' + (i % 2 ? '30' : '00')} series={[{ v: Array.from({ length: 48 }, (_, i) => 150 + Math.sin(i / 5) * 25 + Math.sin(i * 1.7) * 10 + (i === 30 ? 90 : 0)), color: '#2F7BC4', area: true }]} /></div>
              <div className="axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Agora</span></div>
            </div>
            <div className="stack">
              <div className="card" style={{ padding: '8px 18px' }}>
                {mods.map((m, i) => { const c = st(m[2]); return <div key={m[0]} className="between" style={{ padding: '10px 0', borderBottom: i < mods.length - 1 ? '1px solid var(--line2)' : 'none' }}><span style={{ fontSize: 13, fontWeight: 500 }}>{m[0]}</span><span className="row" style={{ gap: 10 }}><b className="tnum" style={{ fontSize: 12.5, fontWeight: 600 }}>{m[1]}</b><Badge bg={c[0]} fg={c[1]}>{m[3]}</Badge></span></div>; })}
              </div>
              <div className="card pad" style={{ gap: 10 }}>
                <h3 className="ttl">Ocorrências recentes</h3>
                {inc.map(x => { const c = st(x[1]); return <div key={x[0]} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10, fontSize: 12.5 }}><span style={{ display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--muted2)', alignItems: 'flex-start' }}>{x[0]}<Badge bg={c[0]} fg={c[1]}>{x[2]}</Badge></span><span style={{ color: 'var(--ink2)', lineHeight: 1.45 }}>{x[3]}</span></div>; })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
