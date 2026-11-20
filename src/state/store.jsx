import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AgroAPI from '../api/client.js';
import * as D from '../data/mock.js';
import { buildModel } from './model.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const SCREENS = D.NAV.map(n => n[0]);
const screenFromHash = () => {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  return SCREENS.includes(h) ? h : 'overview';
};

const initialState = () => ({
  screen: screenFromHash(),
  mapMode: 'telemetria', sel: 'T-02', tick: 0,
  monT: 'T-02', monMetric: 'temp', monPeriod: '24h', monCult: 'Todas', monSens: 'Todos',
  logged: false, role: 'admin', loginEmail: null, loginPwd: '', loginErr: '', loggingIn: false, user: null,
  talhoes: D.TALHOES, sensors: D.buildMockSensors(D.TALHOES),
  draft: null, draftClosed: false, df: { nome: '', cultura: 'Manga', plantio: '', colheita: '' },
  fazendas: D.FARMS, produtores: D.PRODUTORES, culturas: D.CULTURAS, usuarios: D.USUARIOS,
  mercadoRegs: D.MERCADO, logInfos: D.LOGISTICA,
  modal: null, mf: {}, modalErr: '', saving: false, editId: null,
  farm: 0, colTab: 'reg', alertFilter: 'todos', alertFarm: 0, acked: {}, readAll: {},
  mkCult: 'Manga', mkDest: 'Roterdã (Países Baixos)', mkPer: '90d', admTab: 'pessoas',
  toggles: { notif: true, ia: true, offline: true, sms: false },
  mapLayer: 'sat', focus: null,
  apiMock: AgroAPI.isMock, apiError: '', toast: '',
  // dados vindos da API (null = usar demonstração)
  apiSensors: null, apiAlerts: null, apiHist: null, apiMkSerie: null, apiJanelas: null, apiResumo: null, apiRoutes: null, apiAudit: null, apiApp: null
});

export function AppProvider({ children }) {
  const [S, setS] = useState(initialState);
  const ref = useRef(S);
  ref.current = S;

  const set = useCallback(p => setS(s => ({ ...s, ...(typeof p === 'function' ? p(s) : p) })), []);

  // ---------- utilidades ----------
  const toastTimer = useRef();
  const showToast = useCallback(t => {
    clearTimeout(toastTimer.current);
    set({ toast: t });
    toastTimer.current = setTimeout(() => set({ toast: '' }), 3200);
  }, [set]);
  const apiErr = useCallback(e => set({ apiError: (e && e.message) || 'Erro ao comunicar com a API.' }), [set]);
  const setIf = useCallback(k => r => { if (r != null) set({ [k]: r, apiError: '' }); return r; }, [set]);
  const pid = () => { const s = ref.current; const f = s.fazendas[s.farm]; return f && f.id; };

  // ---------- carregamento da API ----------
  const loadHist = useCallback(() => {
    if (AgroAPI.isMock) return;
    const s = ref.current;
    const ini = new Date(Date.now() - { '24h': 1, '7d': 7, '30d': 30 }[s.monPeriod] * 86400000).toISOString();
    AgroAPI.leituras.historico({ propriedade_id: pid(), talhao_codigo: s.monT, sensor_codigo: s.monSens === 'Todos' ? '' : s.monSens, inicio: ini, fim: new Date().toISOString() }).then(setIf('apiHist')).catch(apiErr);
  }, [setIf, apiErr]);

  const loadAlerts = useCallback(() => {
    if (AgroAPI.isMock) return;
    const s = ref.current;
    const f = s.fazendas[s.alertFarm];
    AgroAPI.alertas.list({ propriedade_id: f && f.id }).then(setIf('apiAlerts')).catch(apiErr);
  }, [setIf, apiErr]);

  const loadFarm = useCallback(() => {
    if (AgroAPI.isMock) return;
    const id = pid();
    const q = { propriedade_id: id };
    AgroAPI.talhoes.list(q)
      .then(r => {
        if (r) {
          const withFarm = r.map(t => ({ ...t, farmId: t.farmId ?? id }));
          set(s => ({ talhoes: [...s.talhoes.filter(t => t.farmId !== id), ...withFarm], apiError: '', ...(withFarm.length ? { sel: withFarm[0].id, monT: withFarm[0].id } : {}) }));
        }
        return AgroAPI.sensores.list(q);
      })
      .then(r => { if (r) set({ apiSensors: r.map(x => ({ ...x, farmId: id })) }); })
      .then(loadHist)
      .catch(apiErr);
    AgroAPI.predicoes.janelas(q).then(setIf('apiJanelas')).catch(apiErr);
    AgroAPI.dashboard.resumo(q).then(setIf('apiResumo')).catch(apiErr);
    loadAlerts();
  }, [set, setIf, apiErr, loadHist, loadAlerts]);

  const loadMk = useCallback(() => {
    if (AgroAPI.isMock) return;
    const s = ref.current;
    AgroAPI.mercado.serie({ cultura: s.mkCult, destino: s.mkDest, periodo: s.mkPer }).then(setIf('apiMkSerie')).catch(apiErr);
  }, [setIf, apiErr]);

  const loadAll = useCallback(() => {
    if (AgroAPI.isMock) return;
    AgroAPI.propriedades.list().then(r => { setIf('fazendas')(r && r.length ? r : null); loadFarm(); }).catch(apiErr);
    AgroAPI.produtores.list().then(setIf('produtores')).catch(apiErr);
    AgroAPI.culturas.list().then(setIf('culturas')).catch(apiErr);
    AgroAPI.mercado.list().then(setIf('mercadoRegs')).catch(apiErr);
    AgroAPI.logistica.list().then(setIf('logInfos')).catch(apiErr);
    AgroAPI.rotas.list().then(setIf('apiRoutes')).catch(apiErr);
    AgroAPI.usuarios.list().then(setIf('usuarios')).catch(apiErr);
    AgroAPI.auditoria.list().then(setIf('apiAudit')).catch(apiErr);
    AgroAPI.aplicacao.status().then(setIf('apiApp')).catch(apiErr);
    loadMk();
  }, [setIf, apiErr, loadFarm, loadMk]);

  // ---------- ciclo de vida ----------
  useEffect(() => {
    if (!AgroAPI.isMock && AgroAPI.auth.token) { set({ logged: true }); loadAll(); }
    const onUnauth = () => set({ logged: false, loginErr: 'Sua sessão expirou. Entre novamente.' });
    window.addEventListener('campovivo:unauthorized', onUnauth);
    const onHash = () => set({ screen: screenFromHash() });
    window.addEventListener('hashchange', onHash);
    const poll = () => {
      if (AgroAPI.isMock) return set(s => ({ tick: s.tick + 1 }));
      if (!ref.current.logged) return;
      AgroAPI.leituras.ultimas({ propriedade_id: pid() })
        .then(r => r && set(s => ({ tick: s.tick + 1, talhoes: s.talhoes.map(t => (r[t.id] ? { ...t, ...r[t.id] } : t)) })))
        .catch(apiErr);
    };
    const iv = setInterval(poll, AgroAPI.isMock ? 3000 : AgroAPI.config.pollMs);
    return () => { clearInterval(iv); window.removeEventListener('campovivo:unauthorized', onUnauth); window.removeEventListener('hashchange', onHash); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // tela -> hash (permite voltar/avançar no navegador e links diretos)
  useEffect(() => {
    const h = '#/' + S.screen;
    if (window.location.hash !== h) window.history.replaceState(null, '', h);
  }, [S.screen]);

  // recarregamentos quando os filtros mudam (somente API real)
  const prev = useRef(S);
  useEffect(() => {
    const p = prev.current;
    prev.current = S;
    if (!S.logged || AgroAPI.isMock) return;
    if (p.farm !== S.farm || (!p.logged && S.logged)) loadFarm();
    if (p.monT !== S.monT || p.monPeriod !== S.monPeriod || p.monSens !== S.monSens) loadHist();
    if (p.mkCult !== S.mkCult || p.mkDest !== S.mkDest || p.mkPer !== S.mkPer) loadMk();
    if (p.alertFarm !== S.alertFarm) loadAlerts();
  }, [S, loadFarm, loadHist, loadMk, loadAlerts]);

  const M = useMemo(() => buildModel(S), [S]);

  // ---------- ações ----------
  const actions = useMemo(() => ({
    showToast, apiErr, loadAll,
    go: screen => set({ screen, moreOpen: false, notifOpen: false }),
    selectFarm: (i, toast = true) => {
      const s = ref.current;
      const f = s.fazendas[i];
      if (!f) return;
      const first = s.talhoes.find(t => t.farmId === f.id);
      set({ farm: i, farmModal: false, sel: first ? first.id : null, monT: first ? first.id : null, monSens: 'Todos', focus: { farm: f.id, n: Date.now() } });
      if (toast) showToast('Propriedade alterada para ' + f.nome + '.');
    },
    focusTal: id => set({ sel: id, focus: { tal: id, n: Date.now() } }),
    editTal: t => set({ modal: 'talhao', editId: t.id, modalErr: '', mf: { nome: t.nome, cultura: t.cultura, variedade: t.variedade || '', plantio: t.plantio, colheita: t.colheita } }),
    startDraw: () => set({ screen: 'tal', draftClosed: false, draft: [], df: { nome: '', cultura: 'Manga', plantio: '', colheita: '' }, moreOpen: false }),
    login: e => {
      if (e && e.preventDefault) e.preventDefault();
      const s = ref.current;
      const role = D.ROLES.find(r => r.v === s.role) || D.ROLES[0];
      const email = (s.loginEmail ?? role.email).trim();
      if (!email.includes('@')) return set({ loginErr: 'Informe um e-mail válido.' });
      if (!s.loginPwd) return set({ loginErr: 'Informe a senha para continuar.' });
      set({ loggingIn: true, loginErr: '' });
      AgroAPI.auth.login(email, s.loginPwd)
        .then(res => {
          const u = (res && res.usuario) || {};
          const code = { Administrador: 'admin', Produtor: 'prod', Analista: 'anal', Operador: 'oper' }[u.perfil] || (D.ROLES.find(r => r.email === email.toLowerCase()) || {}).v;
          set({ logged: true, loggingIn: false, loginPwd: '', screen: 'overview', role: code || s.role, user: u.nome ? u : null, logoutAsk: false });
          loadAll();
        })
        .catch(err => set({ loggingIn: false, loginErr: err.message || 'Não foi possível entrar.' }));
    },
    logout: () => {
      AgroAPI.auth.logout();
      set({ logged: false, loginPwd: '', screen: 'overview', user: null, logoutAsk: false, moreOpen: false, notifOpen: false });
    }
  }), [set, showToast, apiErr, loadAll]);

  const value = useMemo(() => ({ S, set, M, A: actions, api: AgroAPI }), [S, set, M, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
