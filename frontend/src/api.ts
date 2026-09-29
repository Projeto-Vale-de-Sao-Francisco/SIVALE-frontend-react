const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

function getToken() {
  return localStorage.getItem("sivale_token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("sivale_token");
    localStorage.removeItem("sivale_usuario");
    window.location.href = "/login";
    throw new Error("Sessão expirada.");
  }

  if (!res.ok) {
    const erro = await res.json().catch(() => ({ erro: "Erro desconhecido." }));
    throw new Error(erro.erro ? JSON.stringify(erro.erro) : "Erro na requisição.");
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (email: string, senha: string) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) }),
  dashboardResumo: () => request("/dashboard/resumo"),
  dashboardHistorico: (params: Record<string, string> = {}) =>
    request(`/dashboard/historico?${new URLSearchParams(params)}`),
  propriedades: () => request("/propriedades"),
  propriedade: (id: number) => request(`/propriedades/${id}`),
  criarPropriedade: (data: any) => request("/propriedades", { method: "POST", body: JSON.stringify(data) }),
  culturas: () => request("/culturas"),
  criarCultura: (data: any) => request("/culturas", { method: "POST", body: JSON.stringify(data) }),
  lotes: (params: Record<string, string> = {}) => request(`/lotes?${new URLSearchParams(params)}`),
  criarLote: (data: any) => request("/lotes", { method: "POST", body: JSON.stringify(data) }),
  sensores: (params: Record<string, string> = {}) => request(`/sensores?${new URLSearchParams(params)}`),
  criarSensor: (data: any) => request("/sensores", { method: "POST", body: JSON.stringify(data) }),
  leituras: (params: Record<string, string> = {}) => request(`/leituras?${new URLSearchParams(params)}`),
  registrarLeitura: (data: any) => request("/leituras", { method: "POST", body: JSON.stringify(data) }),
  mercado: () => request("/mercado"),
  criarDadoMercado: (data: any) => request("/mercado", { method: "POST", body: JSON.stringify(data) }),
  logistica: () => request("/logistica"),
  criarLogistica: (data: any) => request("/logistica", { method: "POST", body: JSON.stringify(data) }),
  alertas: (params: Record<string, string> = {}) => request(`/alertas?${new URLSearchParams(params)}`),
  visualizarAlerta: (id: number) => request(`/alertas/${id}/visualizar`, { method: "PATCH" }),
  empresas: () => request("/empresas"),
};

export function salvarSessao(token: string, usuario: any) {
  localStorage.setItem("sivale_token", token);
  localStorage.setItem("sivale_usuario", JSON.stringify(usuario));
}

export function limparSessao() {
  localStorage.removeItem("sivale_token");
  localStorage.removeItem("sivale_usuario");
}

export function usuarioAtual() {
  const raw = localStorage.getItem("sivale_usuario");
  return raw ? JSON.parse(raw) : null;
}

export function estaAutenticado() {
  return !!getToken();
}
