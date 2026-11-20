import { useState } from 'react';
import { useApp } from '../../state/store.jsx';
import { Dialog, DialogHead, Icon, Seg } from '../ui/index.jsx';
import { st, ini, download, slug } from '../../lib/format.js';
import { centroid, areaHa } from '../../lib/geo.js';
import AgroAPI from '../../api/client.js';

// ---------------- Formulários de cadastro ----------------
const numDot = v => { const n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? null : n; };

function defs(S, M) {
  const cults = S.culturas.map(c => c.nome);
  return {
    fazenda: { title: 'Cadastrar propriedade rural', fields: [['nome', 'Nome da propriedade', 'Fazenda São José', { req: true, full: true }], ['prod', 'Produtor responsável', 'Marcos Ribeiro', { options: S.produtores.map(p => p.nome) }], ['mun', 'Município', 'Petrolina'], ['uf', 'Estado', 'PE'], ['lat', 'Latitude', '-9.3891'], ['lng', 'Longitude', '-40.5030'], ['area', 'Área total (ha)', '850'], ['status', 'Status', 'Ativa', { options: ['Ativa', 'Inativa'] }]] },
    produtor: { title: 'Cadastrar produtor ou empresa', fields: [['nome', 'Razão social / nome', 'Vale Frutas Ltda.', { req: true, full: true }], ['doc', 'CPF / CNPJ', '00.000.000/0001-00'], ['tel', 'Telefone', '(87) 99999-0000'], ['email', 'E-mail', 'contato@empresa.com.br', { type: 'email', full: true }], ['cidade', 'Cidade', 'Petrolina'], ['uf', 'Estado', 'PE'], ['resp', 'Responsável', 'Maria Oliveira', { full: true }]] },
    cultura: { title: 'Cadastrar cultura', fields: [['nome', 'Nome da cultura', 'Acerola', { req: true }], ['variedade', 'Variedade', 'Junko'], ['temp', 'Temperatura recomendada', '22 – 30 °C'], ['umid', 'Umidade recomendada', '60 – 80%'], ['ciclo', 'Ciclo médio de produção', '90 dias'], ['desc', 'Descrição', 'Mercado interno e polpa', { full: true }]] },
    sensor: { title: 'Cadastrar sensor IoT', fields: [['id', 'Código do sensor', 'SN-113', { req: true }], ['tipo', 'Tipo', 'Estação climática', { options: ['Estação climática', 'Sonda de solo', 'Pluviômetro', 'Sensor de pH'] }], ['tal', 'Talhão / lote', M.T[0] ? M.T[0].id : 'T-01', { options: M.T.map(t => ({ v: t.id, label: t.id + ' · ' + t.nome })), full: true }], ['lat', 'Latitude (vazio = centro do talhão)', '-9.3912'], ['lng', 'Longitude', '-40.5108'], ['inst', 'Data de instalação', new Date().toLocaleDateString('pt-BR')], ['status', 'Status', 'Online', { options: ['Online', 'Offline'] }]] },
    mercado: { title: 'Cadastrar dado de mercado', fields: [['cultura', 'Cultura', 'Manga', { options: cults }], ['mercado', 'Mercado de destino', 'Roterdã (Países Baixos)', { req: true }], ['preco', 'Preço médio', '1,45'], ['moeda', 'Moeda / unidade', 'EUR/kg'], ['data', 'Data de referência', new Date().toLocaleDateString('pt-BR')], ['demanda', 'Demanda estimada', 'Alta · 1.200 t/semana']] },
    logistica: { title: 'Cadastrar informação logística', fields: [['origem', 'Origem', 'Petrolina (PE)', { req: true }], ['destino', 'Destino', 'Porto de Salvador (BA)'], ['modal', 'Modal de transporte', 'Rodoviário refrigerado', { full: true }], ['tempo', 'Tempo estimado', '12 h'], ['custo', 'Custo estimado', 'R$ 5.400 / carga'], ['transp', 'Empresa transportadora', 'TransVale'], ['sit', 'Situação', 'Ativa', { options: ['Ativa', 'Em revisão', 'Encerrada'] }]] },
    talhao: { title: 'Editar talhão ' + (S.editId || ''), fields: [['nome', 'Nome do talhão', 'Talhão Norte', { req: true, full: true }], ['cultura', 'Cultura', 'Manga', { options: cults }], ['variedade', 'Variedade', 'Palmer'], ['plantio', 'Data do plantio', '12 jul 26'], ['colheita', 'Previsão de colheita', '05 dez 26']] },
    usuario: { title: 'Cadastrar usuário', fields: [['nome', 'Nome completo', 'Maria Oliveira', { req: true, full: true }], ['cpf', 'CPF', '000.000.000-00'], ['tel', 'Telefone', '(87) 99999-0000'], ['email', 'E-mail', 'maria@fazenda.com.br', { type: 'email', req: true, full: true }], ['senha', 'Senha', '••••••••', { type: 'password' }], ['perfil', 'Tipo de usuário', 'Operador', { options: ['Administrador', 'Produtor', 'Analista', 'Operador'] }], ['escopo', 'Empresa / propriedade vinculada', 'Fazenda Santa Helena', { options: ['Todas as propriedades', ...S.fazendas.map(f => f.nome)] }], ['status', 'Status', 'Convite pendente', { options: ['Ativo', 'Inativo', 'Convite pendente'] }]] }
  };
}

export function FormModal() {
  const { S, M, set, A } = useApp();
  const md = S.modal && defs(S, M)[S.modal];
  if (!md) return null;
  const close = () => set({ modal: null, modalErr: '', mf: {} });
  const val = (k, f) => {
    if (S.mf[k] != null) return S.mf[k];
    const o = f[3] && f[3].options;
    if (!o || !o.length) return '';
    if (typeof o[0] === 'object') return o[0].v;
    return o.includes(f[2]) ? f[2] : o[0];
  };

  const save = () => {
    const m = {};
    for (const f of md.fields) {
      const v = String(val(f[0], f) || '').trim();
      if (f[3] && f[3].req && !v) return set({ modalErr: 'Preencha o campo “' + f[1] + '”.' });
      m[f[0]] = v || '—';
    }
    const RES = { fazenda: 'propriedades', produtor: 'produtores', cultura: 'culturas', mercado: 'mercado', logistica: 'logistica', usuario: 'usuarios', sensor: 'sensores' };
    const add = (key, obj, after) => {
      set({ saving: true, modalErr: '' });
      AgroAPI[RES[S.modal]].create(obj)
        .then(saved => {
          const item = !AgroAPI.isMock && saved ? saved : obj;
          set(s => ({ [key]: [...s[key], item], modal: null, mf: {}, saving: false }));
          after && after(item);
        })
        .catch(e => set({ saving: false, modalErr: e.message || 'Não foi possível salvar.' }));
    };
    if (S.modal === 'fazenda') {
      const lat = numDot(m.lat), lng = numDot(m.lng);
      add('fazendas', { id: 'tmp-' + Date.now(), nome: m.nome, mun: m.mun, uf: m.uf, area: parseFloat(String(m.area).replace(/\./g, '').replace(',', '.')) || 0, prod: m.prod, status: m.status === '—' ? 'Ativa' : m.status, lat: lat ?? -9.39, lng: lng ?? -40.5, talhoes: 0, culturas: 'Sem talhões cadastrados', sens: 0, saude: '—' }, f => A.showToast(f.nome + ' cadastrada.'));
    } else if (S.modal === 'produtor') add('produtores', m);
    else if (S.modal === 'cultura') add('culturas', m);
    else if (S.modal === 'mercado') add('mercadoRegs', m);
    else if (S.modal === 'logistica') add('logInfos', m);
    else if (S.modal === 'usuario') add('usuarios', { ...m, senha: undefined, ult: '—', status: m.status === '—' ? 'Convite pendente' : m.status });
    else if (S.modal === 'sensor') {
      const t = M.T.find(x => x.id === m.tal) || M.T[0];
      if (!t) return set({ modalErr: 'Cadastre um talhão antes de adicionar sensores.' });
      const c = centroid(t.pts);
      const obj = { id: m.id, tipo: m.tipo === '—' ? 'Estação climática' : m.tipo, talId: t.id, tal: t.id, farmId: M.farm.id, prop: M.farm.nome, lat: numDot(m.lat) ?? c[0], lng: numDot(m.lng) ?? c[1], inst: m.inst, status: m.status, off: /off/i.test(m.status), bat: 100, sinal: -70, fw: 'v2.4.0', novo: true };
      set({ saving: true, modalErr: '' });
      AgroAPI.sensores.create(obj)
        .then(saved => {
          if (!AgroAPI.isMock && saved) set(s => ({ apiSensors: [...(s.apiSensors || []), { ...saved, farmId: M.farm.id }], modal: null, mf: {}, saving: false }));
          else set(s => ({ sensors: [...s.sensors, obj], modal: null, mf: {}, saving: false }));
          A.showToast('Sensor ' + obj.id + ' cadastrado em ' + t.id + '.');
        })
        .catch(e => set({ saving: false, modalErr: e.message || 'Não foi possível salvar.' }));
    } else if (S.modal === 'talhao') {
      const t0 = S.talhoes.find(t => t.id === S.editId && t.farmId === M.farm.id);
      if (!t0) return close();
      const upd = { ...t0, nome: m.nome, cultura: m.cultura, variedade: m.variedade === '—' ? '' : m.variedade, plantio: m.plantio, colheita: m.colheita };
      set({ saving: true });
      AgroAPI.talhoes.update(upd)
        .then(() => { set(s => ({ talhoes: s.talhoes.map(t => (t === t0 ? upd : t)), modal: null, mf: {}, saving: false })); A.showToast('Talhão ' + S.editId + ' atualizado.'); })
        .catch(e => set({ saving: false, modalErr: e.message }));
    }
  };

  const del = () => {
    const id = S.editId;
    const t0 = S.talhoes.find(t => t.id === id && t.farmId === M.farm.id);
    if (!t0) return close();
    AgroAPI.talhoes.remove(t0)
      .then(() => { set(s => ({ talhoes: s.talhoes.filter(t => t !== t0), sensors: s.sensors.filter(x => !(x.talId === id && x.farmId === t0.farmId)), modal: null, mf: {}, sel: s.sel === id ? null : s.sel })); A.showToast('Talhão ' + id + ' excluído.'); })
      .catch(e => set({ modalErr: e.message }));
  };

  return (
    <Dialog onClose={close}>
      <DialogHead title={md.title} onClose={close} />
      <form className="form-grid" onSubmit={e => { e.preventDefault(); save(); }}>
        {md.fields.map(f => {
          const [k, label, ph, o = {}] = f;
          const on = e => { const v = e.target.value; set(s => ({ mf: { ...s.mf, [k]: v } })); };
          return (
            <label key={k} className={'field' + (o.full ? ' full' : '')}>{label}{o.req ? ' *' : ''}
              {o.options ? (
                <select value={val(k, f)} onChange={on}>
                  {o.options.map(op => typeof op === 'object' ? <option key={op.v} value={op.v}>{op.label}</option> : <option key={op} value={op}>{op}</option>)}
                </select>
              ) : (
                <input type={o.type || 'text'} value={S.mf[k] || ''} onChange={on} placeholder={ph} autoComplete="off" />
              )}
            </label>
          );
        })}
        <button type="submit" hidden />
      </form>
      {S.modalErr && <span className="notice err" style={{ padding: '8px 10px', fontSize: 12.5 }}>{S.modalErr}</span>}
      <div className="dialog-f">
        {S.modal === 'talhao' && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={del}><Icon n="delete" size={17} />Excluir</button>}
        <button className="btn btn-ghost" onClick={close}>Cancelar</button>
        <button className="btn btn-green" onClick={save} disabled={S.saving}>{S.saving ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </Dialog>
  );
}

// ---------------- Seletor de propriedade ----------------
export function FarmPicker() {
  const { S, M, set, A } = useApp();
  if (!S.farmModal) return null;
  const close = () => set({ farmModal: false });
  const q = (S.farmQ || '').toLowerCase();
  const L = M.fazendasView.map((x, i) => ({ x, i })).filter(({ x }) => !q || (x.nome + ' ' + x.mun + ' ' + x.prod).toLowerCase().includes(q));
  return (
    <Dialog onClose={close} className="w540">
      <DialogHead title="Selecionar propriedade" sub="Os painéis, o mapa e os alertas passam a mostrar a propriedade escolhida." onClose={close} />
      <label className="row" style={{ border: '1px solid var(--input)', borderRadius: 10, padding: '9px 12px', color: 'var(--muted3)' }}>
        <Icon n="search" size={19} />
        <input autoFocus value={S.farmQ || ''} onChange={e => set({ farmQ: e.target.value })} placeholder="Buscar por nome, município ou produtor" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: 'var(--ink)', background: 'transparent', minWidth: 0 }} />
      </label>
      <div className="stack" style={{ gap: 8 }}>
        {L.map(({ x, i }) => (
          <button key={x.id ?? i} className={'opt-card' + (i === S.farm ? ' on' : '')} onClick={() => A.selectFarm(i)}>
            <Icon n="agriculture" className="oi" style={{ background: 'var(--green-l)', color: 'var(--green)' }} />
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <b style={{ fontSize: 14, fontWeight: 600 }}>{x.nome}</b>
              <span className="sub" style={{ fontSize: 12 }}>{x.mun}, {x.uf} · {x.prod}</span>
              <span style={{ fontSize: 12, color: 'var(--ink2)' }}>{x.talhoes} talhões · {x.sens} sensores · {x.culturas}</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <b style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{Number(x.area).toLocaleString('pt-BR')} ha</b>
              <Icon n="check_circle" size={20} style={{ color: 'var(--green)', opacity: i === S.farm ? 1 : 0 }} />
            </span>
          </button>
        ))}
        {!L.length && <span className="empty">Nenhuma propriedade encontrada.</span>}
      </div>
      <div className="between" style={{ paddingTop: 10, borderTop: '1px solid var(--line2)' }}>
        <span className="sub">{S.fazendas.length} propriedades cadastradas</span>
        {M.acc.faz === 2 && <button className="btn btn-ghost" onClick={() => set({ farmModal: false, modal: 'fazenda', mf: {}, modalErr: '' })}><Icon n="add" />Adicionar propriedade</button>}
      </div>
    </Dialog>
  );
}

// ---------------- Notificações ----------------
export function Notifications() {
  const { S, M, set, A } = useApp();
  if (!S.notifOpen) return null;
  const list = M.notifAlerts.map(a => { const c = st(a.sev); const read = M.isAcked(a) || !!S.readAll[a.key]; return { ...a, c, read }; });
  const unread = list.filter(a => !a.read).length;
  return (
    <>
      <div className="click-away" style={{ zIndex: 55 }} onClick={() => set({ notifOpen: false })} />
      <div className="notif" role="dialog" aria-label="Notificações">
        <div className="between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--line2)' }}>
          <span className="ttl">Notificações <span className="cnt">· {unread} não lidas</span></span>
          <button className="btn-link" onClick={() => set(s => ({ readAll: { ...s.readAll, ...Object.fromEntries(list.map(a => [a.key, true])) } }))}>Marcar todas como lidas</button>
        </div>
        {list.map(a => (
          <div key={a.key} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: '1px solid #F1F2EE', opacity: a.read ? 0.6 : 1 }}>
            <Icon n={a.icon} size={18} style={{ width: 32, height: 32, borderRadius: 9, background: a.c[0], color: a.c[1], display: 'grid', placeItems: 'center' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{a.title}</span>
              <span className="sub" style={{ fontSize: 12 }}>{a.tal} · {a.hora}</span>
            </div>
            {!a.read && <span style={{ width: 8, height: 8, marginTop: 6, borderRadius: '50%', background: 'var(--orange)', flex: 'none' }} />}
          </div>
        ))}
        {!list.length && <span className="empty">Nenhuma notificação para esta propriedade.</span>}
        {M.acc.al > 0 && <button onClick={() => { set({ alertFarm: S.farm }); A.go('al'); }} style={{ padding: 12, border: 'none', background: 'var(--soft)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: '0 0 16px 16px' }}>Ver todos os alertas</button>}
      </div>
    </>
  );
}

// ---------------- Exportação ----------------
export function ExportDialog() {
  const { S, M, set, A } = useApp();
  const [ds, setDs] = useState('leituras');
  const [per, setPer] = useState('7d');
  if (!S.exportOpen) return null;
  const close = () => set({ exportOpen: false });
  const hrs = { '24h': [24, 1], '7d': [168, 1], '30d': [120, 6] }[per];
  const opts = [['leituras', 'Leituras dos sensores', 'Temperatura, umidade, umidade do solo e pH por sensor', 'monitoring', 'CSV'], ['talhoes', 'Talhões', 'Contornos reais com cultura e datas, para GIS', 'pentagon', 'GeoJSON'], ['alertas', 'Alertas', 'Alertas da propriedade com severidade e status', 'notifications', 'CSV']];
  const info = ds === 'leituras' ? (M.sens.length * hrs[0]).toLocaleString('pt-BR') + ' linhas' : ds === 'talhoes' ? M.T.length + ' talhões' : M.notifAlerts.length + ' alertas';
  const go = () => {
    const sl = slug(M.farm.nome);
    if (ds === 'leituras') {
      const now = Date.now(), rows = ['sensor,talhao,cultura,data_hora,temperatura,umidade,umidade_solo,ph'];
      M.sens.forEach((sn, si) => {
        for (let k = hrs[0] - 1; k >= 0; k--) {
          const d = new Date(now - k * hrs[1] * 3600000), t = sn.tal, ph = ((d.getHours() - 6) / 24) * Math.PI * 2;
          rows.push([sn.id, t.id, t.cultura, d.toISOString(), (t.temp + Math.sin(ph) * 4 + Math.sin(k + si) * 0.5).toFixed(1), (t.hum - Math.sin(ph) * 8).toFixed(0), (t.solo + Math.sin(k / 9 + si) * 3).toFixed(0), (t.ph + Math.sin(k / 30) * 0.05).toFixed(2)].join(','));
        }
      });
      download('leituras-' + sl + '-' + per + '.csv', 'text/csv', rows.join('\n'));
    } else if (ds === 'talhoes') {
      const geo = AgroAPI._internals.toGeoRing;
      download('talhoes-' + sl + '.geojson', 'application/geo+json', JSON.stringify({ type: 'FeatureCollection', features: M.T.map(t => ({ type: 'Feature', properties: { codigo: t.id, nome: t.nome, cultura: t.cultura, variedade: t.variedade || null, data_plantio: t.plantio, previsao_colheita: t.colheita, area_ha: +areaHa(t.pts).toFixed(2) }, geometry: { type: 'Polygon', coordinates: [geo(t.pts)] } })) }, null, 2));
    } else {
      const esc = v => '"' + String(v).replace(/"/g, '""') + '"';
      download('alertas-' + sl + '.csv', 'text/csv', ['severidade,titulo,descricao,talhao,quando,reconhecido'].concat(M.notifAlerts.map(a => [a.sev, a.title, a.desc, a.tal, a.hora, M.isAcked(a) ? 'sim' : 'nao'].map(esc).join(','))).join('\n'));
    }
    close();
    A.showToast('Arquivo gerado e baixado.');
  };
  return (
    <Dialog onClose={close} className="w540">
      <DialogHead title="Exportar dados" sub={M.farm.nome} onClose={close} />
      <div className="stack" style={{ gap: 8 }}>
        {opts.map(o => (
          <button key={o[0]} className={'opt-card' + (ds === o[0] ? ' on' : '')} onClick={() => setDs(o[0])}>
            <Icon n={o[3]} className="oi" />
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}><b style={{ fontSize: 13.5, fontWeight: 600 }}>{o[1]}</b><span className="sub" style={{ fontSize: 12 }}>{o[2]}</span></span>
            <span className="badge" style={{ background: 'var(--soft3)', color: 'var(--ink2)', borderRadius: 6 }}>{o[4]}</span>
          </button>
        ))}
      </div>
      {ds === 'leituras' && (
        <div className="between"><span style={{ fontSize: 12.5, color: 'var(--ink2)', fontWeight: 500 }}>Período</span>
          <Seg items={[{ v: '24h', label: '24 h' }, { v: '7d', label: '7 dias' }, { v: '30d', label: '30 dias' }]} value={per} onChange={setPer} />
        </div>
      )}
      <div className="between wrap"><span className="sub">{info}</span>
        <div className="row"><button className="btn btn-ghost" onClick={close}>Cancelar</button><button className="btn btn-green" onClick={go}><Icon n="download" />Baixar arquivo</button></div>
      </div>
    </Dialog>
  );
}

// ---------------- Sair ----------------
export function LogoutDialog() {
  const { S, M, set, A } = useApp();
  if (!S.logoutAsk) return null;
  const close = () => set({ logoutAsk: false });
  return (
    <Dialog onClose={close} className="w380">
      <div className="row" style={{ gap: 12 }}>
        <span className="avatar" style={{ width: 44, height: 44, fontSize: 14, cursor: 'default' }}>{ini(M.userName)}</span>
        <div className="tblock"><b style={{ fontSize: 15, fontWeight: 600 }}>{M.userName}</b><span className="sub">{M.role.label}</span></div>
      </div>
      <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink2)' }}>Deseja sair da sua conta? Você precisará entrar novamente para acessar os painéis.</span>
      <div className="dialog-f"><button className="btn btn-ghost" onClick={close}>Cancelar</button><button className="btn btn-dark" onClick={A.logout}><Icon n="logout" size={17} />Sair</button></div>
    </Dialog>
  );
}

export function Toast() {
  const { S } = useApp();
  if (!S.toast) return null;
  return <div className="toast" role="status"><Icon n="check_circle" />{S.toast}</div>;
}
