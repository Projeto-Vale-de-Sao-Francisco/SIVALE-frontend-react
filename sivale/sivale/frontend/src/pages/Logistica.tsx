import { useEffect, useState } from "react";
import { api } from "../api";

export default function Logistica() {
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [novo, setNovo] = useState({ empresaId: "", loteId: "", origem: "", destino: "", modal: "marítimo" });

  async function carregar() {
    const [op, e, l] = await Promise.all([api.logistica(), api.empresas(), api.lotes()]);
    setOperacoes(op);
    setEmpresas(e);
    setLotes(l);
    if (!novo.empresaId && e[0]) setNovo((n) => ({ ...n, empresaId: String(e[0].id) }));
  }
  useEffect(() => { carregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    await api.criarLogistica({
      empresaId: Number(novo.empresaId),
      loteId: novo.loteId ? Number(novo.loteId) : undefined,
      origem: novo.origem,
      destino: novo.destino,
      modal: novo.modal,
    });
    setNovo({ ...novo, origem: "", destino: "" });
    carregar();
  }

  function nomeLote(id: number | null) {
    if (!id) return "—";
    return lotes.find((l) => l.id === id)?.nome ?? id;
  }

  return (
    <div>
      <h2>Logística e Exportação</h2>
      <div className="painel">
        <form className="linha" onSubmit={criar}>
          <label>Lote (opcional)
            <select value={novo.loteId} onChange={(e) => setNovo({ ...novo, loteId: e.target.value })}>
              <option value="">—</option>
              {lotes.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </label>
          <label>Origem <input value={novo.origem} onChange={(e) => setNovo({ ...novo, origem: e.target.value })} placeholder="Petrolina/PE" required /></label>
          <label>Destino <input value={novo.destino} onChange={(e) => setNovo({ ...novo, destino: e.target.value })} placeholder="Rotterdam" required /></label>
          <label>Modal
            <select value={novo.modal} onChange={(e) => setNovo({ ...novo, modal: e.target.value })}>
              <option value="marítimo">marítimo</option>
              <option value="aéreo">aéreo</option>
              <option value="rodoviário">rodoviário</option>
            </select>
          </label>
          <button type="submit">Registrar operação</button>
        </form>
      </div>

      <div className="painel">
        <table>
          <thead><tr><th>Lote</th><th>Origem</th><th>Destino</th><th>Modal</th><th>Situação</th></tr></thead>
          <tbody>
            {operacoes.map((o) => (
              <tr key={o.id}>
                <td>{nomeLote(o.loteId)}</td>
                <td>{o.origem}</td>
                <td>{o.destino}</td>
                <td>{o.modal}</td>
                <td><span className="badge ativo">{o.situacao}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
