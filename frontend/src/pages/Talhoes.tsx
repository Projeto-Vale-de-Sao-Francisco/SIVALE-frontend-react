import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polygon, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import NovoRegistro from "../NovoRegistro";
import Cabecalho from "../Cabecalho";
import { api } from "../api";
import { ehAdmin } from "../perfil";
import { calcularAreaHa, fmtData, type Ponto } from "../geo";

const vazio = { propriedadeId: "", culturaId: "", nome: "", area: "", dataPlantio: "", previsaoColheita: "" };
const num = (v: string) => (v === "" ? undefined : Number(v));
const TILE_SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

function CapturarPontos({ aoClicar }: { aoClicar: (ponto: Ponto) => void }) {
  useMapEvents({ click: (e) => aoClicar([e.latlng.lat, e.latlng.lng]) });
  return null;
}

function Centralizar({ centro }: { centro: Ponto }) {
  const mapa = useMap();
  useEffect(() => { mapa.setView(centro, 17); }, [centro[0], centro[1], mapa]);
  return null;
}

export default function Talhoes() {
  const [talhoes, setTalhoes] = useState<any[]>([]);
  const [propriedades, setPropriedades] = useState<any[]>([]);
  const [culturas, setCulturas] = useState<any[]>([]);
  const [novo, setNovo] = useState(vazio);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [erro, setErro] = useState("");
  const podeCriar = ehAdmin();

  async function carregar() {
    const [t, p, c] = await Promise.all([api.talhoes(), api.propriedades(), api.culturas()]);
    setTalhoes(t);
    setPropriedades(p);
    setCulturas(c);
    setNovo((n) => ({ ...n, propriedadeId: n.propriedadeId || String(p[0]?.id ?? ""), culturaId: n.culturaId || String(c[0]?.id ?? "") }));
  }
  useEffect(() => { carregar(); }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    try {
      await api.criarTalhao({
        propriedadeId: Number(novo.propriedadeId),
        culturaId: novo.culturaId ? Number(novo.culturaId) : undefined,
        nome: novo.nome,
        area: num(novo.area),
        poligono: pontos,
        dataPlantio: novo.dataPlantio || undefined,
        previsaoColheita: novo.previsaoColheita || undefined,
        status: "ativo",
      });
      setNovo({ ...vazio, propriedadeId: novo.propriedadeId, culturaId: novo.culturaId });
      setPontos([]);
      carregar();
    } catch (err: any) {
      setErro(err.message);
    }
  }

  const set = (campo: keyof typeof vazio) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setNovo({ ...novo, [campo]: e.target.value });
  const nomePropriedade = (id: number) => propriedades.find((p) => p.id === id)?.nome ?? id;
  const propriedadeSelecionada = propriedades.find((p) => String(p.id) === novo.propriedadeId);
  const centro: Ponto = [propriedadeSelecionada?.latitude ?? -9.39, propriedadeSelecionada?.longitude ?? -40.5];
  function adicionarPonto(ponto: Ponto) {
    const proximos = [...pontos, ponto];
    setPontos(proximos);
    const area = calcularAreaHa(proximos);
    setNovo((atual) => ({ ...atual, area: area ? area.toFixed(2) : "" }));
  }
  function limparDesenho() {
    setPontos([]);
    setNovo((atual) => ({ ...atual, area: "" }));
  }
  function desfazerPonto() {
    const proximos = pontos.slice(0, -1);
    setPontos(proximos);
    const area = calcularAreaHa(proximos);
    setNovo((atual) => ({ ...atual, area: area ? area.toFixed(2) : "" }));
  }

  return (
    <div>
      <Cabecalho titulo="Talhões" subtitulo="Divisões de cada propriedade e a cultura plantada em cada uma." />
      {podeCriar && (
        <NovoRegistro rotulo="Novo talhão">
          {erro && <div className="erro">{erro}</div>}
          <form className="linha" onSubmit={criar}>
            <label>Propriedade
              <select value={novo.propriedadeId} onChange={(e) => { setNovo({ ...novo, propriedadeId: e.target.value, area: "" }); setPontos([]); }}>
                {propriedades.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </label>
            <label>Cultura
              <select value={novo.culturaId} onChange={set("culturaId")} required>
                {culturas.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.variedade ? ` · ${c.variedade}` : ""}</option>)}
              </select>
            </label>
            <label>Nome <input value={novo.nome} onChange={set("nome")} placeholder="Talhão 42" required /></label>
            <label>Área calculada (ha) <input type="number" value={novo.area} readOnly required placeholder="Desenhe no mapa" /></label>
            <label>Plantio <input type="date" value={novo.dataPlantio} onChange={set("dataPlantio")} required /></label>
            <label>Colheita prevista <input type="date" value={novo.previsaoColheita} onChange={set("previsaoColheita")} /></label>
            <div className="desenho-talhao">
              <div className="desenho-cabecalho">
                <div><b>Marque o talhão no mapa</b><small>Clique nos limites da área. Use no mínimo três pontos.</small></div>
                <div className="desenho-acoes">
                  <button type="button" className="secundario" onClick={desfazerPonto} disabled={!pontos.length}>Desfazer</button>
                  <button type="button" className="secundario" onClick={limparDesenho} disabled={!pontos.length}>Limpar</button>
                </div>
              </div>
              <div className="mapa-desenho">
                <MapContainer center={centro} zoom={17} style={{ height: "100%", width: "100%" }}>
                  <TileLayer attribution="Imagens &copy; Esri, Maxar, Earthstar Geographics" url={TILE_SAT} maxZoom={19} />
                  <Centralizar centro={centro} />
                  <CapturarPontos aoClicar={adicionarPonto} />
                  {pontos.length >= 3 && <Polygon positions={pontos} pathOptions={{ color: "#16a34a", weight: 3, fillColor: "#22c55e", fillOpacity: 0.3 }} />}
                  {pontos.map((ponto, i) => <CircleMarker key={`${ponto[0]}-${ponto[1]}-${i}`} center={ponto} radius={6} pathOptions={{ color: "#fff", weight: 2, fillColor: "#16a34a", fillOpacity: 1 }}><Tooltip>{i + 1}</Tooltip></CircleMarker>)}
                </MapContainer>
                <strong>{novo.area ? `${novo.area} ha` : `${pontos.length} ${pontos.length === 1 ? "ponto" : "pontos"}`}</strong>
              </div>
            </div>
            <button type="submit" disabled={pontos.length < 3 || !novo.area}>Adicionar talhão</button>
          </form>
        </NovoRegistro>
      )}

      <div className="painel">
        <table>
          <thead><tr><th>Nome</th><th>Propriedade</th><th>Cultura</th><th>Área (ha)</th><th>Plantio</th><th>Colheita</th><th>Alertas</th><th>Status</th></tr></thead>
          <tbody>
            {talhoes.map((t) => (
              <tr key={t.id}>
                <td>{t.nome}</td>
                <td>{nomePropriedade(t.propriedadeId)}</td>
                <td>{t.cultura?.nome ?? "—"}</td>
                <td>{t.area ?? "—"}</td>
                <td>{fmtData(t.dataPlantio)}</td>
                <td>{fmtData(t.previsaoColheita)}</td>
                <td>{t._count?.alerta ? <span className="badge atencao">{t._count.alerta}</span> : "—"}</td>
                <td><span className={`badge ${t.status === "ATIVO" ? "ativo" : "inativo"}`}>{t.status.toLowerCase()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
