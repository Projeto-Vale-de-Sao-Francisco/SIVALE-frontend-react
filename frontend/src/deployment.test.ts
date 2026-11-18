import { describe, expect, it } from "vitest";
import vercel from "../vercel.json";

describe("configuração de produção", () => {
  it("mantém as chamadas da API na mesma origem e as encaminha ao Render", () => {
    expect(vercel.rewrites).toContainEqual({
      source: "/api/:path*",
      destination: "https://chico-talhao-backend.onrender.com/:path*",
    });
  });

  it("define headers de segurança sem permitir scripts inline", () => {
    const headers = vercel.headers[0].headers;
    expect(headers).toContainEqual(expect.objectContaining({
      key: "Content-Security-Policy",
      value: expect.stringContaining("script-src 'self'"),
    }));
    expect(headers).toContainEqual(expect.objectContaining({
      key: "Strict-Transport-Security",
    }));
    expect(headers).toContainEqual(expect.objectContaining({
      key: "X-Content-Type-Options",
      value: "nosniff",
    }));
  });
});
