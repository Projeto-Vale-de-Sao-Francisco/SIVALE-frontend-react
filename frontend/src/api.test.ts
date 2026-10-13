import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, salvarSessao } from "./api";

describe("cliente HTTP", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("envia o token ao revogar a sessão no backend", async () => {
    salvarSessao("token-de-teste", { id: 1, perfil: "ADMIN" });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await api.logout();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer token-de-teste" }) }),
    );
  });

  it("adapta a resposta de login do Chico Talhão para a sessão do frontend", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ accessToken: "jwt", user: { id: 7, nome: "Ana", email: "ana@example.com", tipo: "ADMIN" } }),
    );

    await expect(api.login("ana@example.com", "senha-segura")).resolves.toEqual({
      token: "jwt",
      usuario: { id: 7, nomeCompleto: "Ana", email: "ana@example.com", perfil: "ADMIN" },
    });
  });

  it("consulta lotes e normaliza relações aninhadas", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json([{ id: 3, nome: "Lote Norte", propriedade_id: 2, area: 12, situacao: "ATIVO", propriedade: { id: 2, nome: "Fazenda Sol" }, culturas: [{ cultura: { id: 4, nome: "Uva" }, data_plantio: "2026-01-01", previsao_colheita: "2026-05-01", status: "ATIVA" }] }]),
    );

    const lotes = await api.talhoes();

    expect(fetchMock.mock.calls[0][0]).toBe("/api/lotes");
    expect(lotes[0]).toMatchObject({ id: 3, propriedadeId: 2, culturaId: 4, cultura: { id: 4, nome: "Uva" }, dataPlantio: "2026-01-01", previsaoColheita: "2026-05-01" });
  });

  it("deriva propriedades das relações dos lotes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json([
        { id: 1, propriedade: { id: 8, nome: "Fazenda Azul", municipio: "Petrolina" } },
        { id: 2, propriedade: { id: 8, nome: "Fazenda Azul", municipio: "Petrolina" } },
      ]),
    );

    await expect(api.propriedades()).resolves.toEqual([{ id: 8, nome: "Fazenda Azul", municipio: "Petrolina" }]);
  });

  it("usa os nomes de consulta do dashboard e extrai a lista paginada", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ data: [{ id: 1 }], meta: { total: 1 } }));

    await expect(api.dashboardHistorico({ talhaoId: 5, dataInicio: "2026-01-01" })).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock.mock.calls[0][0]).toContain("/dashboard/historico?talhao_id=5&data_inicio=2026-01-01");
  });

  it("envia o status de alertas no formato aceito pelo backend", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json([]));

    await api.alertas({ resolvido: "false" });

    expect(fetchMock.mock.calls[0][0]).toBe("/api/alerts?status=ativo");
  });

  it("combina mensagens de validação do NestJS", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: ["campo obrigatório", "valor inválido"] }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(api.login("x@example.com", "senha")).rejects.toThrow("campo obrigatório · valor inválido");
  });

  it("produz mensagem estável quando o erro não contém JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("indisponível", { status: 503 }));
    await expect(api.me()).rejects.toThrow("Erro na requisição.");
  });

  it("envia operação logística com status inicial aceito pelo backend", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ id: 1 }));

    await api.criarLogistica({ empresaId: 2, colheitaId: 3, origem: "Petrolina", destino: "Rotterdam", modal: "maritimo" });

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(options.body))).toMatchObject({ empresa_id: 2, colheita_id: 3, status: "planejada" });
  });

  it("envia todos os campos obrigatórios ao cadastrar valor de mercado", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ id: 1 }));

    await api.criarValorMercado({ culturaId: 4, mercadoDestino: "União Europeia", paisDestino: "Países Baixos", precoMedio: 12.5, moeda: "EUR", unidadeMedida: "kg", demandaEstimada: 1200, dataReferencia: "2026-10-13" });

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(options.body))).toEqual({ cultura_id: 4, data_referencia: "2026-10-13", mercado_destino: "União Europeia", pais_destino: "Países Baixos", preco: 12.5, moeda: "EUR", unidade_medida: "kg", demanda_estimada: 1200 });
  });

  it("informa a cultura selecionada ao importar dados de mercado", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ inseridos: 1, atualizados: 0 }));

    await api.atualizarMercado(7);

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(options.body))).toEqual({ cultura_id: 7 });
  });

  it("normaliza o nome do talhão aninhado na operação logística", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ data: [{ id: 9, colheita_id: 3, status: "planejada", colheita: { talhao_cultura: { talhao: { nome: "Talhão Norte" } } } }] }));

    await expect(api.logistica()).resolves.toMatchObject([{ id: 9, colheitaId: 3, talhaoNome: "Talhão Norte", situacao: "planejada" }]);
  });
});
