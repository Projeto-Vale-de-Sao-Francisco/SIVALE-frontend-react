import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Propriedades from "./pages/Propriedades";
import Culturas from "./pages/Culturas";
import Lotes from "./pages/Lotes";
import Sensores from "./pages/Sensores";
import Mercado from "./pages/Mercado";
import Logistica from "./pages/Logistica";
import Alertas from "./pages/Alertas";
import Icon from "./Icon";
import { estaAutenticado, limparSessao, usuarioAtual } from "./api";

function RotaProtegida({ children }: { children: JSX.Element }) {
  if (!estaAutenticado()) return <Navigate to="/login" replace />;
  return children;
}

const ITENS = [
  { to: "/", rotulo: "Mapa", icone: "mapa", principal: true },
  { to: "/alertas", rotulo: "Alertas", icone: "alertas", principal: true },
  { to: "/sensores", rotulo: "Sensores", icone: "sensores", principal: true },
  { to: "/lotes", rotulo: "Lotes", icone: "lotes", principal: true },
  { to: "/propriedades", rotulo: "Propriedades", icone: "propriedades", principal: false },
  { to: "/culturas", rotulo: "Culturas", icone: "culturas", principal: false },
  { to: "/mercado", rotulo: "Mercado", icone: "mercado", principal: false },
  { to: "/logistica", rotulo: "Logística", icone: "logistica", principal: false },
];

// Em telas estreitas as tabelas viram cartões; o CSS usa data-label de cada célula.
function useRotulosDeTabela(chave: string) {
  useEffect(() => {
    function marcar() {
      document.querySelectorAll("table").forEach((t) => {
        const cab = Array.from(t.querySelectorAll("thead th")).map((th) => th.textContent ?? "");
        t.querySelectorAll("tbody tr").forEach((tr) =>
          Array.from(tr.children).forEach((td, i) => td.setAttribute("data-label", cab[i] ?? ""))
        );
      });
    }
    marcar();
    const obs = new MutationObserver(marcar);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [chave]);
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const local = useLocation();
  const usuario = usuarioAtual();
  const [maisAberto, setMaisAberto] = useState(false);
  const cheio = local.pathname === "/";

  useRotulosDeTabela(local.pathname);
  useEffect(() => setMaisAberto(false), [local.pathname]);

  function sair() {
    limparSessao();
    navigate("/login");
  }

  const classe = ({ isActive }: { isActive: boolean }) => (isActive ? "ativo" : "");

  return (
    <div className="layout">
      <nav className="trilho" aria-label="Navegação principal">
        <div className="logo" title="SIVALE">S</div>
        {ITENS.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.to === "/"} className={classe} data-rotulo={i.rotulo} aria-label={i.rotulo}>
            <Icon nome={i.icone} />
          </NavLink>
        ))}
        <button className="item fim" onClick={sair} data-rotulo={`${usuario?.nome ?? "Usuário"} · Sair`} aria-label="Sair">
          <Icon nome="sair" />
        </button>
      </nav>

      <main className={`conteudo ${cheio ? "cheio" : ""}`}>{children}</main>

      <nav className="nav-inferior" aria-label="Navegação">
        {ITENS.filter((i) => i.principal).map((i) => (
          <NavLink key={i.to} to={i.to} end={i.to === "/"} className={classe}>
            <Icon nome={i.icone} />
            {i.rotulo}
          </NavLink>
        ))}
        <button onClick={() => setMaisAberto(true)}>
          <Icon nome="mais" />
          Mais
        </button>
      </nav>

      {maisAberto && (
        <div className="folha-mais" onClick={() => setMaisAberto(false)}>
          <div className="caixa" onClick={(e) => e.stopPropagation()}>
            {ITENS.filter((i) => !i.principal).map((i) => (
              <NavLink key={i.to} to={i.to}>
                <Icon nome={i.icone} />
                {i.rotulo}
              </NavLink>
            ))}
            <button onClick={sair}>
              <Icon nome="sair" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const protegida = (el: JSX.Element) => (
    <RotaProtegida>
      <Layout>{el}</Layout>
    </RotaProtegida>
  );
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={protegida(<Dashboard />)} />
        <Route path="/propriedades" element={protegida(<Propriedades />)} />
        <Route path="/culturas" element={protegida(<Culturas />)} />
        <Route path="/lotes" element={protegida(<Lotes />)} />
        <Route path="/sensores" element={protegida(<Sensores />)} />
        <Route path="/mercado" element={protegida(<Mercado />)} />
        <Route path="/logistica" element={protegida(<Logistica />)} />
        <Route path="/alertas" element={protegida(<Alertas />)} />
      </Routes>
    </BrowserRouter>
  );
}
