import { useApp } from '../state/store.jsx';
import { Icon, DataTable } from '../components/ui/index.jsx';
import { cultColor, ini } from '../lib/format.js';

export default function Farms() {
  const { S, M, A, set } = useApp();
  const can = M.acc.faz === 2;
  const open = modal => set({ modal, mf: {}, modalErr: '' });
  return (
    <div className="stack" data-screen-label="Fazendas">
      <h3 className="ttl">Fazendas <span className="cnt">· {S.fazendas.length}</span></h3>
      <div className="grid-cards">
        {M.fazendasView.map((f, i) => (
          <button key={f.id ?? i} className="card pad" onClick={() => A.selectFarm(i)} style={{ textAlign: 'left', cursor: 'pointer', borderColor: i === S.farm ? 'var(--green)' : undefined, boxShadow: i === S.farm ? '0 0 0 1px var(--green)' : undefined }}>
            <div className="between" style={{ alignItems: 'flex-start' }}>
              <div className="tblock" style={{ gap: 3 }}><span style={{ fontSize: 15, fontWeight: 600 }}>{f.nome}</span><span className="sub">{f.mun}, {f.uf} · {f.prod} · {f.status || 'Ativa'}</span></div>
              <span className="tnum" style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap' }}>{Number(f.area).toLocaleString('pt-BR')} ha</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              <div className="soft-box" style={{ padding: '9px 10px', gap: 3 }}><span className="k" style={{ fontSize: 11 }}>Talhões</span><span className="v" style={{ fontSize: 16 }}>{f.talhoes}</span></div>
              <div className="soft-box" style={{ padding: '9px 10px', gap: 3 }}><span className="k" style={{ fontSize: 11 }}>Sensores</span><span className="v" style={{ fontSize: 16 }}>{f.sens}</span></div>
              <div className="soft-box" style={{ padding: '9px 10px', gap: 3 }}><span className="k" style={{ fontSize: 11 }}>Saúde</span><span className="v" style={{ fontSize: 16, color: '#2B7A3D' }}>{f.saude}</span></div>
            </div>
            <div className="between"><span style={{ fontSize: 12.5, color: 'var(--ink2)' }}>{f.culturas}</span>{i === S.farm && <span className="badge" style={{ background: 'var(--green-l)', color: '#2B7A3D' }}>Selecionada</span>}</div>
          </button>
        ))}
        {can && (
          <button onClick={() => open('fazenda')} style={{ minHeight: 190, border: '1.5px dashed #C9CDC2', borderRadius: 18, background: '#FAFAF8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <Icon n="add" size={22} style={{ width: 40, height: 40, borderRadius: 12, background: '#fff', border: '1px solid var(--line)', display: 'grid', placeItems: 'center' }} />Adicionar fazenda
          </button>
        )}
      </div>

      <div className="card clip">
        <div className="card-h pad"><h3 className="ttl">Produtores <span className="cnt">· {S.produtores.length}</span></h3>{can && <button className="btn btn-orange" onClick={() => open('produtor')}><Icon n="person_add" />Novo produtor / empresa</button>}</div>
        <DataTable minW={720} rows={S.produtores} rowKey={(r, i) => r.id ?? r.nome + i}
          cols={[
            { k: 'nome', label: 'Produtor / empresa', w: 'minmax(180px,1.4fr)', main: true, render: p => <span className="person"><span className="av">{ini(p.nome)}</span><span className="nm"><b>{p.nome}</b><small>{p.email}</small></span></span> },
            { k: 'doc', label: 'CPF / CNPJ', w: '170px', render: p => <span className="c-muted tnum">{p.doc}</span> },
            { k: 'tel', label: 'Telefone', w: '150px', render: p => <span className="c-muted tnum">{p.tel}</span> },
            { k: 'cid', label: 'Cidade / UF', w: 'minmax(130px,1fr)', render: p => p.cidade + ' / ' + p.uf },
            { k: 'resp', label: 'Responsável', w: 'minmax(130px,1fr)' }
          ]} />
      </div>

      <div className="card clip">
        <div className="card-h pad"><h3 className="ttl">Culturas <span className="cnt">· {S.culturas.length}</span></h3>{can && <button className="btn btn-orange" onClick={() => open('cultura')}><Icon n="add" />Nova cultura</button>}</div>
        <DataTable minW={900} rows={S.culturas} rowKey={(r, i) => r.id ?? r.nome + i}
          cols={[
            { k: 'nome', label: 'Cultura', w: 'minmax(130px,1fr)', main: true, render: r => <span className="row" style={{ fontWeight: 600 }}><i className="cdot" style={{ width: 10, height: 10, background: cultColor(r.nome) }} />{r.nome}</span> },
            { k: 'variedade', label: 'Variedade', w: 'minmax(160px,1.2fr)', render: r => <span className="c-muted">{r.variedade}</span> },
            { k: 'temp', label: 'Temp. recomendada', w: '130px' },
            { k: 'umid', label: 'Umidade recomendada', w: '140px' },
            { k: 'ciclo', label: 'Ciclo médio', w: '110px' },
            { k: 'desc', label: 'Descrição', w: 'minmax(200px,1.6fr)', wide: true, render: r => <span className="c-muted">{r.desc}</span> }
          ]} />
      </div>
    </div>
  );
}
