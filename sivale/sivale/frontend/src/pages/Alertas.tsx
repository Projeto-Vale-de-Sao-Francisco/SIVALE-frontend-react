import { useEffect, useState } from "react";
import { api } from "../api";

export default function Alertas() {
  const [alertas, setAlertas] = useState<any[]>([]);

  async function carregar() {
    setAlertas(await api.alertas());
  }

  useEffect(() => { carregar(); }, []);

  async function marcarVisto(id: number) {
    await api.visualizarAlerta(id);
    carregar();
  }

  return (
    <div>
      <h2>Alertas Climáticos</h2>
      <div className="painel">
        <table>
          <thead><tr><th>Nível</th><th>Descrição</th><th>Data/Hora</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {alertas.map((a) => (
              <tr key={a.id}>
                <td><span className={`badge ${a.nivel}`}>{a.nivel}</span></td>
                <td>{a.descricao}</td>
                <td>{new Date(a.dataHora).toLocaleString("pt-BR")}</td>
                <td>{a.visualizado ? <span className="badge ativo">visto</span> : <span className="badge atencao">pendente</span>}</td>
                <td>{!a.visualizado && <button className="secundario" onClick={() => marcarVisto(a.id)}>Marcar como visto</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
