import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Propriedades from "./pages/Propriedades";
import Culturas from "./pages/Culturas";
import Lotes from "./pages/Lotes";
import Sensores from "./pages/Sensores";
import Mercado from "./pages/Mercado";
import Logistica from "./pages/Logistica";
import Alertas from "./pages/Alertas";
import { estaAutenticado, limparSessao, usuarioAtual } from "./api";

function RotaProtegida({ children }: { children: JSX.Element }) {
  if (!estaAutenticado()) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const usuario = usuarioAtual();

  function sair() {
    limparSessao();
    navigate("/login");
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>SIVALE</h1>
        <p className="sub">Vale do São Francisco</p>
        <NavLink to="/" end className={({ isActive }) => (isActive ? "ativo" : "")}>Dashboard</NavLink>
        <NavLink to="/propriedades" className={({ isActive }) => (isActive ? "ativo" : "")}>Propriedades</NavLink>
        <NavLink to="/culturas" className={({ isActive }) => (isActive ? "ativo" : "")}>Culturas</NavLink>
        <NavLink to="/lotes" className={({ isActive }) => (isActive ? "ativo" : "")}>Lotes</NavLink>
        <NavLink to="/sensores" className={({ isActive }) => (isActive ? "ativo" : "")}>Sensores</NavLink>
        <NavLink to="/mercado" className={({ isActive }) => (isActive ? "ativo" : "")}>Mercado</NavLink>
        <NavLink to="/logistica" className={({ isActive }) => (isActive ? "ativo" : "")}>Logística</NavLink>
        <NavLink to="/alertas" className={({ isActive }) => (isActive ? "ativo" : "")}>Alertas</NavLink>
        <div className="sair" onClick={sair}>
          {usuario?.nome ?? "Usuário"} · Sair
        </div>
      </aside>
      <main className="conteudo">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RotaProtegida><Layout><Dashboard /></Layout></RotaProtegida>} />
        <Route path="/propriedades" element={<RotaProtegida><Layout><Propriedades /></Layout></RotaProtegida>} />
        <Route path="/culturas" element={<RotaProtegida><Layout><Culturas /></Layout></RotaProtegida>} />
        <Route path="/lotes" element={<RotaProtegida><Layout><Lotes /></Layout></RotaProtegida>} />
        <Route path="/sensores" element={<RotaProtegida><Layout><Sensores /></Layout></RotaProtegida>} />
        <Route path="/mercado" element={<RotaProtegida><Layout><Mercado /></Layout></RotaProtegida>} />
        <Route path="/logistica" element={<RotaProtegida><Layout><Logistica /></Layout></RotaProtegida>} />
        <Route path="/alertas" element={<RotaProtegida><Layout><Alertas /></Layout></RotaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}
