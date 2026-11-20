// Valores derivados do estado, usados por várias telas.
import { ACC, NAV, ROLES, mockAlerts } from '../data/mock.js';
import { areaHa } from '../lib/geo.js';
import AgroAPI from '../api/client.js';

export function live(S, t, i) {
  if (!AgroAPI.isMock) return { hum: t.hum, temp: t.temp, solo: t.solo, ph: t.ph };
  const k = S.tick;
  return {
    hum: t.hum + Math.sin(k * 0.9 + i) * 1.4,
    temp: t.temp + Math.sin(k * 0.7 + i * 2) * 0.4,
    solo: t.solo + Math.sin(k * 0.5 + i) * 0.8,
    ph: t.ph + Math.sin(k * 0.3 + i) * 0.04
  };
}

export const stOf = l => (l.solo < 35 ? ['Crítico', 'crit'] : l.temp > 31 ? ['Atenção', 'warn'] : ['Normal', 'ok']);

export function buildModel(S) {
  const farm = S.fazendas[S.farm] || S.fazendas[0] || { id: null, nome: '—', mun: '—', uf: '', area: 0, prod: '—' };
  const T = S.talhoes.filter(t => t.farmId === farm.id);
  const lives = T.map((t, i) => live(S, t, i));
  const lifeOf = id => { const i = T.findIndex(t => t.id === id); return i < 0 ? null : lives[i]; };

  // sensores da propriedade atual, com o talhão anexado
  const srcSens = S.apiSensors || S.sensors;
  const sens = srcSens
    .filter(x => x.farmId == null || x.farmId === farm.id)
    .map(x => ({ ...x, tal: T.find(t => t.id === x.talId) }))
    .filter(x => x.tal);
  const online = sens.filter(x => !x.off).length;

  // alertas
  const alertFarmObj = S.fazendas[S.alertFarm] || farm;
  const alertsOf = f => (S.apiAlerts && f.id === alertFarmObj.id ? S.apiAlerts : AgroAPI.isMock ? mockAlerts(f.id) : []);
  const isAcked = a => !!S.acked[a.key] || !!a.acked;
  const aBase = alertsOf(alertFarmObj);
  const alertOpenN = aBase.filter(a => !isAcked(a)).length;
  const allAlerts = S.apiAlerts || S.fazendas.flatMap(f => mockAlerts(f.id));
  const totalOpen = allAlerts.filter(a => !isAcked(a)).length;
  const notifAlerts = alertsOf(farm);

  // perfil e acesso
  const role = ROLES.find(r => r.v === S.role) || ROLES[0];
  const acc = ACC[S.role] || ACC.admin;
  const nav = NAV.filter(([k]) => acc[k]);
  const userName = (S.user && S.user.nome) || role.nome;

  // fazendas com contagens calculadas a partir dos dados (corrige números fixos do protótipo)
  const fazendasView = S.fazendas.map(f => {
    if (!AgroAPI.isMock) return f;
    const ts = S.talhoes.filter(t => t.farmId === f.id);
    const ss = S.sensors.filter(x => x.farmId === f.id);
    const avg = ts.length ? Math.round(ts.reduce((a, t) => a + (t.saude || 0), 0) / ts.length) : null;
    return { ...f, talhoes: ts.length, sens: ss.length, culturas: ts.length ? [...new Set(ts.map(t => t.cultura))].join(', ') : 'Sem talhões cadastrados', saude: avg != null ? avg + '%' : '—' };
  });

  const area = t => areaHa(t.pts);

  return { farm, T, lives, lifeOf, sens, online, aBase, alertOpenN, totalOpen, notifAlerts, isAcked, role, acc, nav, userName, fazendasView, area, alertFarmObj };
}
