import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "../api";

export default function Dashboard() {
  const [resumo, setResumo] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const [r, h, a] = await Promise.all([
      api.dashboardResumo(),
      api.dashboardHistorico(),
      api.alertas({ visualizado: "false" }),
    ]);
    setResumo(r);
    setHistorico(
      h.map((item: any) => ({
        ...item,
        hora: new Date(item.dataHora).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
      }))
    );
    setAlertas(a);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  if (carregando) return <p>Carregando dashboard...</p>;

  return (
    <div>
      <h2>Dashboard Principal</h2>
      <p style={{ color: "#6b7280" }}>Visão geral do monitoramento climático em tempo real.</p>

      <div className="cartoes">
        <div className="cartao">
          <div className="rotulo">Temperatura atual</div>
          <div className="valor">{resumo.temperaturaAtual ?? "—"}°C</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Umidade atual</div>
          <div className="valor">{resumo.umidadeAtual ?? "—"}%</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Temperatura média</div>
          <div className="valor">{resumo.temperaturaMedia}°C</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Umidade média</div>
          <div className="valor">{resumo.umidadeMedia}%</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Sensores ativos</div>
          <div className="valor">{resumo.sensoresAtivos}</div>
        </div>
        <div className="cartao">
          <div className="rotulo">Leituras registradas</div>
          <div className="valor">{resumo.totalLeituras}</div>
        </div>
        <div className={`cartao ${resumo.alertasAtivos > 0 ? "alerta" : ""}`}>
          <div className="rotulo">Alertas ativos</div>
          <div className="valor">{resumo.alertasAtivos}</div>
        </div>
      </div>

      <div className="painel">
        <h3>Histórico climático (temperatura × umidade)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={historico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hora" tick={{ fontSize: 11 }} minTickGap={30} />
            <YAxis yAxisId="temp" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="umid" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="temp" type="monotone" dataKey="temperatura" name="Temperatura (°C)" stroke="#dc2626" dot={false} strokeWidth={2} />
            <Line yAxisId="umid" type="monotone" dataKey="umidade" name="Umidade (%)" stroke="#2563eb" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="painel">
        <h3>Alertas recentes</h3>
        {alertas.length === 0 && <p style={{ color: "#6b7280" }}>Nenhum alerta pendente.</p>}
        <table>
          <thead>
            <tr><th>Nível</th><th>Descrição</th><th>Data/Hora</th></tr>
          </thead>
          <tbody>
            {alertas.map((a) => (
              <tr key={a.id}>
                <td><span className={`badge ${a.nivel}`}>{a.nivel}</span></td>
                <td>{a.descricao}</td>
                <td>{new Date(a.dataHora).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
