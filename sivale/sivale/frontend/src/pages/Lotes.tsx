import { useEffect, useState } from "react";
import { api } from "../api";

export default function Lotes() {
  const [lotes, setLotes] = useState<any[]>([]);
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [culturas, setCulturas] = useState<any[]>([]);
  const [novo, setNovo] = useState({ propriedadeId: "", culturaId: "", nome: "", area: "" });

  async function carregar() {
    const [l, p, c] = await Promise.all([api.lotes(), api.propriedades(), api.culturas()]);
    setLotes(l);
    setPropriedades(p);
    setCulturas(c);
    setNovo((n) => ({
      ...n,
      propriedadeId: n.propriedadeId || String(p[0]?.id ?? ""),
      culturaId: n.culturaId || String(c[0]?.id ?? ""),
    }));
  }
  useEffect(() => { carregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    await api.criarLote({
      propriedadeId: Number(novo.propriedadeId),
      culturaId: Number(novo.culturaId),
      nome: novo.nome,
      area: novo.area ? Number(novo.area) : undefined,
    });
    setNovo({ ...novo, nome: "", area: "" });
    carregar();
  }

  function nomePropriedade(id: number) {
    return propriedades.find((p) => p.id === id)?.nome ?? id;
  }
  function nomeCultura(id: number) {
    return culturas.find((c) => c.id === id)?.nome ?? id;
  }

  return (
    <div>
      <h2>Lotes / Talhões</h2>
      <div className="painel">
        <form className="linha" onSubmit={criar}>
          <label>Propriedade
            <select value={novo.propriedadeId} onChange={(e) => setNovo({ ...novo, propriedadeId: e.target.value })}>
              {propriedades.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <label>Cultura
            <select value={novo.culturaId} onChange={(e) => setNovo({ ...novo, culturaId: e.target.value })}>
              {culturas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label>Nome do lote <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Lote 42" required /></label>
          <label>Área (ha) <input type="number" step="0.1" value={novo.area} onChange={(e) => setNovo({ ...novo, area: e.target.value })} /></label>
          <button type="submit">Adicionar lote</button>
        </form>
      </div>

      <div className="painel">
        <table>
          <thead><tr><th>Nome</th><th>Propriedade</th><th>Cultura</th><th>Área (ha)</th><th>Status</th></tr></thead>
          <tbody>
            {lotes.map((l) => (
              <tr key={l.id}>
                <td>{l.nome}</td>
                <td>{nomePropriedade(l.propriedadeId)}</td>
                <td>{nomeCultura(l.culturaId)}</td>
                <td>{l.area ?? "—"}</td>
                <td><span className={`badge ${l.status === "ativo" ? "ativo" : "inativo"}`}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
