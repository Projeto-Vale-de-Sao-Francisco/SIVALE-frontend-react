import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api";
import Auditoria from "./Auditoria";

vi.mock("../api", () => ({
  api: { auditLogs: vi.fn() },
}));

describe("Auditoria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("apresenta registros e consulta a próxima página", async () => {
    vi.mocked(api.auditLogs)
      .mockResolvedValueOnce({
        data: [{
          id: 1,
          usuario_id: 7,
          usuario: { nome: "Ana" },
          acao: "ATUALIZAR",
          recurso: "USUARIO",
          recurso_id: "9",
          ip_origem: "192.0.2.1",
          criado_em: "2026-11-11T12:00:00.000Z",
        }],
        meta: { totalPages: 2 },
      })
      .mockResolvedValueOnce({ data: [], meta: { totalPages: 2 } });

    render(<Auditoria />);

    expect(await screen.findByText("ATUALIZAR")).toBeTruthy();
    expect(screen.getByText("Ana")).toBeTruthy();
    fireEvent.click(screen.getByText("Próxima"));

    await waitFor(() => {
      expect(api.auditLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, limit: 25 }),
      );
    });
  });

  it("apresenta erro de carregamento sem esconder os filtros", async () => {
    vi.mocked(api.auditLogs).mockRejectedValueOnce(new Error("Sem acesso"));

    render(<Auditoria />);

    expect((await screen.findByRole("alert")).textContent).toContain("Sem acesso");
    expect(screen.getByLabelText("Operação")).toBeTruthy();
    expect(screen.queryByText("Nenhum registro encontrado.")).toBeNull();
  });

  it("aplica filtros e apresenta estado vazio", async () => {
    vi.mocked(api.auditLogs).mockResolvedValue({
      data: [],
      meta: { totalPages: 0 },
    });

    render(<Auditoria />);
    await screen.findByText("Nenhum registro encontrado.");

    fireEvent.change(screen.getByLabelText("ID do usuário"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Operação"), {
      target: { value: "ATUALIZAR" },
    });
    fireEvent.change(screen.getByLabelText("Data inicial"), {
      target: { value: "2026-11-01" },
    });
    fireEvent.click(screen.getByText("Filtrar"));

    await waitFor(() => {
      expect(api.auditLogs).toHaveBeenLastCalledWith({
        usuarioId: "7",
        acao: "ATUALIZAR",
        recurso: "",
        recursoId: "",
        dataInicio: "2026-11-01",
        dataFim: "",
        page: 1,
        limit: 25,
      });
    });
    expect(await screen.findByText("Nenhum registro encontrado.")).toBeTruthy();
  });
});
