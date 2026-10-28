import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

// Cargamos la fuente Fredoka
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "Carta Virtual | Don Corleone",
  description: "Pizzas artesanales, siente la diferencia en cada bocado",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={fredoka.variable}>
      <body
        className={`${fredoka.className} font-sans min-h-full flex flex-col antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
