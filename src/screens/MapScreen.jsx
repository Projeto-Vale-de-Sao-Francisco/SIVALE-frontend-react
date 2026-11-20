import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../state/store.jsx';
import { Icon, LineChart } from '../components/ui/index.jsx';
import FarmMap, { MiniMap, tColor } from '../components/map/FarmMap.jsx';
import { f1, timeAgo } from '../lib/format.js';
import { areaHa } from '../lib/geo.js';
import { INSIGHTS } from '../data/mock.js';

export default function MapScreen() {
  const { S, M, A, set } = useApp();
  const { T, lives, sens, online } = M;
  const mm = S.mapMode;
  const [map, setMap] = useState(null);
  const [menu, setMenu] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [cardMin, setCardMin] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const [q, setQ] = useState('');
  const [qOpen, setQOpen] = useState(false);
  const [qi, setQi] = useState(0);
  const boxRef = useRef(null);
  const searchRef = useRef(null);
  const canEdit = M.acc.tal === 2;
  const has = T.length > 0;

  // atalho "/" para buscar
  useEffect(() => {
    const k = e => {
      if (e.key === '/' && document.activeElement && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); searchRef.current && searchRef.current.focus(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const avg = k => (has ? lives.reduce((a, l) => a + l[k], 0) / lives.length : null);
  const mx = k => (has ? Math.max(...lives.map(l => l[k])) : null);
  const mn = k => (has ? Math.min(...lives.map(l => l[k])) : null);
  const idxOf = (k, fn) => { if (!has) return null; const vals = lives.map(l => l[k]); return T[vals.indexOf(fn(...vals))].id; };

  const kAvg = [
    { label: 'Umidade média', icon: 'humidity_percentage', val: f1(avg('hum'), 0), unit: '%', max: f1(mx('hum'), 0) + '%', min: f1(mn('hum'), 0) + '%' },
    { label: 'Temperatura média', icon: 'device_thermostat', val: f1(avg('temp')), unit: '°C', max: f1(mx('temp')) + '°', min: f1(mn('temp')) + '°' },
    { label: 'Umidade do solo', icon: 'water_drop', val: f1(avg('solo'), 0), unit: 'kPa', max: f1(mx('solo'), 0), min: f1(mn('solo'), 0) },
    { label: 'pH médio', icon: 'science', val: f1(avg('ph')), unit: '', max: f1(mx('ph')), min: f1(mn('ph')) }
  ];
  const mapStats = mm === 'umidade'
    ? [['Umidade média', f1(avg('hum'), 0) + '%'], ['Umidade do solo', f1(avg('solo'), 0) + ' kPa'], ['Mais seco', idxOf('hum', Math.min) || '—'], ['Mais úmido', idxOf('hum', Math.max) || '—']]
    : mm === 'temperatura'
      ? [['Temperatura média', f1(avg('temp')) + ' °C'], ['Amplitude', has ? f1(mx('temp') - mn('temp')) + ' °C' : '—'], ['Mais quente', idxOf('temp', Math.max) || '—'], ['Mais ameno', idxOf('temp', Math.min) || '—']]
      : [['Talhões monitorados', String(T.length)], ['Sensores online', online + '/' + sens.length], ['Leituras/hora', String(sens.length * 12)], ['Latência média', '1,8 s']];
  const legend = mm === 'umidade' ? { title: 'Umidade do ar', grad: 'linear-gradient(90deg,hsl(45 70% 52%),hsl(128 70% 52%),hsl(210 70% 52%))', lo: '35% seco', hi: '75% úmido' }
    : mm === 'temperatura' ? { title: 'Temperatura', grad: 'linear-gradient(90deg,hsl(130 75% 50%),hsl(60 75% 50%),hsl(5 75% 50%))', lo: '24 °C', hi: '33 °C' }
      : { title: 'Sinal dos sensores', grad: 'linear-gradient(90deg,#D8452E,#E8C547,#3FA34D)', lo: '-100 fraco', hi: '-60 forte' };

  const si = T.findIndex(t => t.id === S.sel);
  const stt = T[si];
  const sl = stt && lives[si];
  const selSens = stt ? sens.filter(x => x.tal === stt) : [];
  const saudeTxt = stt ? (stt.saude >= 80 ? 'Boa' : stt.saude >= 65 ? 'Regular' : 'Atenção') : '';
  const selLog = selSens.flatMap((sn, j) => [0, 1].map(k => ({ key: sn.id + k, hora: timeAgo((j * 2 + k) * 300).slice(0, 5), sensor: sn.id, val: sn.off ? 'sem sinal' : f1(stt.solo + Math.sin(S.tick - k + j), 0) + ' kPa' })));

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return T.filter(t => (t.id + ' ' + t.nome + ' ' + t.cultura + ' ' + (t.variedade || '')).toLowerCase().includes(s)).slice(0, 8);
  }, [q, T]);
  const pick = t => { A.focusTal(t.id); setQ(''); setQOpen(false); searchRef.current && searchRef.current.blur(); };

  const fullscreen = () => {
    const el = boxRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => A.showToast('Tela cheia não disponível neste navegador.'));
    else A.showToast('Tela cheia não disponível neste navegador.');
  };

  const soilSteps = Array.from({ length: 19 }, (_, i) => { const base = stt ? stt.solo : 40; const v = base + Math.sin(i / 2.6) * 5 + Math.sin(i * 1.7) * 2; return { v, y: (((v - base + 10) / 20) * 70 + 10).toFixed(0) + '%', c: v < base - 4 ? '#D8452E' : v < base - 1 ? '#E9A23B' : '#2F8F46', hl: i === 12 }; });
  const wx = ['rainy', 'cloud', 'cloud', 'cloud', 'sunny', 'sunny', 'cloud', 'cloud', 'rainy'];

  return (
    <div className="mapscreen" data-screen-label="Mapa">
      <div className="map-panel">
        <div className="row">
          <button className="btn btn-ghost" style={{ fontWeight: 500, borderColor: 'var(--line)' }} onClick={() => A.go('overview')}><Icon n="chevron_left" />Voltar</button>
          <span className="pill" style={{ marginLeft: 'auto', borderColor: 'var(--line)' }}><span className="cdot" style={{ width: 7, height: 7, background: '#3FA34D' }} />{T.length} talhões ativos</span>
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" style={{ width: 34, height: 34, borderColor: 'var(--line)' }} onClick={() => setMenu(!menu)} aria-label="Mais ações"><Icon n="more_vert" size={18} /></button>
            {menu && (
              <>
                <div className="click-away" onClick={() => setMenu(false)} />
                <div className="menu">
                  <button onClick={() => { setMenu(false); set({ exportOpen: true }); }}><Icon n="download" />Exportar dados</button>
                  {canEdit && stt && <button onClick={() => { setMenu(false); A.editTal(stt); }}><Icon n="edit" />Editar talhão selecionado</button>}
                  {canEdit && <button onClick={() => { setMenu(false); A.startDraw(); }}><Icon n="add_location_alt" />Demarcar novo talhão</button>}
                  <button onClick={() => { setMenu(false); set({ alertFarm: S.farm }); A.go('al'); }}><Icon n="notifications" />Ver alertas da propriedade</button>
                  <button onClick={() => { setMenu(false); set({ farmModal: true, farmQ: '' }); }}><Icon n="agriculture" />Trocar propriedade</button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <button className="tblock" style={{ gap: 4, border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => set({ farmModal: true, farmQ: '' })}>
            <span className="row" style={{ gap: 6, fontSize: 16, fontWeight: 600 }}>{M.farm.nome}<Icon n="unfold_more" size={17} style={{ color: 'var(--ink2)' }} /></span>
            <span style={{ fontSize: 12.5, color: 'var(--muted2)' }}>{M.farm.mun}, {M.farm.uf} · {M.farm.prod}</span>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span className="tnum" style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>{Number(M.farm.area).toLocaleString('pt-BR')} ha</span>
            <span className="row" style={{ gap: 3, fontSize: 12.5, color: '#2B7A3D', fontWeight: 500 }}><Icon n="north_east" size={15} />ROI 12%</span>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden', flex: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {kAvg.map(k => (
              <div key={k.label} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid var(--line2)', borderRight: '1px solid var(--line2)', minWidth: 0 }}>
                <div className="between" style={{ fontSize: 12, color: 'var(--muted)' }}><span>{k.label}</span><Icon n={k.icon} size={17} /></div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                  <span className="tnum" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1 }}>{k.val}<span style={{ fontSize: 13, marginLeft: 1 }}>{k.unit}</span></span>
                  <span className="tnum" style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 8px', fontSize: 11 }}><span style={{ color: 'var(--muted3)' }}>Máx</span><b style={{ fontWeight: 600, textAlign: 'right' }}>{k.max}</b><span style={{ color: 'var(--muted3)' }}>Mín</span><b style={{ fontWeight: 600, textAlign: 'right' }}>{k.min}</b></span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="between" style={{ fontSize: 13 }}><span style={{ fontWeight: 600 }}>Modelo de previsão da área</span><span style={{ color: 'var(--ink2)' }}>Bom para plantio</span></div>
            <div style={{ display: 'flex', gap: 2, height: 26, alignItems: 'stretch' }}>
              {Array.from({ length: 44 }, (_, i) => { const t = i / 43, hue = 8 + t * 120, mk = i === 30; return <span key={i} style={{ flex: 1, borderRadius: 1.5, background: mk ? '#1F7A35' : `hsl(${hue} ${t > 0.7 ? 45 : 72}% ${t > 0.7 ? 72 : 58}%)`, transform: mk ? 'scaleY(1.25)' : 'none' }} />; })}
            </div>
            <div className="between" style={{ background: 'var(--soft2)', borderRadius: 8, padding: '6px 6px 6px 10px', fontSize: 12 }}><span>12% de aumento de produção projetado</span><span className="row" style={{ gap: 5, background: '#fff', border: '1px solid var(--line)', borderRadius: 6, padding: '3px 7px', fontWeight: 500 }}><span className="ai-tag" style={{ fontSize: 10, padding: '1px 4px', color: '#fff', background: 'var(--green)' }}>IA</span>Insights</span></div>
          </div>
        </div>

        <div className="card" style={{ padding: '6px 0' }}>
          <div className="between" style={{ padding: '10px 16px 6px' }}><span style={{ fontSize: 13.5, fontWeight: 600 }}>Talhões</span><span style={{ fontSize: 12, color: 'var(--muted2)' }}>{mm === 'umidade' ? 'Umidade' : mm === 'temperatura' ? 'Temperatura' : 'Umidade do solo'}</span></div>
          {T.map((t, i) => { const l = lives[i], col = tColor(t, mm, l, false), ns = sens.filter(x => x.tal === t); return (
            <button key={t.id} className={'list-btn' + (S.sel === t.id ? ' on' : '')} onClick={() => A.focusTal(t.id)} style={{ padding: '9px 16px' }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: col.fill, flex: 'none' }} />
              <span style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}><b style={{ fontSize: 13, fontWeight: 600 }}>{t.id} · {t.nome}</b><span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{t.cultura} · {ns.filter(x => !x.off).length}/{ns.length} sensores</span></span>
              <b className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>{mm === 'umidade' ? f1(l.hum, 0) + '%' : mm === 'temperatura' ? f1(l.temp) + '°' : f1(l.solo, 0) + ' kPa'}</b>
            </button>
          ); })}
          {!has && <span className="empty">Nenhum talhão. {canEdit && <button className="btn-link" onClick={A.startDraw}>Demarcar o primeiro</button>}</span>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 16px 10px' }}>
            {mapStats.map(([l, v]) => <div key={l} className="soft-box" style={{ padding: '8px 10px', gap: 3 }}><span className="k">{l}</span><b className="tnum" style={{ fontSize: 15, fontWeight: 600 }}>{v}</b></div>)}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="between"><span style={{ fontSize: 13.5, fontWeight: 600 }}>Condição do solo</span><span style={{ fontSize: 12, color: 'var(--muted2)' }}>{stt ? stt.id : '—'} · últimas 18 h</span></div>
          <div style={{ position: 'relative', display: 'flex', height: 96, marginTop: 22 }}>
            {soilSteps.map((b, i) => (
              <div key={i} style={{ position: 'relative', flex: 1, borderLeft: '1px solid #F1F2EE', background: b.hl ? 'linear-gradient(180deg,rgba(63,163,77,0),rgba(63,163,77,.22))' : 'transparent' }}>
                <span style={{ position: 'absolute', left: 0, right: 0, bottom: b.y, height: 4, background: b.c }} />
                {b.hl && <span className="row" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', gap: 4, whiteSpace: 'nowrap', background: 'var(--dark)', color: '#fff', borderRadius: 7, padding: '4px 8px', fontSize: 11.5, fontWeight: 500 }}><Icon n="water" size={14} />{f1(b.v, 0)} kPa · água</span>}
              </div>
            ))}
          </div>
          <div className="axis" style={{ fontSize: 11 }}><span>06:00</span><span>09:00</span><span>12:00</span><span>15:00</span><span>18:00</span><span>21:00</span><span>24:00</span></div>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="between" style={{ fontSize: 12.5, color: 'var(--muted2)' }}><span>Previsão do tempo · {M.farm.mun}</span><Icon n="cloud" size={17} /></div>
          <div className="row" style={{ gap: 10 }}><Icon n="cloud" fill size={28} style={{ color: '#9AA0A6' }} /><span style={{ fontSize: 26, fontWeight: 500 }}>27°</span><span style={{ display: 'flex', flexDirection: 'column', fontSize: 12, color: 'var(--muted2)', lineHeight: 1.3 }}><span>Nublado</span><span>Sensação de 29°</span></span></div>
          <div className="between" style={{ padding: '0 2px' }}>{wx.map((w, i) => <Icon key={i} n={w} fill size={17} style={{ color: w === 'sunny' ? '#F2B53A' : '#A9AEB3' }} />)}</div>
          <div style={{ height: 80 }}><LineChart h={80} marker={13} min={22} max={32} fmt={v => f1(v) + '°'} labels={i => String(8 + Math.round(i * 0.63)).padStart(2, '0') + 'h'} series={[{ v: [26, 26.5, 27.4, 28.6, 28.2, 27.1, 26.8, 27.6, 29.2, 30.1, 29.4, 28, 26.9, 26.2, 25.8, 26.4, 25.5, 24.8, 24.6, 24.3], color: '#EE8A1F', area: true, dash: true }]} /></div>
          <div className="axis" style={{ fontSize: 11 }}><span>08h</span><span>11h</span><span>14h</span><span>17h</span><span>20h</span></div>
        </div>
      </div>

      <div className="map-main" ref={boxRef}>
        <FarmMap T={T} lives={lives} mode={mm} sel={S.sel} onSelect={A.focusTal} sensors={mm === 'telemetria' ? sens : null} farm={M.farm} layer={S.mapLayer} focus={S.focus} scale onReady={setMap}>
          <div className="map-ctrl map-top">
            <div className="map-search">
              <label className="map-float">
                <Icon n="search" size={18} />
                <input ref={searchRef} value={q} placeholder="Buscar talhão, cultura…" aria-label="Buscar talhão"
                  onChange={e => { setQ(e.target.value); setQOpen(true); setQi(0); }} onFocus={() => setQOpen(true)} onBlur={() => setTimeout(() => setQOpen(false), 150)}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setQi(i => Math.min(results.length - 1, i + 1)); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setQi(i => Math.max(0, i - 1)); }
                    else if (e.key === 'Enter' && results[qi]) pick(results[qi]);
                    else if (e.key === 'Escape') { setQ(''); e.currentTarget.blur(); }
                  }} />
                {!q && <kbd>/</kbd>}
              </label>
              {qOpen && q && (
                <div className="res">
                  {results.map((t, i) => <button key={t.id} className={i === qi ? 'on' : ''} onMouseDown={e => e.preventDefault()} onClick={() => pick(t)}><Icon n="pentagon" size={17} style={{ color: 'var(--muted)' }} /><span style={{ flex: 1 }}><b style={{ fontWeight: 600 }}>{t.id}</b> · {t.nome}</span><span className="sub" style={{ fontSize: 12 }}>{t.cultura}</span></button>)}
                  {!results.length && <span className="empty" style={{ padding: 12 }}>Nenhum talhão encontrado.</span>}
                </div>
              )}
            </div>
            <div className="mode-seg map-float">
              {[['telemetria', 'Telemetria', 'sensors'], ['umidade', 'Umidade', 'water_drop'], ['temperatura', 'Temperatura', 'device_thermostat']].map(([v, l, ic]) => (
                <button key={v} className={mm === v ? 'on' : ''} onClick={() => set({ mapMode: v })}><Icon n={ic} />{l}</button>
              ))}
            </div>
            <div className="map-actions">
              {canEdit && <button className="btn btn-orange" onClick={A.startDraw}><Icon n="add" />Novo talhão</button>}
              <button className="btn btn-ghost hide-m" onClick={() => set({ exportOpen: true })}>Exportar</button>
              <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => set(s => ({ notifOpen: !s.notifOpen }))} aria-label="Notificações"><Icon n="notifications" size={19} /></button>
            </div>
          </div>

          <div className="map-ctrl map-legend map-float">
            <b style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink)' }}>{legend.title}</b>
            <span className="grad" style={{ background: legend.grad }} />
            <span className="between" style={{ fontSize: 10.5 }}><span>{legend.lo}</span><span>{legend.hi}</span></span>
          </div>

          {stt && (
            <div className="sel-card">
              <div className="between" style={{ alignItems: 'flex-start', gap: 6, paddingBottom: 9, borderBottom: '1px solid var(--line2)' }}>
                <div className="tblock"><span className="row" style={{ gap: 6, fontSize: 13.5, fontWeight: 600 }}>{stt.id} : {stt.nome}<Icon n="star" fill size={12} style={{ width: 16, height: 16, borderRadius: 4, background: '#FCEFD3', color: '#E5A21E', display: 'grid', placeItems: 'center' }} /></span><span style={{ fontSize: 11, color: 'var(--muted2)' }}>{stt.cultura}{stt.variedade ? ' ' + stt.variedade : ''} · {f1(areaHa(stt.pts))} ha</span></div>
                <span className="row" style={{ gap: 2 }}>
                  <button className="x-btn" onClick={() => setCardMin(!cardMin)} aria-label={cardMin ? 'Expandir' : 'Recolher'}><Icon n={cardMin ? 'expand_less' : 'expand_more'} size={20} /></button>
                  <button className="x-btn" onClick={() => set({ sel: null })} aria-label="Fechar"><Icon n="close" size={17} /></button>
                </span>
              </div>
              {cardMin && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, fontSize: 11 }} className="tnum">
                  {[['Umid.', f1(sl.hum, 0) + '%'], ['Temp.', f1(sl.temp) + '°'], ['Solo', f1(sl.solo, 0) + ' kPa'], ['pH', f1(sl.ph)]].map(([k, v]) => <div key={k} className="tblock" style={{ background: '#F4F5F2', borderRadius: 7, padding: '6px 8px' }}><span style={{ color: 'var(--muted2)' }}>{k}</span><b style={{ fontSize: 12.5, fontWeight: 600 }}>{v}</b></div>)}
                </div>
              )}
              {!cardMin && <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <div className="tblock"><span style={{ fontSize: 11, color: 'var(--muted2)' }}>Plantio</span><span style={{ fontSize: 13, fontWeight: 500 }}>{stt.plantio}</span></div>
                <div className="tblock"><span style={{ fontSize: 11, color: 'var(--muted2)' }}>Colheita</span><span style={{ fontSize: 13, fontWeight: 500 }}>{stt.colheita}</span></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div className="between" style={{ fontSize: 11 }}><span style={{ color: 'var(--muted2)' }}>Saúde do cultivo</span><span style={{ fontWeight: 500 }}>{saudeTxt} · {stt.saude}%</span></div>
                <div className="bar" style={{ flex: 'none' }}><i style={{ width: stt.saude + '%', background: stt.saude >= 80 ? '#2FA24A' : stt.saude >= 65 ? '#EE8A1F' : '#D8452E' }} /></div>
              </div>
              <div className="sb">
                <span style={{ fontSize: 11.5, fontWeight: 500, padding: '0 2px' }}>Leitura dos sensores · {selSens.filter(x => !x.off).length} de {selSens.length} online</span>
                <div className="kv"><span>Umidade</span><span>{f1(sl.hum, 0)}%</span><span>Temperatura</span><span>{f1(sl.temp)} °C</span><span>Umidade do solo</span><span>{f1(sl.solo, 0)} kPa</span><span>pH</span><span>{f1(sl.ph)}</span></div>
              </div>
              <div className="sb" style={{ gap: 6 }}>
                <button className="between" onClick={() => setLogOpen(!logOpen)} style={{ fontSize: 11.5, fontWeight: 500, padding: '0 2px', border: 'none', background: 'transparent', cursor: 'pointer' }}>Log dos sensores<Icon n={logOpen ? 'expand_less' : 'expand_more'} size={16} style={{ color: 'var(--muted2)' }} /></button>
                {logOpen && selLog.map(l => <div key={l.key} className="between tnum" style={{ fontSize: 11, padding: '4px 2px', borderTop: '1px solid #F1F2EE' }}><span style={{ color: 'var(--muted2)' }}>{l.hora} · {l.sensor}</span><span style={{ fontWeight: 500 }}>{l.val}</span></div>)}
              </div>
              {S.toggles.ia && (
                <div style={{ background: '#2A2E29', color: '#F2F3EF', borderRadius: 9, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="row" style={{ alignSelf: 'flex-start', gap: 5, background: '#3B403A', borderRadius: 5, padding: '3px 6px', fontSize: 11, fontWeight: 500 }}><span style={{ padding: '1px 4px', borderRadius: 3, background: 'var(--green)', color: '#fff', fontSize: 9.5, fontWeight: 700 }}>IA</span>Insights</span>
                  <span style={{ fontSize: 11.5, lineHeight: 1.45 }}>{INSIGHTS[stt.id] || (stt.reason ? stt.reason + '. Acompanhar as próximas leituras.' : 'Aguardando 24 h de leituras para gerar recomendações.')}</span>
                </div>
              )}
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-ghost" style={{ flex: 1, padding: '7px 8px', fontSize: 12 }} onClick={() => { set({ monT: stt.id, monSens: 'Todos', monCult: 'Todas' }); A.go('mon'); }}><Icon n="monitoring" size={16} />Histórico</button>
                {canEdit && <button className="btn btn-ghost" style={{ flex: 1, padding: '7px 8px', fontSize: 12 }} onClick={() => A.editTal(stt)}><Icon n="edit" size={16} />Editar</button>}
              </div>
              </>}
            </div>
          )}

          <div className="map-ctrl map-tools" style={{ right: 14, bottom: 26 }}>
            <button onClick={fullscreen} title="Tela cheia" aria-label="Tela cheia"><Icon n="open_in_full" size={17} /></button>
            <div className="grp">
              <button onClick={() => map && map.zoomIn()} title="Aproximar" aria-label="Aproximar"><Icon n="add" /></button>
              <button onClick={() => map && map.zoomOut()} title="Afastar" aria-label="Afastar"><Icon n="remove" /></button>
            </div>
            <button onClick={() => set({ focus: { reset: true, n: Date.now() } })} title="Enquadrar propriedade" aria-label="Enquadrar propriedade"><Icon n="near_me" size={16} /></button>
            <button onClick={() => set(s => ({ mapLayer: s.mapLayer === 'sat' ? 'map' : 'sat' }))} title={S.mapLayer === 'sat' ? 'Ver mapa de ruas' : 'Ver satélite'} aria-label="Alternar camada">{S.mapLayer === 'sat' ? 'MAPA' : 'SAT'}</button>
          </div>
          <div className="map-ctrl map-bl" style={{ bottom: 44 }}>
            <MiniMap main={map} layer={S.mapLayer} />
          </div>
        </FarmMap>
      </div>
    </div>
  );
}
