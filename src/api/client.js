/* Cliente da API do Campo Vivo (ES module).
 * Configure pelo .env (VITE_API_URL / VITE_USE_MOCK) ou edite CONFIG.
 * Se os nomes dos campos da sua API forem diferentes, ajuste só os adaptadores em MAP.
 * Modo mock (padrão): nenhuma chamada de rede; listas retornam null e a interface usa os dados de demonstração.
 *
 * Geometria: a interface trabalha com coordenadas reais [lat, lng].
 * A API usa GeoJSON (lon, lat) — os adaptadores fazem a conversão nos dois sentidos.
 */

const env = import.meta.env || {};

export const CONFIG = {
  baseUrl: env.VITE_API_URL || 'http://localhost:3000/api',
  mock: env.VITE_USE_MOCK === undefined ? true : env.VITE_USE_MOCK !== 'false',
  timeoutMs: 15000,
  pollMs: 5000, // intervalo de atualização das últimas leituras
  tokenKey: 'campovivo.token'
};

// ---------- HTTP ----------
export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let token = null;
try { token = localStorage.getItem(CONFIG.tokenKey); } catch (e) { /* storage indisponível */ }
function setToken(t) {
  token = t;
  try { t ? localStorage.setItem(CONFIG.tokenKey, t) : localStorage.removeItem(CONFIG.tokenKey); } catch (e) { /* ignore */ }
}

async function request(method, path, body, query) {
  const url = new URL(CONFIG.baseUrl.replace(/\/$/, '') + path);
  if (query) Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v); });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG.timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: Object.assign({ 'Content-Type': 'application/json', Accept: 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    });
    if (res.status === 401) { setToken(null); window.dispatchEvent(new CustomEvent('campovivo:unauthorized')); }
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, (data && (data.message || data.erro)) || 'Erro ' + res.status, data);
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new ApiError(0, 'A API não respondeu a tempo.');
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, 'Não foi possível conectar à API.');
  } finally {
    clearTimeout(timer);
  }
}
const mock = v => new Promise(r => setTimeout(() => r(v), 250));
const unwrap = d => (d && Array.isArray(d.data) ? d.data : d); // aceita [..] ou { data: [..] }

// ---------- utilidades de formato ----------
const num = v => { if (v === undefined || v === null || v === '' || v === '—') return null; const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isNaN(n) ? null : n; };
const numDot = v => { if (v === undefined || v === null || v === '' || v === '—') return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const range = (a, b, u) => (a == null || b == null ? '—' : a + ' – ' + b + u);
const parseRange = s => { const m = String(s || '').match(/(-?\d+[.,]?\d*)\D+(-?\d+[.,]?\d*)/); return m ? [numDot(m[1]), numDot(m[2])] : [null, null]; };
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmtDate = iso => { if (!iso) return 'a definir'; const d = new Date(iso); return isNaN(d) ? iso : String(d.getDate()).padStart(2, '0') + ' ' + MES[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2); };
const fmtDateBR = iso => { if (!iso) return '—'; const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleDateString('pt-BR'); };
const parseDateBR = s => {
  const m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  const m2 = String(s || '').match(/(\d{1,2})\s+([a-zç]{3})\s+(\d{2,4})/i);
  if (m2) { const mi = MES.indexOf(m2[2].toLowerCase()); if (mi >= 0) return (m2[3].length === 2 ? '20' + m2[3] : m2[3]) + '-' + String(mi + 1).padStart(2, '0') + '-' + m2[1].padStart(2, '0'); }
  return null;
};
const relTime = iso => { const d = new Date(iso); if (isNaN(d)) return ''; const m = Math.round((Date.now() - d) / 60000); return m < 1 ? 'agora' : m < 60 ? 'há ' + m + ' min' : m < 1440 ? 'há ' + Math.round(m / 60) + ' h' : fmtDateBR(iso); };
const hhmm = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toTimeString().slice(0, 8); };

// ---------- geometria (GeoJSON [lon,lat] <-> interface [lat,lng]) ----------
const ringOf = poly => (poly && poly.coordinates ? poly.coordinates[0] : []).slice(0, -1); // remove ponto de fechamento
const toLatLng = ring => ring.map(([lon, lat]) => [lat, lon]);
const toGeoRing = pts => pts.concat([pts[0]]).map(([lat, lng]) => [+lng.toFixed(7), +lat.toFixed(7)]);

// ---------- adaptadores API <-> interface ----------
const SEV = { critico: 'crit', atencao: 'warn', info: 'info' };
const SEV_ICON = { temperatura: 'device_thermostat', umidade: 'humidity_low', umidade_solo: 'water_drop', ph: 'science', sensor_offline: 'sensors_off', bateria: 'battery_2_bar' };
const ESTAGIOS = ['poda_inducao', 'floracao', 'frutificacao', 'maturacao', 'colheita'];
const ROTA_ETAPAS = ['carregamento', 'em_transito', 'inspecao', 'entregue'];

export const MAP = {
  usuario: {
    toUI: p => ({ id: p.id, nome: p.nome, cpf: p.cpf, email: p.email, tel: p.telefone, perfil: p.tipo_usuario, escopo: p.vinculo || '—', ult: p.ultimo_acesso ? relTime(p.ultimo_acesso) : '—', status: p.status }),
    toAPI: u => ({ nome: u.nome, cpf: u.cpf, email: u.email, telefone: u.tel, senha: u.senha, tipo_usuario: u.perfil, vinculo: u.escopo, status: u.status })
  },
  produtor: {
    toUI: p => ({ id: p.id, nome: p.razao_social, doc: p.cpf_cnpj, tel: p.telefone, email: p.email, cidade: p.cidade, uf: p.estado, resp: p.responsavel }),
    toAPI: u => ({ razao_social: u.nome, cpf_cnpj: u.doc, telefone: u.tel, email: u.email, cidade: u.cidade, estado: u.uf, responsavel: u.resp })
  },
  propriedade: {
    toUI: p => ({ id: p.id, nome: p.nome, mun: p.municipio, uf: p.estado, area: +p.area_total || 0, prod: p.produtor_nome || '—', talhoes: p.qtd_talhoes || 0, culturas: (p.culturas || []).join(', ') || 'Sem talhões cadastrados', sens: p.qtd_sensores || 0, saude: p.indice_saude != null ? p.indice_saude + '%' : '—', status: p.status || 'Ativa', lat: p.latitude, lng: p.longitude }),
    toAPI: u => ({ nome: u.nome, produtor_nome: u.prod, municipio: u.mun, estado: u.uf, latitude: numDot(u.lat), longitude: numDot(u.lng), area_total: num(u.area), status: u.status })
  },
  cultura: {
    toUI: p => ({ id: p.id, nome: p.nome, variedade: p.variedade, temp: range(p.temperatura_min, p.temperatura_max, ' °C'), umid: range(p.umidade_min, p.umidade_max, '%'), ciclo: p.ciclo_medio_dias ? p.ciclo_medio_dias + ' dias' : '—', desc: p.descricao }),
    toAPI: u => { const t = parseRange(u.temp), h = parseRange(u.umid); return { nome: u.nome, variedade: u.variedade, temperatura_min: t[0], temperatura_max: t[1], umidade_min: h[0], umidade_max: h[1], ciclo_medio_dias: num(u.ciclo), descricao: u.desc }; }
  },
  talhao: {
    toUI: p => {
      const l = p.ultima_leitura || {};
      return { id: p.codigo, apiId: p.id, farmId: p.propriedade_id, nome: p.nome, cultura: p.cultura_nome, variedade: p.variedade, pts: toLatLng(ringOf(p.poligono)), hum: l.umidade ?? 60, temp: l.temperatura ?? 27, solo: l.umidade_solo ?? 42, ph: l.ph ?? 6, prio: p.prioridade || 'baixa', saude: p.indice_saude ?? 80, plantio: fmtDate(p.data_plantio), colheita: fmtDate(p.previsao_colheita), est: Math.max(0, ESTAGIOS.indexOf(p.estagio)), reason: p.motivo_prioridade || '' };
    },
    toAPI: (u, propriedadeId) => ({ codigo: u.id, nome: u.nome, propriedade_id: propriedadeId ?? u.farmId, cultura_nome: u.cultura, variedade: u.variedade || null, data_plantio: parseDateBR(u.plantio), previsao_colheita: parseDateBR(u.colheita), situacao: 'ativo', poligono: { type: 'Polygon', coordinates: [toGeoRing(u.pts)] } })
  },
  sensor: {
    toUI: p => ({ id: p.codigo, apiId: p.id, talId: p.talhao_codigo, tipo: p.tipo, lat: p.latitude, lng: p.longitude, off: p.status !== 'online', bat: p.bateria ?? 100, sinal: p.sinal_dbm ?? -80, status: p.status, inst: fmtDateBR(p.data_instalacao) }),
    toAPI: u => ({ codigo: u.id, tipo: u.tipo, propriedade_nome: u.prop, talhao_codigo: String(u.tal || '').split(' ')[0], latitude: numDot(u.lat), longitude: numDot(u.lng), data_instalacao: parseDateBR(u.inst), status: String(u.status || 'online').toLowerCase() })
  },
  leitura: {
    toUI: p => ({ hora: hhmm(p.registrada_em), data: p.registrada_em, sensor: p.sensor_codigo, talId: p.talhao_codigo, hum: p.umidade, temp: p.temperatura, solo: p.umidade_solo, ph: p.ph })
  },
  alerta: {
    toUI: p => ({ key: p.id, sev: SEV[p.severidade] || 'info', icon: SEV_ICON[p.tipo] || 'warning', title: p.titulo, desc: p.descricao, tal: [p.talhao_codigo, p.talhao_nome].filter(Boolean).join(' · '), hora: relTime(p.criado_em), acked: !!p.reconhecido })
  },
  mercado: {
    toUI: p => ({ id: p.id, cultura: p.cultura, mercado: p.mercado_destino, preco: String(p.preco_medio).replace('.', ','), moeda: p.moeda, data: fmtDateBR(p.data_referencia), demanda: p.demanda_estimada }),
    toAPI: u => ({ cultura: u.cultura, mercado_destino: u.mercado, preco_medio: numDot(u.preco), moeda: u.moeda, data_referencia: parseDateBR(u.data), demanda_estimada: u.demanda })
  },
  logistica: {
    toUI: p => ({ id: p.id, origem: p.origem, destino: p.destino, modal: p.modal_transporte, tempo: p.tempo_estimado, custo: p.custo_estimado, transp: p.empresa_transportadora, sit: p.situacao }),
    toAPI: u => ({ origem: u.origem, destino: u.destino, modal_transporte: u.modal, tempo_estimado: u.tempo, custo_estimado: u.custo, empresa_transportadora: u.transp, situacao: u.sit })
  },
  rota: {
    toUI: p => {
      const e = Math.max(0, ROTA_ETAPAS.indexOf(p.etapa));
      return { id: p.codigo, carga: p.carga, origem: p.origem, destino: p.destino, transp: p.transportadora, placa: p.placa, prazo: new Date(p.prazo).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), eta: p.previsao_texto || '', e, s: p.atrasada ? 'crit' : e === 3 ? 'ok' : e === 0 ? 'warn' : 'info', st: p.atrasada ? 'Atrasada' : ['Carregando', 'Em trânsito', 'Inspeção', 'Entregue'][e] };
    }
  },
  auditoria: {
    toUI: p => { const d = new Date(p.data_hora); return { t: isNaN(d) ? p.data_hora : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ''), icon: 'history', who: p.usuario_nome, acao: p.operacao, alvo: p.recurso, ip: p.ip || '—' }; }
  },
  janela: {
    // dias contados a partir de 23/11/2026 (início do eixo da tela)
    toUI: p => { const d0 = new Date('2026-11-23'), off = iso => Math.round((new Date(iso) - d0) / 86400000); return [p.talhao_codigo, [off(p.colheita_inicio), off(p.colheita_fim), off(p.exportacao_inicio), off(p.exportacao_fim), p.destino, p.motivo]]; }
  }
};

const list = (path, mapper) => q => (CONFIG.mock ? mock(null) : request('GET', path, undefined, q).then(d => (unwrap(d) || []).map(mapper)));
const create = (path, m) => (ui, ...extra) => (CONFIG.mock ? mock(Object.assign({ id: 'tmp-' + Date.now() }, ui)) : request('POST', path, m.toAPI(ui, ...extra)).then(m.toUI));

export const AgroAPI = {
  config: CONFIG,
  configure(opts) { Object.assign(CONFIG, Object.fromEntries(Object.entries(opts || {}).filter(([, v]) => v !== undefined && v !== ''))); return CONFIG; },
  get isMock() { return CONFIG.mock; },
  ApiError,

  auth: {
    login: (email, senha) => (CONFIG.mock
      ? mock({ token: 'demo', usuario: { nome: null, email } })
      : request('POST', '/auth/login', { email, senha }).then(d => { setToken(d.token); return d; })),
    logout: () => { const p = CONFIG.mock || !token ? Promise.resolve() : request('POST', '/auth/logout').catch(() => {}); setToken(null); return p; },
    me: () => (CONFIG.mock ? mock(null) : request('GET', '/auth/me')),
    get token() { return token; }
  },
  usuarios: { list: list('/usuarios', MAP.usuario.toUI), create: create('/usuarios', MAP.usuario) },
  produtores: { list: list('/produtores', MAP.produtor.toUI), create: create('/produtores', MAP.produtor) },
  propriedades: { list: list('/propriedades', MAP.propriedade.toUI), create: create('/propriedades', MAP.propriedade) },
  culturas: { list: list('/culturas', MAP.cultura.toUI), create: create('/culturas', MAP.cultura) },
  talhoes: {
    list: q => (CONFIG.mock ? mock(null) : request('GET', '/talhoes', undefined, q).then(d => (unwrap(d) || []).map(MAP.talhao.toUI))),
    create: create('/talhoes', MAP.talhao),
    update: t => (CONFIG.mock ? mock(t) : request('PUT', '/talhoes/' + encodeURIComponent(t.apiId || t.id), MAP.talhao.toAPI(t)).then(MAP.talhao.toUI)),
    remove: t => (CONFIG.mock ? mock(true) : request('DELETE', '/talhoes/' + encodeURIComponent(t.apiId || t.id)))
  },
  sensores: { list: list('/sensores', MAP.sensor.toUI), create: create('/sensores', MAP.sensor) },
  leituras: {
    // { 'T-01': { temp, hum, solo, ph }, ... }
    ultimas: q => (CONFIG.mock ? mock(null) : request('GET', '/leituras/ultimas', undefined, q).then(d => Object.fromEntries((unwrap(d) || []).map(r => [r.talhao_codigo, { temp: r.temperatura, hum: r.umidade, solo: r.umidade_solo, ph: r.ph }])))),
    historico: list('/leituras', MAP.leitura.toUI)
  },
  dashboard: { resumo: q => (CONFIG.mock ? mock(null) : request('GET', '/dashboard/resumo', undefined, q)) },
  alertas: {
    list: list('/alertas', MAP.alerta.toUI),
    reconhecer: id => (CONFIG.mock ? mock(true) : request('PATCH', '/alertas/' + encodeURIComponent(id) + '/reconhecer'))
  },
  mercado: {
    list: list('/mercado', MAP.mercado.toUI),
    create: create('/mercado', MAP.mercado),
    serie: q => (CONFIG.mock ? mock(null) : request('GET', '/mercado/serie', undefined, q).then(d => (unwrap(d) || []).map(r => +r.preco)))
  },
  logistica: { list: list('/logistica', MAP.logistica.toUI), create: create('/logistica', MAP.logistica) },
  rotas: { list: list('/rotas', MAP.rota.toUI) },
  predicoes: { janelas: q => (CONFIG.mock ? mock(null) : request('GET', '/predicoes/janelas', undefined, q).then(d => Object.fromEntries((unwrap(d) || []).map(MAP.janela.toUI)))) },
  auditoria: { list: list('/auditoria', MAP.auditoria.toUI) },
  aplicacao: { status: () => (CONFIG.mock ? mock(null) : request('GET', '/monitoramento/aplicacao')) },

  _internals: { request, MAP, toGeoRing, toLatLng }
};

export default AgroAPI;
