const CAMINHOS: Record<string, string> = {
  mapa: "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15",
  propriedades: "M3 21V9l9-6 9 6v12zM9 21v-6h6v6",
  culturas: "M12 22V12M12 12C12 7 8 4 3 4c0 5 3 8 9 8zM12 14c0-4 3-7 9-7 0 5-3 8-9 8z",
  lotes: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
  sensores: "M5 12a7 7 0 0 1 14 0M8.5 12a3.5 3.5 0 0 1 7 0M12 12v.01M12 16v5",
  mercado: "M3 17l6-6 4 4 8-8M15 7h6v6",
  logistica: "M1 6h13v10H1zM14 10h5l3 3v3h-8zM6 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  alertas: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  mais: "M5 12h.01M12 12h.01M19 12h.01",
  sair: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  busca: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  exportar: "M12 3v12M7 8l5-5 5 5M5 21h14",
};

export default function Icon({ nome, tamanho = 22 }: { nome: string; tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={CAMINHOS[nome] ?? ""} />
    </svg>
  );
}
