import { describe, expect, it } from "vitest";
import productionEnv from "../.env.production?raw";
import vercel from "../vercel.json";

describe("configuração de produção", () => {
  it("mantém as chamadas da API na mesma origem e as encaminha ao Render", () => {
    expect(productionEnv).toContain("VITE_API_URL=/api");
    expect(vercel.rewrites).toContainEqual({
      source: "/api/:path*",
      destination: "https://chico-talhao-backend.onrender.com/:path*",
    });
  });
});
