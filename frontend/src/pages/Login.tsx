import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, salvarSessao } from "../api";

export default function Login() {
  const [email, setEmail] = useState("admin@sivale.com.br");
  const [senha, setSenha] = useState("123456");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const resposta = await api.login(email, senha);
      salvarSessao(resposta.token, resposta.usuario);
      navigate("/");
    } catch (err: any) {
      setErro(err.message || "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="tela-login">
      <form className="cartao-login" onSubmit={entrar}>
        <h1>SIVALE</h1>
        <p className="sub">Monitoramento climático e logístico — Vale do São Francisco</p>
        {erro && <div className="erro">{erro}</div>}
        <label>E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Senha</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <button type="submit" disabled={carregando}>{carregando ? "Entrando..." : "Entrar"}</button>
        <p className="dica">Login de teste: admin@sivale.com.br / 123456</p>
      </form>
    </div>
  );
}
