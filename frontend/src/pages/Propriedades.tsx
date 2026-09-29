import { useEffect, useState } from "react";
import { api } from "../api";

export default function Propriedades() {
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [novo, setNovo] = useState({ empresaId: "", nome: "", municipio: "", estado: "" });

  async function carregar() {
    const [p, e] = await Promise.all([api.propriedades(), api.empresas()]);
    setPropriedades(p);
    setEmpresas(e);
    if (e[0] && !novo.empresaId) setNovo((n) => ({ ...n, empresaId: String(e[0].id) }));
  }

  useEffect(() => { carregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    await api.criarPropriedade({ ...novo, empresaId: Number(novo.empresaId) });
    setNovo({ ...novo, nome: "", municipio: "", estado: "" });
    carregar();
  }

  return (
    <div>
      <h2>Propriedades Rurais</h2>
      <div className="painel">
        <form className="linha" onSubmit={criar}>
          <label>Empresa
            <select value={novo.empresaId} onChange={(e) => setNovo({ ...novo, empresaId: e.target.value })}>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.nomeFantasia || e.razaoSocial}</option>)}
            </select>
          </label>
          <label>Nome <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} required /></label>
          <label>Município <input value={novo.municipio} onChange={(e) => setNovo({ ...novo, municipio: e.target.value })} required /></label>
          <label>UF <input value={novo.estado} onChange={(e) => setNovo({ ...novo, estado: e.target.value })} maxLength={2} required /></label>
          <button type="submit">Adicionar propriedade</button>
        </form>
      </div>

      <div className="painel">
        <table>
          <thead><tr><th>Nome</th><th>Município</th><th>UF</th><th>Área (ha)</th><th>Lotes</th><th>Status</th></tr></thead>
          <tbody>
            {propriedades.map((p) => (
              <tr key={p.id}>
                <td>{p.nome}</td>
                <td>{p.municipio}</td>
                <td>{p.estado}</td>
                <td>{p.areaTotal ?? "—"}</td>
                <td>{p.lotes?.length ?? 0}</td>
                <td><span className={`badge ${p.status ? "ativo" : "inativo"}`}>{p.status ? "ativo" : "inativo"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
