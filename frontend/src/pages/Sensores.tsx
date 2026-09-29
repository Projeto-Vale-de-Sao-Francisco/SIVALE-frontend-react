import { useEffect, useState } from "react";
import { api } from "../api";

export default function Sensores() {
  const [sensores, setSensores] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [novo, setNovo] = useState({ loteId: "", codigo: "" });

  async function carregar() {
    const [s, l] = await Promise.all([api.sensores(), api.lotes()]);
    setSensores(s);
    setLotes(l);
    if (l[0] && !novo.loteId) setNovo((n) => ({ ...n, loteId: String(l[0].id) }));
  }

  useEffect(() => { carregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    await api.criarSensor({ loteId: Number(novo.loteId), codigo: novo.codigo });
    setNovo({ ...novo, codigo: "" });
    carregar();
  }

  function nomeLote(loteId: number) {
    const lote = lotes.find((l) => l.id === loteId);
    return lote ? `${lote.nome} (${lote.cultura?.nome ?? ""})` : loteId;
  }

  return (
    <div>
      <h2>Sensores IoT</h2>
      <div className="painel">
        <form className="linha" onSubmit={criar}>
          <label>Lote
            <select value={novo.loteId} onChange={(e) => setNovo({ ...novo, loteId: e.target.value })}>
              {lotes.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </label>
          <label>Código <input value={novo.codigo} onChange={(e) => setNovo({ ...novo, codigo: e.target.value })} placeholder="ESP32-03" required /></label>
          <button type="submit">Cadastrar sensor</button>
        </form>
      </div>

      <div className="painel">
        <table>
          <thead><tr><th>Código</th><th>Lote</th><th>Tipo</th><th>Instalado em</th><th>Status</th></tr></thead>
          <tbody>
            {sensores.map((s) => (
              <tr key={s.id}>
                <td>{s.codigo}</td>
                <td>{nomeLote(s.loteId)}</td>
                <td>{s.tipo}</td>
                <td>{new Date(s.dataInstalacao).toLocaleDateString("pt-BR")}</td>
                <td><span className={`badge ${s.status === "ativo" ? "ativo" : "inativo"}`}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
