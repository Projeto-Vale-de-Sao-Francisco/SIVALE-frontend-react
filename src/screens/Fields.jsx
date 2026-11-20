import { useApp } from '../state/store.jsx';
import { Icon } from '../components/ui/index.jsx';
import FarmMap from '../components/map/FarmMap.jsx';
import { f1, cultColor } from '../lib/format.js';
import { areaHa, fmtCoord, distM } from '../lib/geo.js';
import { centroid } from '../lib/geo.js';

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const brToShort = s => { const m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); return m ? m[1].padStart(2, '0') + ' ' + MES[+m[2] - 1] + ' ' + m[3].slice(-2) : s || 'a definir'; };

export default function Fields() {
  const { S, M, A, set, api } = useApp();
  const { T, lives } = M;
  const can = M.acc.tal === 2;
  const drawing = !!S.draft;
  const dn = S.draft ? S.draft.length : 0;
  const closed = S.draftClosed;

  const addPt = p => set(s => {
    if (!s.draft || s.draftClosed) return {};
    // clicar perto do primeiro ponto fecha a área
    if (s.draft.length >= 3 && distM(p, s.draft[0]) < 4) return { draftClosed: true };
    return { draft: [...s.draft, p] };
  });
  const closeDraft = () => dn >= 3 && set({ draftClosed: true });
  const undo = () => set(s => (s.draftClosed ? { draftClosed: false } : { draft: s.draft.slice(0, -1) }));
  const cancel = () => set({ draft: null, draftClosed: false });
  const hint = closed ? 'Área fechada. Defina nome e cultura ao lado.' : dn < 3 ? `Toque no mapa para marcar o ponto ${dn + 1} (mínimo 3)` : 'Continue marcando ou toque no ponto 1 para fechar a área';

  const nextId = () => {
    const pre = (T[0] && String(T[0].id).split('-')[0]) || (M.farm.nome || 'T').split(' ').pop().slice(0, 2).toUpperCase() || 'T';
    const nums = T.map(t => parseInt(String(t.id).split('-')[1], 10)).filter(n => !isNaN(n));
    return pre + '-' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, '0');
  };

  const saveTal = () => {
    const id = nextId();
    const obj = { id, farmId: M.farm.id, nome: S.df.nome.trim() || 'Talhão ' + id.split('-')[1], cultura: S.df.cultura, variedade: '', pts: S.draft, hum: 60, temp: 27, solo: 42, ph: 6.0, prio: 'baixa', saude: 80, plantio: brToShort(S.df.plantio), colheita: brToShort(S.df.colheita), est: 0, reason: '' };
    set({ saving: true });
    api.talhoes.create(obj, M.farm.id)
      .then(saved => {
        const t = !api.isMock && saved ? { ...saved, farmId: M.farm.id } : obj;
        set(s => ({ talhoes: [...s.talhoes, t], draft: null, draftClosed: false, df: { nome: '', cultura: s.culturas[0] ? s.culturas[0].nome : 'Manga', plantio: '', colheita: '' }, sel: t.id, saving: false, focus: { tal: t.id, n: Date.now() } }));
        A.showToast('Talhão ' + t.id + ' salvo · ' + f1(areaHa(t.pts)) + ' ha.');
      })
      .catch(e => { set({ saving: false }); A.apiErr(e); });
  };

  const legend = [...new Set(T.map(t => t.cultura))];

  return (
    <div className="talscreen" data-screen-label="Talhões">
      <div className="tal-map">
        <FarmMap T={T} lives={lives} mode="cultura" sel={drawing ? null : S.sel} onSelect={id => A.focusTal(id)} farm={M.farm} layer={S.mapLayer} focus={S.focus} zoomControl
          drawing={drawing ? { pts: S.draft, closed, onAdd: addPt, onClose: closeDraft } : null} style={{ position: 'absolute', inset: 0, borderRadius: 18 }}>
          {drawing && <div className="map-ctrl draw-hint"><Icon n="ads_click" />{hint}</div>}
          {legend.length > 0 && <div className="map-ctrl cult-legend">{legend.map(c => <span key={c}><i className="sw" style={{ background: cultColor(c) }} />{c}</span>)}</div>}
          <div className="map-ctrl map-tools" style={{ right: 10, bottom: 26 }}>
            <button onClick={() => set(s => ({ mapLayer: s.mapLayer === 'sat' ? 'map' : 'sat' }))} title="Alternar camada">{S.mapLayer === 'sat' ? 'MAPA' : 'SAT'}</button>
            <button onClick={() => set({ focus: { reset: true, n: Date.now() } })} title="Enquadrar propriedade"><Icon n="near_me" size={16} /></button>
          </div>
        </FarmMap>
      </div>

      <div className="stack" style={{ gap: 12 }}>
        {!drawing && (
          <>
            {can && <button className="btn btn-orange btn-lg" onClick={A.startDraw}><Icon n="add_location_alt" size={19} />Novo talhão</button>}
            <div className="card" style={{ padding: '6px 0', display: 'flex', flexDirection: 'column' }}>
              <div className="between" style={{ padding: '10px 16px 8px', fontSize: 12, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em' }}><span>{M.farm.nome}</span><span style={{ color: 'var(--orange)', fontWeight: 600 }}>{T.length} talhões</span></div>
              {T.map(t => (
                <div key={t.id} className={'list-btn' + (S.sel === t.id ? ' on' : '')} role="button" tabIndex={0} onClick={() => A.focusTal(t.id)} onKeyDown={e => e.key === 'Enter' && A.focusTal(t.id)}>
                  <span style={{ width: 38, height: 38, borderRadius: 9, background: cultColor(t.cultura), flex: 'none', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 10.5, fontWeight: 700 }}>{t.id}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}><span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.nome}</span><span style={{ fontSize: 12, color: 'var(--muted)' }}>{t.cultura}{t.variedade ? ' ' + t.variedade : ''} · {f1(areaHa(t.pts))} ha</span></div>
                  {can && <button className="edit-ic ms" style={{ border: 'none', background: 'transparent' }} title="Editar talhão" aria-label={'Editar ' + t.id} onClick={e => { e.stopPropagation(); A.editTal(t); }}>edit</button>}
                </div>
              ))}
              {!T.length && <span className="empty">Nenhum talhão nesta propriedade.</span>}
            </div>
            {S.sel && T.find(t => t.id === S.sel) && (() => { const t = T.find(x => x.id === S.sel); const c = centroid(t.pts); return (
              <div className="card pad" style={{ gap: 8 }}>
                <span className="ttl" style={{ fontSize: 14 }}>{t.id} · {t.nome}</span>
                <span className="sub">Centro {fmtCoord(c)} · {t.pts.length} vértices · {f1(areaHa(t.pts))} ha</span>
                <span className="sub">Plantio {t.plantio} · Colheita {t.colheita}</span>
              </div>
            ); })()}
          </>
        )}

        {drawing && (
          <>
            <div className="card pad">
              <div className="between"><h3 className="ttl">Novo talhão</h3><span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--orange)' }}>{dn} pontos · {closed ? 'Área fechada' : dn < 3 ? 'Faltam ' + (3 - dn) + ' para fechar' : 'Pronto para fechar'}</span></div>
              <span className="sub" style={{ lineHeight: 1.45 }}>Marque quantos pontos precisar no contorno do talhão sobre a imagem de satélite. Feche a área tocando no ponto 1 ou no botão abaixo.</span>
              {dn > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                  {S.draft.map((p, i) => <div key={i} className="between tnum" style={{ fontSize: 12.5, padding: '7px 10px', background: 'var(--soft)', borderRadius: 8 }}><b style={{ fontWeight: 600 }}>Ponto {i + 1}</b><span className="c-soft">{fmtCoord(p)}</span></div>)}
                </div>
              )}
              {dn >= 3 && !closed && <button className="btn btn-dark" onClick={closeDraft}><Icon n="pentagon" size={17} />Fechar área</button>}
              <div className="row">
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={undo} disabled={!dn}><Icon n="undo" size={17} />Desfazer</button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={cancel}>Cancelar</button>
              </div>
            </div>
            {closed && (
              <div className="card pad">
                <div className="between" style={{ alignItems: 'baseline' }}><span style={{ fontSize: 13, color: 'var(--muted)' }}>Área calculada</span><span className="tnum" style={{ fontSize: 22, fontWeight: 600 }}>{f1(areaHa(S.draft))} ha</span></div>
                <label className="field">Nome do talhão<input value={S.df.nome} onChange={e => { const v = e.target.value; set(s => ({ df: { ...s.df, nome: v } })); }} placeholder="Ex.: Talhão Leste" /></label>
                <div className="form-grid" style={{ gap: 8 }}>
                  <label className="field">Data do plantio<input value={S.df.plantio} onChange={e => { const v = e.target.value; set(s => ({ df: { ...s.df, plantio: v } })); }} placeholder="12/07/2026" inputMode="numeric" /></label>
                  <label className="field">Previsão de colheita<input value={S.df.colheita} onChange={e => { const v = e.target.value; set(s => ({ df: { ...s.df, colheita: v } })); }} placeholder="05/12/2026" inputMode="numeric" /></label>
                </div>
                <div className="field">Cultura
                  <div className="chips" style={{ gap: 6 }}>
                    {S.culturas.map(c => <button key={c.nome} className={'chip sm' + (S.df.cultura === c.nome ? ' sel' : '')} onClick={() => set(s => ({ df: { ...s.df, cultura: c.nome } }))}><i className="cdot" style={{ background: cultColor(c.nome) }} />{c.nome}</button>)}
                  </div>
                </div>
                <button className="btn btn-green btn-lg" onClick={saveTal} disabled={S.saving}><Icon n="check" />{S.saving ? 'Salvando…' : 'Salvar talhão'}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
