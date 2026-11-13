import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farol Amigo",
  description:
    "Consulte os tempos de travessia e solicite a revisão de um farol. Projeto acadêmico CitizenTech da equipe Humanly.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
