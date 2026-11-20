// Utilidades de formatação e cores compartilhadas.

export const f1 = (n, d = 1) => (n == null || !isFinite(n) ? '—' : Number(n).toFixed(d).replace('.', ','));

export const ini = n =>
  String(n || '?')
    .split(' ')
    .filter(w => w.length > 2 || /^[A-Z]/.test(w))
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const CULT_COLORS = { Manga: '#F0A830', Uva: '#9B5FC0', Goiaba: '#E86A6A', 'Melão': '#C8D64E' };
export const cultColor = c => CULT_COLORS[c] || '#6FB7C9';

// pares [fundo, texto] por status
export const ST = {
  ok: ['#E3F1E2', '#2B7A3D'],
  warn: ['#FCEBD9', '#B9561A'],
  crit: ['#FBE3DE', '#B3321F'],
  info: ['#E3EEF8', '#2563A0'],
  mute: ['#EFF0EC', '#5F645C']
};
export const st = k => ST[k] || ST.mute;

export const stK = v => (/pend|revis|baixa/i.test(v) ? 'warn' : /inativ|offline|encerr/i.test(v) ? 'mute' : 'ok');

export const PRIO_COLOR = { alta: '#D8452E', media: '#EE8A1F', baixa: '#3FA34D' };
export const PRIO_LABEL = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
export const PRIO_ORDER = { alta: 0, media: 1, baixa: 2 };

export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const timeAgo = sec => {
  const d = new Date(Date.now() - sec * 1000);
  return d.toTimeString().slice(0, 8);
};

export const dateShort = (d = new Date()) => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');

export function download(name, mime, body) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: mime }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export const slug = s => String(s || 'propriedade').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
