import { useEffect, useState } from "react";
import NovoRegistro from "../NovoRegistro";
import Cabecalho from "../Cabecalho";
import { api } from "../api";
import { ehAdmin } from "../perfil";

export default function Logistica() {
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [novo, setNovo] = useState({ empresaId: "", colheitaId: "", origem: "", destino: "", modal: "maritimo", transportadora: "", dataPrevista: "", tempoEstimadoHoras: "", custoEstimado: "", status: "planejada" });
  const [erro, setErro] = useState("");
  const podeGerir = ehAdmin();

  async function carregar() {
    const [listaOperacoes, listaLotes] = await Promise.all([api.logistica(), api.talhoes()]);
    setOperacoes(listaOperacoes);
    setLotes(listaLotes);
  }
  useEffect(() => { carregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      await api.criarLogistica({
        empresaId: Number(novo.empresaId),
        colheitaId: Number(novo.colheitaId),
        origem: novo.origem,
        destino: novo.destino,
        modal: novo.modal,
        transportadora: novo.transportadora || undefined,
        dataPrevista: novo.dataPrevista || undefined,
        tempoEstimadoHoras: novo.tempoEstimadoHoras ? Number(novo.tempoEstimadoHoras) : undefined,
        custoEstimado: novo.custoEstimado ? Number(novo.custoEstimado) : undefined,
        status: novo.status,
      });
      setNovo({ ...novo, origem: "", destino: "", transportadora: "", dataPrevista: "", tempoEstimadoHoras: "", custoEstimado: "" });
      carregar();
    } catch (err: any) {
      setErro(err.message);
    }
  }

  const empresas = Array.from(new Map(lotes.filter((l) => l.propriedade?.empresa_id).map((l) => [l.propriedade.empresa_id, { id: l.propriedade.empresa_id, rotulo: `Empresa #${l.propriedade.empresa_id} — ${l.propriedade.nome}` }])).values());
  const colheitas = lotes.flatMap((l) => (l.culturas ?? []).flatMap((plantio: any) => (plantio.colheitas ?? []).map((colheita: any) => ({ id: colheita.id, empresaId: l.propriedade?.empresa_id, rotulo: `${l.nome} — ${plantio.cultura?.nome ?? "cultura"} — colheita #${colheita.id}` })))).filter((c) => !novo.empresaId || String(c.empresaId) === novo.empresaId);

  return (
    <div>
      <Cabecalho titulo="Logística e Exportação" subtitulo="Operações de transporte e exportação da produção." />
      {podeGerir && <NovoRegistro rotulo="Nova operação">
        {erro && <div className="erro">{erro}</div>}
        <form className="linha" onSubmit={criar}>
          <label>Empresa e propriedade
            <select value={novo.empresaId} onChange={(e) => setNovo({ ...novo, empresaId: e.target.value, colheitaId: "" })} required>
              <option value="">Selecione</option>
              {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.rotulo}</option>)}
            </select>
          </label>
          <label>Colheita
            <select value={novo.colheitaId} onChange={(e) => setNovo({ ...novo, colheitaId: e.target.value })} required disabled={!novo.empresaId}>
              <option value="">Selecione</option>
              {colheitas.map((colheita) => <option key={colheita.id} value={colheita.id}>{colheita.rotulo}</option>)}
            </select>
          </label>
          <label>Origem <input value={novo.origem} onChange={(e) => setNovo({ ...novo, origem: e.target.value })} placeholder="Petrolina/PE" required /></label>
          <label>Destino <input value={novo.destino} onChange={(e) => setNovo({ ...novo, destino: e.target.value })} placeholder="Rotterdam" required /></label>
          <label>Modal
            <select value={novo.modal} onChange={(e) => setNovo({ ...novo, modal: e.target.value })}>
              <option value="maritimo">marítimo</option>
              <option value="aereo">aéreo</option>
              <option value="rodoviario">rodoviário</option>
            </select>
          </label>
          <label>Transportadora <input value={novo.transportadora} onChange={(e) => setNovo({ ...novo, transportadora: e.target.value })} /></label>
          <label>Data prevista <input type="date" value={novo.dataPrevista} onChange={(e) => setNovo({ ...novo, dataPrevista: e.target.value })} /></label>
          <label>Tempo estimado (h) <input type="number" min="0" value={novo.tempoEstimadoHoras} onChange={(e) => setNovo({ ...novo, tempoEstimadoHoras: e.target.value })} /></label>
          <label>Custo (R$) <input type="number" step="any" value={novo.custoEstimado} onChange={(e) => setNovo({ ...novo, custoEstimado: e.target.value })} /></label>
          <label>Situação
            <select value={novo.status} onChange={(e) => setNovo({ ...novo, status: e.target.value })}>
              <option value="planejada">planejada</option>
              <option value="em_transporte">em transporte</option>
              <option value="concluida">concluída</option>
              <option value="cancelada">cancelada</option>
            </select>
          </label>
          <button type="submit">Registrar operação</button>
        </form>
      </NovoRegistro>}

      <div className="painel">
        <table>
          <thead><tr><th>Colheita</th><th>Origem</th><th>Destino</th><th>Modal</th><th>Transportadora</th><th>Data prevista</th><th>Tempo</th><th>Custo</th><th>Situação</th></tr></thead>
          <tbody>
            {operacoes.map((o) => (
              <tr key={o.id}>
                <td>{o.talhaoNome ?? `#${o.colheitaId}`}</td>
                <td>{o.origem}</td>
                <td>{o.destino}</td>
                <td>{o.modal}</td>
                <td>{o.transportadora ?? "—"}</td>
                <td>{o.dataPrevista ? new Date(o.dataPrevista).toLocaleDateString("pt-BR") : "—"}</td>
                <td>{o.tempoEstimadoHoras != null ? `${o.tempoEstimadoHoras} h` : "—"}</td>
                <td>{o.custoEstimado != null ? `R$ ${o.custoEstimado.toLocaleString("pt-BR")}` : "—"}</td>
                <td><span className="badge ativo">{String(o.situacao).toLowerCase()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
