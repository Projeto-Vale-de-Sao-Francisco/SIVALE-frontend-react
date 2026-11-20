import { useEffect, useId, useState } from 'react';
import { st } from '../../lib/format.js';

export const Icon = ({ n, fill, size, style, className = '', ...p }) => (
  <span className={'ms ' + (fill ? 'fill ' : '') + className} style={size ? { fontSize: size, ...style } : style} aria-hidden="true" {...p}>{n}</span>
);

export const Badge = ({ k, bg, fg, children, style }) => {
  const c = k ? st(k) : [bg, fg];
  return <span className="badge" style={{ background: c[0], color: c[1], ...style }}>{children}</span>;
};

/** Segmentado: items = [{ v, label, icon? }] */
export function Seg({ items, value, onChange, alt, className = '' }) {
  return (
    <div className={'seg ' + (alt ? 'alt ' : '') + className} role="tablist">
      {items.map(it => (
        <button key={String(it.v)} role="tab" aria-selected={it.v === value} className={it.v === value ? 'on' : ''} onClick={() => onChange(it.v)}>
          {it.icon && <Icon n={it.icon} size={16} />}{it.label}
        </button>
      ))}
    </div>
  );
}

export function Chips({ items, value, onChange }) {
  return (
    <div className="chips">
      {items.map(it => (
        <button key={String(it.v)} className={'chip' + (it.v === value ? ' on' : '')} onClick={() => onChange(it.v)}>{it.label}</button>
      ))}
    </div>
  );
}

/** Dropdown de filtro com ícone, rótulo e valor. options = [{ v, label, dot? }] */
export function Dropdown({ id, open, setOpen, label, icon, w, options, value, onChange }) {
  const sel = options.find(o => o.v === value) || options[0] || { label: '—' };
  return (
    <div className={'dd' + (open ? ' open' : '')} style={{ flex: `1 1 ${w}`, zIndex: open ? 40 : 1 }}>
      <button onClick={() => setOpen(open ? null : id)} aria-haspopup="listbox" aria-expanded={open}>
        <Icon n={icon} className="ic" />
        <span className="lv"><small>{label}</small><b>{sel.label}</b></span>
        <Icon n={open ? 'expand_less' : 'expand_more'} className="chev" />
      </button>
      {open && (
        <div className="dd-menu" role="listbox">
          {options.map(o => (
            <button key={String(o.v)} className={o.v === value ? 'on' : ''} onClick={() => { onChange(o.v); setOpen(null); }}>
              {o.dot && <span className="cdot" style={{ background: o.dot, width: 8, height: 8 }} />}
              <span style={{ flex: 1 }}>{o.label}</span>
              {o.v === value && <Icon n="check" className="ck" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Linha de dropdowns com clique-fora compartilhado. */
export function DropdownRow({ defs }) {
  const [open, setOpen] = useState(null);
  return (
    <>
      {open && <div className="click-away" onClick={() => setOpen(null)} />}
      <div className="dd-row" style={{ position: 'relative', zIndex: open ? 36 : 'auto' }}>
        {defs.map(d => <Dropdown key={d.id} {...d} open={open === d.id} setOpen={setOpen} />)}
      </div>
    </>
  );
}

/**
 * Tabela responsiva. cols = [{ k, label, w, render?, main?, wide? }]
 * Desktop: grade com rolagem horizontal. Mobile (≤760px): cartões empilhados com rótulos.
 */
export function DataTable({ cols, rows, minW = 700, rowKey, onRow, rowStyle, empty = 'Nenhum registro.' }) {
  const tpl = cols.map(c => c.w || '1fr').join(' ');
  return (
    <div className="dt-scroll">
      <div className="dt-inner" style={{ '--minw': minW + 'px', '--cols': tpl }}>
        <div className="dt-head">{cols.map(c => <span key={c.k}>{c.label}</span>)}</div>
        {rows.map((r, i) => (
          <div key={rowKey ? rowKey(r, i) : i} className={'dt-row' + (onRow ? ' click' : '')} onClick={onRow ? () => onRow(r) : undefined} style={rowStyle ? rowStyle(r) : undefined}>
            {cols.map(c => (
              <span key={c.k} className={c.main ? 'dt-main' : c.wide ? 'dt-wide' : ''} data-label={c.main ? undefined : c.label} style={c.style}>
                {c.render ? c.render(r) : r[c.k]}
              </span>
            ))}
          </div>
        ))}
        {!rows.length && <div className="empty">{empty}</div>}
      </div>
    </div>
  );
}

export function Dialog({ onClose, children, className = '' }) {
  useEffect(() => {
    const k = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className={'dialog ' + className} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export const DialogHead = ({ title, sub, onClose }) => (
  <div className="dialog-h">
    <div className="tblock"><h3>{title}</h3>{sub && <span className="sub">{sub}</span>}</div>
    <button className="x-btn" onClick={onClose} aria-label="Fechar"><Icon n="close" /></button>
  </div>
);

export const Toggle = ({ on, onClick, label }) => (
  <button className={'toggle' + (on ? ' on' : '')} onClick={onClick} role="switch" aria-checked={on} aria-label={label}><i /></button>
);

/**
 * Gráfico de linhas/área em SVG. series = [{ v:[], color, area?, dash?, band?:[lo[],hi[]] }]
 * Com `labels` exibe dica ao passar o mouse.
 */
export function LineChart({ series, h = 180, min, max, marker, fmt, labels }) {
  const gid = useId().replace(/:/g, '');
  const [hv, setHv] = useState(null);
  const W = 600, H = h;
  const all = series.flatMap(s => s.v.concat(s.band ? s.band[0].concat(s.band[1]) : [])).filter(v => v != null && isFinite(v));
  if (!all.length) return <div className="empty">Sem dados no período.</div>;
  const mn = min ?? Math.min(...all), mx = max ?? Math.max(...all), rg = mx - mn || 1;
  const n = Math.max(2, ...series.map(s => s.v.length));
  const X = i => (i / (n - 1)) * W, Y = v => H - 8 - ((v - mn) / rg) * (H - 16);
  const pts = v => v.map((y, i) => (y == null ? null : [X(i), Y(y)])).filter(Boolean);
  const d = p => 'M' + p.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L');
  const onMove = e => {
    if (!fmt) return;
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setHv(Math.max(0, Math.min(n - 1, i)));
  };
  const s0 = series[0];
  const hvVal = hv != null ? s0.v[hv] ?? (series[1] && series[1].v[hv]) : null;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} onMouseMove={onMove} onMouseLeave={() => setHv(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          {series.map((s, si) => s.area && (
            <linearGradient key={si} id={gid + si} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity=".25" /><stop offset="1" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {[0, 1, 2, 3].map(i => <line key={i} x1="0" x2={W} y1={8 + (i * (H - 16)) / 3} y2={8 + (i * (H - 16)) / 3} stroke="#EEF0EA" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
        {series.map((s, si) => {
          const p = pts(s.v);
          if (!p.length) return null;
          const out = [];
          if (s.band) { const up = pts(s.band[1]), lo = pts(s.band[0]).reverse(); out.push(<path key="b" d={d(up.concat(lo)) + ' Z'} fill={s.color} opacity=".16" />); }
          if (s.area) out.push(<path key="a" d={d(p) + ` L${p[p.length - 1][0]} ${H} L${p[0][0]} ${H} Z`} fill={`url(#${gid + si})`} />);
          out.push(<path key="l" d={d(p)} fill="none" stroke={s.color} strokeWidth="2.4" strokeDasharray={s.dash ? '6 5' : undefined} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />);
          return <g key={si}>{out}</g>;
        })}
        {marker != null && <line x1={X(marker)} x2={X(marker)} y1="0" y2={H} stroke="#1A1E19" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
        {hv != null && <line x1={X(hv)} x2={X(hv)} y1="0" y2={H} stroke="#9AA096" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hv != null && hvVal != null && (
        <span style={{ position: 'absolute', left: `${(hv / (n - 1)) * 100}%`, top: `${(Y(hvVal) / H) * 100}%`, transform: `translate(${hv > n * 0.7 ? '-110%' : '10%'}, -120%)`, background: '#1E231D', color: '#fff', borderRadius: 8, padding: '5px 8px', fontSize: 11.5, whiteSpace: 'nowrap', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <b style={{ fontWeight: 600 }}>{fmt(hvVal)}</b>{labels && <span style={{ opacity: 0.75 }}>{labels(hv)}</span>}
        </span>
      )}
    </div>
  );
}
