import { useEffect, useState } from "react";
import Cabecalho from "../Cabecalho";
import { api } from "../api";

type AuditEntry = {
  id: number;
  usuario_id: number | null;
  usuario: { nome: string } | null;
  acao: string;
  recurso: string;
  recurso_id: string | null;
  ip_origem: string | null;
  criado_em: string;
};

type Filters = {
  usuarioId: string;
  acao: string;
  recurso: string;
  recursoId: string;
  dataInicio: string;
  dataFim: string;
};

const filtrosVazios: Filters = {
  usuarioId: "",
  acao: "",
  recurso: "",
  recursoId: "",
  dataInicio: "",
  dataFim: "",
};

export default function Auditoria() {
  const [filtros, setFiltros] = useState(filtrosVazios);
  const [aplicados, setAplicados] = useState(filtrosVazios);
  const [pagina, setPagina] = useState(1);
  const [registros, setRegistros] = useState<AuditEntry[]>([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativa = true;
    setCarregando(true);
    setErro("");
    api.auditLogs({ ...aplicados, page: pagina, limit: 25 })
      .then((resultado: { data: AuditEntry[]; meta: { totalPages: number } }) => {
        if (!ativa) return;
        setRegistros(resultado.data);
        setTotalPaginas(Math.max(1, resultado.meta.totalPages));
      })
      .catch((error: Error) => {
        if (ativa) setErro(error.message || "Não foi possível carregar os registros.");
      })
      .finally(() => {
        if (ativa) setCarregando(false);
      });
    return () => { ativa = false; };
  }, [aplicados, pagina]);

  function aplicarFiltros(evento: React.FormEvent) {
    evento.preventDefault();
    setPagina(1);
    setAplicados({ ...filtros });
  }

  function alterar(campo: keyof Filters) {
    return (evento: React.ChangeEvent<HTMLInputElement>) => {
      setFiltros((atual) => ({ ...atual, [campo]: evento.target.value }));
    };
  }

  return (
    <div>
      <Cabecalho titulo="Auditoria" subtitulo="Consulta administrativa e somente leitura das operações registradas." />
      {erro && <div className="erro" role="alert">{erro}</div>}
      <section className="painel">
        <form className="linha" onSubmit={aplicarFiltros}>
          <label>ID do usuário <input inputMode="numeric" value={filtros.usuarioId} onChange={alterar("usuarioId")} /></label>
          <label>Operação <input value={filtros.acao} onChange={alterar("acao")} /></label>
          <label>Recurso <input value={filtros.recurso} onChange={alterar("recurso")} /></label>
          <label>ID do recurso <input value={filtros.recursoId} onChange={alterar("recursoId")} /></label>
          <label>Data inicial <input type="date" value={filtros.dataInicio} onChange={alterar("dataInicio")} /></label>
          <label>Data final <input type="date" value={filtros.dataFim} onChange={alterar("dataFim")} /></label>
          <button type="submit">Filtrar</button>
          <button type="button" className="secundario" onClick={() => {
            setFiltros(filtrosVazios);
            setAplicados(filtrosVazios);
            setPagina(1);
          }}>Limpar</button>
        </form>
      </section>
      <section className="painel" aria-live="polite">
        {carregando ? <p>Carregando registros...</p> : erro ? null : registros.length === 0 ? <p>Nenhum registro encontrado.</p> : (
          <table>
            <thead><tr><th>Data/hora (UTC)</th><th>Usuário</th><th>Operação</th><th>Recurso</th><th>ID do recurso</th><th>IP</th></tr></thead>
            <tbody>{registros.map((registro) => (
              <tr key={registro.id}>
                <td>{new Date(registro.criado_em).toLocaleString("pt-BR", { timeZone: "UTC" })}</td>
                <td>{registro.usuario?.nome ?? (registro.usuario_id ? `Usuário ${registro.usuario_id}` : "Sistema")}</td>
                <td>{registro.acao}</td>
                <td>{registro.recurso}</td>
                <td>{registro.recurso_id ?? "—"}</td>
                <td>{registro.ip_origem ?? "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
        <div className="linha" aria-label="Paginação">
          <button className="secundario" disabled={carregando || pagina <= 1} onClick={() => setPagina((atual) => atual - 1)}>Anterior</button>
          <span>Página {pagina} de {totalPaginas}</span>
          <button className="secundario" disabled={carregando || pagina >= totalPaginas} onClick={() => setPagina((atual) => atual + 1)}>Próxima</button>
        </div>
      </section>
    </div>
  );
}
