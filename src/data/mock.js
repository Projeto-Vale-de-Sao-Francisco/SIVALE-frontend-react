// Dados de demonstração. Coordenadas reais (WGS84) para o mapa.
import { fromCanvas, centroid } from '../lib/geo.js';

export const FARMS = [
  { id: 1, nome: 'Fazenda Santa Helena', mun: 'Petrolina', uf: 'PE', area: 1240, prod: 'Marcos Ribeiro', status: 'Ativa', lat: -9.3362, lng: -40.5958 },
  { id: 2, nome: 'Fazenda Boa Vista', mun: 'Juazeiro', uf: 'BA', area: 3180, prod: 'Agrícola Boa Vista Ltda.', status: 'Ativa', lat: -9.4372, lng: -40.3911 },
  { id: 3, nome: 'Sítio Três Irmãos', mun: 'Mossoró', uf: 'RN', area: 186, prod: 'Cooperativa Três Irmãos', status: 'Ativa', lat: -5.0634, lng: -37.4128 }
];

const sh = [FARMS[0].lat, FARMS[0].lng];
const bv = [FARMS[1].lat, FARMS[1].lng];
const ti = [FARMS[2].lat, FARMS[2].lng];

const T = (farmId, center, o) => ({ farmId, ...o, pts: fromCanvas(center, o.pts) });

// grade levemente inclinada para gerar talhões de outras propriedades
const cell = (c, r, w = 230, h = 150) => {
  const x = 110 + c * 270, y = 60 + r * 180, sk = 14;
  return [[x, y + sk], [x + w, y], [x + w + 8, y + h], [x + 6, y + h + sk]];
};

export const TALHOES = [
  // ---------- Fazenda Santa Helena (layout original do protótipo) ----------
  T(1, sh, { id: 'T-01', nome: 'Talhão Norte', cultura: 'Manga', variedade: 'Palmer', pts: [[120, 90], [330, 70], [350, 230], [140, 250]], hum: 58, temp: 29.1, solo: 43, ph: 6.2, prio: 'baixa', saude: 86, plantio: '12 jul 26', colheita: '05 dez 26', est: 3, reason: 'Leituras dentro da faixa recomendada' }),
  T(1, sh, { id: 'T-02', nome: 'Talhão Lagoa', cultura: 'Uva', variedade: 'Vitória', pts: [[400, 110], [560, 95], [580, 260], [415, 275]], hum: 48, temp: 32.8, solo: 33, ph: 5.9, prio: 'alta', saude: 64, plantio: '28 ago 26', colheita: '10 dez 26', est: 3, reason: 'Temperatura acima do recomendado para uva (20–30 °C)' }),
  T(1, sh, { id: 'T-03', nome: 'Goiabal Encosta', cultura: 'Goiaba', variedade: 'Paluma', pts: [[640, 60], [860, 90], [840, 230], [620, 210]], hum: 66, temp: 27.2, solo: 39, ph: 6.0, prio: 'media', saude: 78, plantio: '15 jun 26', colheita: '20 dez 26', est: 2, reason: 'Sensor SN-105 com bateria em 14%' }),
  T(1, sh, { id: 'T-04', nome: 'Talhão Sul', cultura: 'Melão', variedade: 'Amarelo', pts: [[150, 330], [360, 310], [380, 520], [170, 545]], hum: 44, temp: 33.4, solo: 30, ph: 6.4, prio: 'alta', saude: 58, plantio: '10 out 26', colheita: '20 dez 26', est: 2, reason: 'Temperatura acima de 32 °C e sensor offline' }),
  T(1, sh, { id: 'T-05', nome: 'Pivô Central', cultura: 'Manga', variedade: 'Tommy Atkins', pts: [[440, 340], [640, 320], [660, 500], [455, 520]], hum: 61, temp: 27.6, solo: 47, ph: 6.3, prio: 'baixa', saude: 91, plantio: '02 ago 26', colheita: '15 jan 27', est: 2, reason: 'Irrigação estável' }),
  T(1, sh, { id: 'T-06', nome: 'Várzea', cultura: 'Uva', variedade: 'Thompson', pts: [[720, 300], [900, 320], [880, 520], [700, 500]], hum: 56, temp: 28.9, solo: 44, ph: 5.2, prio: 'media', saude: 74, plantio: '05 set 26', colheita: '28 dez 26', est: 1, reason: 'pH do solo abaixo de 5,5' }),

  // ---------- Fazenda Boa Vista ----------
  T(2, bv, { id: 'BV-01', nome: 'Uva Vitória', cultura: 'Uva', variedade: 'Vitória', pts: cell(0, 0), hum: 55, temp: 29.4, solo: 41, ph: 5.3, prio: 'media', saude: 76, plantio: '20 ago 26', colheita: '08 dez 26', est: 3, reason: 'pH do solo abaixo de 5,5' }),
  T(2, bv, { id: 'BV-02', nome: 'Uva Thompson', cultura: 'Uva', variedade: 'Thompson', pts: cell(1, 0), hum: 57, temp: 28.6, solo: 44, ph: 6.1, prio: 'baixa', saude: 88, plantio: '02 set 26', colheita: '18 dez 26', est: 2, reason: 'Leituras dentro da faixa recomendada' }),
  T(2, bv, { id: 'BV-03', nome: 'Uva Crimson', cultura: 'Uva', variedade: 'Crimson', pts: cell(2, 0), hum: 47, temp: 32.6, solo: 34, ph: 6.0, prio: 'alta', saude: 62, plantio: '25 ago 26', colheita: '12 dez 26', est: 3, reason: 'Temperatura acima do recomendado para uva (20–30 °C)' }),
  T(2, bv, { id: 'BV-04', nome: 'Manga Tommy', cultura: 'Manga', variedade: 'Tommy Atkins', pts: cell(0, 1), hum: 60, temp: 28.1, solo: 45, ph: 6.4, prio: 'baixa', saude: 90, plantio: '10 jul 26', colheita: '02 dez 26', est: 3, reason: 'Irrigação estável' }),
  T(2, bv, { id: 'BV-05', nome: 'Manga Palmer', cultura: 'Manga', variedade: 'Palmer', pts: cell(1, 1), hum: 59, temp: 28.8, solo: 42, ph: 6.2, prio: 'media', saude: 79, plantio: '18 jul 26', colheita: '10 dez 26', est: 3, reason: 'Sensor SN-209 com bateria em 14%' }),
  T(2, bv, { id: 'BV-06', nome: 'Manga Keitt', cultura: 'Manga', variedade: 'Keitt', pts: cell(2, 1), hum: 62, temp: 27.9, solo: 46, ph: 6.3, prio: 'baixa', saude: 87, plantio: '01 ago 26', colheita: '20 jan 27', est: 2, reason: 'Leituras dentro da faixa recomendada' }),
  T(2, bv, { id: 'BV-07', nome: 'Manga Kent', cultura: 'Manga', variedade: 'Kent', pts: cell(0, 2), hum: 45, temp: 31.8, solo: 36, ph: 6.1, prio: 'alta', saude: 61, plantio: '05 ago 26', colheita: '15 jan 27', est: 2, reason: 'Umidade do ar baixa e sensor offline' }),
  T(2, bv, { id: 'BV-08', nome: 'Uva Arra 15', cultura: 'Uva', variedade: 'Arra 15', pts: cell(1, 2), hum: 58, temp: 28.4, solo: 43, ph: 6.0, prio: 'baixa', saude: 84, plantio: '12 set 26', colheita: '30 dez 26', est: 1, reason: 'Leituras dentro da faixa recomendada' }),
  T(2, bv, { id: 'BV-09', nome: 'Manga Palmer Sul', cultura: 'Manga', variedade: 'Palmer', pts: cell(2, 2), hum: 61, temp: 28.2, solo: 44, ph: 6.3, prio: 'baixa', saude: 89, plantio: '22 jul 26', colheita: '18 dez 26', est: 2, reason: 'Irrigação estável' }),

  // ---------- Sítio Três Irmãos ----------
  T(3, ti, { id: 'TI-01', nome: 'Melão Amarelo', cultura: 'Melão', variedade: 'Amarelo', pts: [[160, 140], [440, 120], [460, 330], [180, 350]], hum: 46, temp: 32.4, solo: 35, ph: 6.4, prio: 'alta', saude: 63, plantio: '08 out 26', colheita: '17 dez 26', est: 2, reason: 'Umidade do ar abaixo de 50% e sensor offline' }),
  T(3, ti, { id: 'TI-02', nome: 'Melão Gália', cultura: 'Melão', variedade: 'Gália', pts: [[500, 110], [800, 95], [820, 300], [520, 320]], hum: 49, temp: 33.1, solo: 33, ph: 6.3, prio: 'alta', saude: 59, plantio: '12 out 26', colheita: '21 dez 26', est: 2, reason: 'Temperatura acima de 32 °C' }),
  T(3, ti, { id: 'TI-03', nome: 'Pele de Sapo', cultura: 'Melão', variedade: 'Pele de Sapo', pts: [[300, 390], [640, 375], [655, 540], [315, 555]], hum: 54, temp: 30.2, solo: 41, ph: 5.3, prio: 'media', saude: 75, plantio: '20 out 26', colheita: '29 dez 26', est: 1, reason: 'pH do solo abaixo de 5,5' })
];

// dois sensores por talhão (estação climática + sonda de solo), entre o centro e os vértices 0 e 2
const SENSOR_BASE = { 1: 101, 2: 201, 3: 301 };
const OFFLINE = { 'T-04': 1, 'BV-07': 1, 'TI-01': 1 };
const LOW_BAT = { 'SN-105': 14, 'SN-209': 14, 'SN-301': 14 };
export function buildMockSensors(talhoes) {
  const counters = { ...SENSOR_BASE };
  const out = [];
  talhoes.forEach((t, i) => {
    const c = centroid(t.pts);
    [0, 2].forEach((pi, j) => {
      const base = counters[t.farmId] ?? 901;
      counters[t.farmId] = base + 1;
      const p = t.pts[pi] || t.pts[0];
      const id = 'SN-' + base;
      const off = OFFLINE[t.id] === j;
      out.push({
        id, talId: t.id, farmId: t.farmId,
        lat: c[0] + (p[0] - c[0]) * 0.72, lng: c[1] + (p[1] - c[1]) * 0.72,
        off, tipo: j ? 'Sonda de solo' : 'Estação climática',
        bat: LOW_BAT[id] ?? (off ? 0 : 52 + ((i * 17 + j * 23) % 46)),
        sinal: -(68 + ((i * 7 + j * 11) % 30)),
        fw: (i * 2 + j) % 5 === 3 ? 'v2.3.1' : 'v2.4.0'
      });
    });
  });
  return out;
}

// alertas de demonstração por propriedade
const AL = {
  1: { tal: ['T-02 · Talhão Lagoa', 'T-04 · Talhão Sul', 'T-06 · Várzea', 'T-03 · Goiabal Encosta'], cult: 'uvas', faixa: 'Uva é de 20 a 30 °C', off: 'SN-108', bat: 'SN-105' },
  2: { tal: ['BV-03 · Uva Crimson', 'BV-07 · Manga Kent', 'BV-01 · Uva Vitória', 'BV-05 · Manga Palmer'], cult: 'uvas', faixa: 'Uva é de 20 a 30 °C', off: 'SN-214', bat: 'SN-209' },
  3: { tal: ['TI-02 · Melão Gália', 'TI-01 · Melão Amarelo', 'TI-03 · Pele de Sapo', 'TI-01 · Melão Amarelo'], cult: 'melões', faixa: 'Melão é de 25 a 32 °C', off: 'SN-302', bat: 'SN-301' }
};
export function mockAlerts(farmId) {
  const a = AL[farmId];
  if (!a) return [];
  return [
    { sev: 'crit', icon: 'device_thermostat', title: 'Temperatura acima do recomendado para o lote de ' + a.cult, desc: 'Leitura de 32,8 °C às 13:40. A faixa recomendada para ' + a.faixa + '.', tal: a.tal[0], hora: 'há 8 min' },
    { sev: 'crit', icon: 'water_drop', title: 'Umidade do solo crítica', desc: 'Leitura de 33 kPa, abaixo do limite de 35 kPa por mais de 6 horas.', tal: a.tal[0], hora: 'há 12 min' },
    { sev: 'crit', icon: 'sensors_off', title: 'Sensor sem comunicação', desc: a.off + ' não envia dados desde 05:40. Verificar bateria ou gateway.', tal: a.tal[1], hora: 'há 1 h' },
    { sev: 'warn', icon: 'humidity_low', title: 'Umidade do ar abaixo do recomendado', desc: 'Média de 44% nas últimas 6 h. Faixa recomendada para a cultura: 50 a 70%.', tal: a.tal[1], hora: 'há 2 h' },
    { sev: 'warn', icon: 'science', title: 'pH do solo baixo', desc: 'Média de 5,2 nos últimos 7 dias. Avaliar calagem.', tal: a.tal[2], hora: 'há 5 h' },
    { sev: 'info', icon: 'battery_2_bar', title: 'Bateria baixa', desc: a.bat + ' com 14% de carga. Troca recomendada em até 5 dias.', tal: a.tal[3], hora: 'ontem' }
  ].map((x, i) => ({ ...x, key: farmId + '-' + i, farmId }));
}

export function mockPlan(farmId) {
  const a = AL[farmId];
  if (!a) return [];
  return [
    { dow: 'Qui', dia: '20', tasks: [{ txt: 'Irrigar 12 mm', hora: '06:00', tal: a.tal[0], c: '#2F7BC4' }, { txt: 'Inspecionar gateway e trocar bateria', hora: '09:00', tal: a.tal[1], c: '#EE6A1F' }] },
    { dow: 'Sex', dia: '21', tasks: [{ txt: 'Monitorar temperatura no pico', hora: '13:00', tal: a.tal[1], c: '#D8452E' }] },
    { dow: 'Seg', dia: '24', tasks: [{ txt: 'Coleta de solo para análise de pH', hora: '07:30', tal: a.tal[2], c: '#8A5A3C' }, { txt: 'Substituir bateria ' + a.bat, hora: '10:00', tal: a.tal[3], c: '#EE6A1F' }] },
    { dow: 'Qua', dia: '26', tasks: [{ txt: 'Aplicação de calcário (simulada)', hora: '07:00', tal: a.tal[2], c: '#2F8F46' }] }
  ];
}

export const PRODUTORES = [
  { nome: 'Marcos Ribeiro', email: 'marcos@santahelena.agr.br', doc: 'CPF 412.***.***-08', tel: '(87) 99812-4410', cidade: 'Petrolina', uf: 'PE', resp: 'Marcos Ribeiro' },
  { nome: 'Agrícola Boa Vista Ltda.', email: 'contato@boavista.agr.br', doc: 'CNPJ 31.***.***/0001-52', tel: '(74) 99654-2201', cidade: 'Juazeiro', uf: 'BA', resp: 'Ana Paula Ferraz' },
  { nome: 'Cooperativa Três Irmãos', email: 'coop@tresirmaos.com.br', doc: 'CNPJ 08.***.***/0001-19', tel: '(84) 99120-7735', cidade: 'Mossoró', uf: 'RN', resp: 'Kenji Tanaka' },
  { nome: 'Vale Export Frutas S.A.', email: 'comercial@valeexport.com.br', doc: 'CNPJ 22.***.***/0001-70', tel: '(87) 3862-1100', cidade: 'Petrolina', uf: 'PE', resp: 'Joaquim Siqueira' }
];

export const CULTURAS = [
  { nome: 'Manga', variedade: 'Palmer, Tommy Atkins, Kent', temp: '24 – 30 °C', umid: '50 – 70%', ciclo: '120 dias', desc: 'Perene. Principal fruta de exportação da propriedade.' },
  { nome: 'Uva', variedade: 'Vitória, Thompson, Crimson', temp: '20 – 30 °C', umid: '45 – 65%', ciclo: '120 dias', desc: 'Duas safras por ano com poda programada.' },
  { nome: 'Goiaba', variedade: 'Paluma', temp: '23 – 30 °C', umid: '60 – 80%', ciclo: '180 dias', desc: 'Mercado interno e indústria de polpa.' },
  { nome: 'Melão', variedade: 'Amarelo, Gália, Pele de Sapo', temp: '25 – 32 °C', umid: '50 – 70%', ciclo: '70 dias', desc: 'Ciclo curto, exportação para Reino Unido e UE.' }
];

export const USUARIOS = [
  { nome: 'Marcos Ribeiro', cpf: '412.***.***-08', email: 'marcos@santahelena.agr.br', tel: '(87) 99812-4410', perfil: 'Administrador', escopo: 'Todas as propriedades', ult: 'Agora', status: 'Ativo' },
  { nome: 'Ana Paula Ferraz', cpf: '305.***.***-17', email: 'ana@boavista.agr.br', tel: '(74) 99654-2201', perfil: 'Produtor', escopo: 'Fazenda Boa Vista', ult: 'há 20 min', status: 'Ativo' },
  { nome: 'Juliana Costa', cpf: '198.***.***-33', email: 'juliana.costa@agro.com.br', tel: '(87) 98120-4471', perfil: 'Analista', escopo: 'Santa Helena · Boa Vista', ult: 'há 1 h', status: 'Ativo' },
  { nome: 'Rafael Moura', cpf: '221.***.***-90', email: 'rafael@santahelena.agr.br', tel: '(87) 99103-2288', perfil: 'Operador', escopo: 'Santa Helena · T-01 a T-06', ult: 'há 2 h', status: 'Ativo' },
  { nome: 'Kenji Tanaka', cpf: '076.***.***-52', email: 'kenji@tresirmaos.com.br', tel: '(84) 99120-7735', perfil: 'Produtor', escopo: 'Sítio Três Irmãos', ult: 'há 3 dias', status: 'Inativo' },
  { nome: 'Lucas Almeida', cpf: '341.***.***-04', email: 'lucas.almeida@gmail.com', tel: '(74) 98877-1203', perfil: 'Operador', escopo: 'Fazenda Boa Vista', ult: '—', status: 'Convite pendente' }
];

export const MERCADO = [
  { cultura: 'Manga', mercado: 'Roterdã (Países Baixos)', preco: '1,45', moeda: 'EUR/kg', data: '15/11/2026', demanda: 'Alta · 1.200 t/semana' },
  { cultura: 'Manga', mercado: 'Filadélfia (EUA)', preco: '1,62', moeda: 'USD/kg', data: '15/11/2026', demanda: 'Alta · 800 t/semana' },
  { cultura: 'Uva', mercado: 'CEAGESP (SP)', preco: '9,80', moeda: 'BRL/kg', data: '18/11/2026', demanda: 'Alta · fim de ano' },
  { cultura: 'Melão', mercado: 'Londres (Reino Unido)', preco: '1,10', moeda: 'GBP/kg', data: '14/11/2026', demanda: 'Média · 450 t/semana' },
  { cultura: 'Goiaba', mercado: 'Recife (PE)', preco: '3,40', moeda: 'BRL/kg', data: '17/11/2026', demanda: 'Média' }
];

export const LOGISTICA = [
  { origem: 'Petrolina (PE)', destino: 'Porto de Pecém (CE)', modal: 'Rodoviário refrigerado', tempo: '14 h', custo: 'R$ 6.800 / carga', transp: 'Frio Norte', sit: 'Ativa' },
  { origem: 'Porto de Pecém (CE)', destino: 'Roterdã (Países Baixos)', modal: 'Marítimo · contêiner reefer', tempo: '11 dias', custo: 'US$ 4.900 / contêiner', transp: 'Armador parceiro', sit: 'Ativa' },
  { origem: 'Petrolina (PE)', destino: 'CEAGESP (SP)', modal: 'Rodoviário refrigerado', tempo: '38 h', custo: 'R$ 9.200 / carga', transp: 'TransVale', sit: 'Ativa' },
  { origem: 'Mossoró (RN)', destino: 'Porto de Natal (RN)', modal: 'Rodoviário refrigerado', tempo: '5 h', custo: 'R$ 2.100 / carga', transp: 'Potiguar Cargas', sit: 'Em revisão' }
];

export const ROTAS = [
  { id: 'RT-0412', carga: 'Manga Palmer · 1.240 caixas de 4 kg', origem: 'Santa Helena · Packing house', destino: 'Porto de Pecém · CE', transp: 'Frio Norte', placa: 'PEX-4B21', prazo: 'Hoje, 22:00', eta: 'Chega em 6 h', e: 1, s: 'info', st: 'Em trânsito' },
  { id: 'RT-0413', carga: 'Uva Vitória · 18 t', origem: 'Santa Helena · Câmara fria 2', destino: 'CEAGESP · São Paulo, SP', transp: 'TransVale', placa: 'PFL-7C04', prazo: 'Amanhã, 18:00', eta: 'Aguardando doca', e: 0, s: 'warn', st: 'Carregando' },
  { id: 'RT-0409', carga: 'Melão amarelo · 22 t', origem: 'Três Irmãos · Packing house', destino: 'Porto de Natal · RN', transp: 'Potiguar Cargas', placa: 'QGT-2A88', prazo: 'Ontem, 14:00', eta: 'Atraso de 5 h', e: 2, s: 'crit', st: 'Atrasada' },
  { id: 'RT-0405', carga: 'Manga Tommy Atkins · 20 t', origem: 'Santa Helena · Packing house', destino: 'Porto de Salvador · BA', transp: 'Frio Norte', placa: 'PEX-1D67', prazo: '17 nov, 09:00', eta: 'Entregue 08:12', e: 3, s: 'ok', st: 'Entregue' }
];

export const AUDIT = [
  ['19/11 14:22', 'tune', 'Marcos Ribeiro', 'alterou a faixa de temperatura recomendada da cultura', 'Uva → 20 – 30 °C', '177.38.12.4'],
  ['19/11 13:05', 'check_circle', 'Rafael Moura', 'reconheceu o alerta', 'Temperatura acima do recomendado · T-02', '189.44.201.17'],
  ['19/11 11:48', 'local_shipping', 'Rafael Moura', 'criou a rota', 'RT-0413 · Uva Vitória 18 t', '189.44.201.17'],
  ['19/11 09:30', 'storefront', 'Juliana Costa', 'cadastrou dado de mercado', 'Manga · Roterdã · € 1,45/kg', '200.150.8.92'],
  ['18/11 17:12', 'sensors', 'Marcos Ribeiro', 'cadastrou o sensor', 'SN-112 · Sonda de solo · T-06', '177.38.12.4'],
  ['18/11 15:40', 'person_add', 'Marcos Ribeiro', 'cadastrou o usuário', 'Lucas Almeida · Operador', '177.38.12.4'],
  ['18/11 08:02', 'login', 'Ana Paula Ferraz', 'entrou na aplicação', 'Sessão web', '45.170.33.9'],
  ['17/11 16:55', 'lock', 'Sistema', 'bloqueou acesso negado ao módulo', 'Administração · perfil Analista', '200.150.8.92']
].map(a => ({ t: a[0], icon: a[1], who: a[2], acao: a[3], alvo: a[4], ip: a[5] }));

// janelas de colheita/exportação (dias a partir de 23/11/2026)
export const JANELAS = {
  'T-01': [8, 19, 17, 31, 'Roterdã (UE)', 'Maturação em 82% e preço na UE 6% acima da média de 90 dias'],
  'T-02': [11, 21, 15, 27, 'CEAGESP (SP)', 'Temperatura alta acelera a maturação; demanda de fim de ano'],
  'T-03': [22, 35, 25, 43, 'Recife (PE)', 'Calibre ideal previsto para a 2ª quinzena de dezembro'],
  'T-04': [22, 31, 27, 48, 'Londres (UK)', 'Ciclo de 70 dias e saída semanal de navio em Natal'],
  'T-05': [48, 60, 53, 69, 'Filadélfia (EUA)', 'Janela de menor oferta do Peru no mercado americano'],
  'T-06': [29, 43, 33, 48, 'Roterdã (UE)', 'Brix acima de 16 previsto após 22 de dezembro'],
  'BV-01': [10, 20, 14, 26, 'CEAGESP (SP)', 'Demanda de fim de ano e maturação acelerada'],
  'BV-03': [12, 22, 16, 28, 'Roterdã (UE)', 'Crimson com coloração ideal na 1ª quinzena'],
  'BV-04': [6, 14, 12, 24, 'Roterdã (UE)', 'Maturação adiantada e navio semanal em Pecém'],
  'BV-05': [14, 26, 20, 34, 'Filadélfia (EUA)', 'Calibre acima da média e menor oferta peruana'],
  'BV-07': [40, 54, 46, 62, 'Roterdã (UE)', 'Kent precisa de mais 6 semanas para atingir o Brix'],
  'TI-01': [20, 28, 24, 36, 'Londres (UK)', 'Ciclo de 70 dias e saída semanal pelo Porto de Natal'],
  'TI-02': [24, 32, 27, 40, 'Londres (UK)', 'Contratos no Reino Unido sobem na 2ª quinzena'],
  'TI-03': [30, 40, 34, 48, 'Roterdã (UE)', 'Pele de Sapo com boa conservação para rota marítima']
};

export const INSIGHTS = {
  'T-01': 'Maturação em 82%. Manter a umidade do solo entre 40 e 45 kPa até a colheita para preservar o calibre.',
  'T-02': 'Temperatura acima de 30 °C para uva. Irrigar 12 mm e avaliar sombreamento nas horas mais quentes.',
  'T-03': 'Substituir a bateria do SN-105 para não perder o histórico de umidade na frutificação.',
  'T-04': 'Verificar o gateway Sul: SN-108 offline. Melão acima de 32 °C exige acompanhamento.',
  'T-05': 'Condições ideais. Reduzir a lâmina do pivô em 10% pode economizar energia sem perda.',
  'T-06': 'pH 5,2 limita a absorção de fósforo. Avaliar calagem antes da próxima poda.',
  'BV-03': 'Temperatura acima de 30 °C para uva Crimson. Irrigar 10 mm no fim da tarde.',
  'BV-07': 'SN-214 offline e umidade do ar baixa. Verificar o gateway antes da floração.',
  'TI-02': 'Melão Gália acima de 32 °C. Antecipar a irrigação para as 05:00.'
};

export const ROLES = [
  { v: 'admin', label: 'Administrador', email: 'marcos@santahelena.agr.br', nome: 'Marcos Ribeiro' },
  { v: 'prod', label: 'Produtor', email: 'ana@boavista.agr.br', nome: 'Ana Paula Ferraz' },
  { v: 'anal', label: 'Analista', email: 'juliana.costa@agro.com.br', nome: 'Juliana Costa' },
  { v: 'oper', label: 'Operador', email: 'rafael@santahelena.agr.br', nome: 'Rafael Moura' }
];

// 2 = total · 1 = leitura · 0 = sem acesso
export const ACC = {
  admin: { overview: 2, mapa: 2, mon: 2, faz: 2, tal: 2, col: 2, ia: 2, eq: 2, al: 2, mk: 2, adm: 2 },
  prod: { overview: 2, mapa: 2, mon: 2, faz: 2, tal: 2, col: 2, ia: 2, eq: 2, al: 2, mk: 2, adm: 0 },
  anal: { overview: 1, mapa: 1, mon: 1, faz: 0, tal: 0, col: 1, ia: 1, eq: 0, al: 1, mk: 2, adm: 0 },
  oper: { overview: 1, mapa: 1, mon: 2, faz: 0, tal: 2, col: 2, ia: 0, eq: 2, al: 2, mk: 0, adm: 0 }
};

export const NAV = [
  ['overview', 'Visão geral', 'dashboard'],
  ['mapa', 'Mapa', 'map'],
  ['mon', 'Monitoramento', 'monitoring'],
  ['faz', 'Fazendas', 'agriculture'],
  ['tal', 'Talhões', 'pentagon'],
  ['col', 'Colheita e logística', 'local_shipping'],
  ['ia', 'Predições de IA', 'auto_awesome'],
  ['eq', 'Equipamentos', 'sensors'],
  ['al', 'Alertas', 'notifications'],
  ['mk', 'Mercado', 'trending_up'],
  ['adm', 'Administração', 'admin_panel_settings']
];

export const MARKET_BASE = { Manga: [4.8, 'R$/kg'], Uva: [9.6, 'R$/kg'], Goiaba: [3.2, 'R$/kg'], 'Melão': [2.9, 'R$/kg'] };
export const MARKET_DESTS = { 'Petrolina (PE)': [1, 0], 'CEAGESP (SP)': [1.18, 0.45], 'Roterdã (Países Baixos)': [1.62, 1.1], 'Filadélfia (EUA)': [1.75, 1.35], 'Londres (Reino Unido)': [1.68, 1.2] };
