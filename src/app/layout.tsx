import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource/atkinson-hyperlegible-next/latin-400.css";
import "@fontsource/atkinson-hyperlegible-next/latin-700.css";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farol Amigo",
  description:
    "Consulte os tempos de travessia e solicite a revisão de um farol. Projeto acadêmico CitizenTech da equipe Humanly.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
        <SiteHeader />
        {children}
        <footer className="site-width site-footer">
          <p>Farol Amigo · Humanly · CitizenTech</p>
          <p>Protótipo acadêmico. Sem vínculo de atendimento com a CET.</p>
          <p><Link href="/painel" className="footer-operator-link">Área do operador</Link></p>
        </footer>
      </body>
    </html>
  );
}
