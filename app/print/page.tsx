import menuData from "../data/menuData.json";
import Image from "next/image";

interface PizzaPrices {
  personal: number;
  mediana: number;
  familiar: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  image?: string;
  price?: number;
  prices?: PizzaPrices;
}

const SAMPLE_IMAGES: Record<string, string> = {
  default:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
  pizzas:
    "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&q=80",
  salchipapas:
    "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500&q=80",
  pastas:
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&q=80",
};

export default function PrintMenuPage() {
  return (
    <>
      {/* Inyección de regla CSS para forzar impresión en HORIZONTAL sin márgenes */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 6mm;
        }
        @media print {
          body {
            background-color: #0d0b0a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <main className="min-h-screen w-full bg-[url('/madera-rustica2.jpg')] bg-cover bg-center p-4 text-white font-sans print:bg-[#0d0b0a] print:p-0 print:[-webkit-print-color-adjust:exact]">
        {/* Cabecera Horizontal Compacta */}
        <header className="flex justify-between items-center bg-neutral-950/90 backdrop-blur-md border border-amber-950/60 px-6 py-2.5 rounded-xl shadow-xl mb-4 print:bg-neutral-950 print:border-amber-900/60 print:[-webkit-print-color-adjust:exact]">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Logo Don Corleone"
              width={130}
              height={40}
              priority
              className="h-9 w-auto drop-shadow-[0_2px_8px_rgba(255,107,0,0.3)]"
            />
            <span className="text-xs text-amber-400 font-bold tracking-widest uppercase border-l border-neutral-800 pl-3">
              Carta Oficial • Edición Impresa
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 font-semibold uppercase">
            Pizzas Artesanales • Tacna
          </p>
        </header>

        {/* Grilla de 3 Columnas Estilo Tríptico / Folleto */}
        <div className="grid grid-cols-3 gap-3.5 w-full items-start">
          {menuData.categories.map((category) => (
            <div key={category.id} className="space-y-3">
              {category.sections.map((section) => (
                <section key={section.title} className="space-y-2 w-full">
                  {/* Banner de Título de Sección */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-red-900 via-red-800 to-neutral-900 px-3 py-1.5 rounded-lg border-l-4 border-amber-400 border-y border-r border-red-700/60 shadow-md print:bg-red-900 print:[-webkit-print-color-adjust:exact]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🍕</span>
                      <h2 className="text-[11px] font-black tracking-widest text-white uppercase">
                        {section.title}
                      </h2>
                    </div>
                  </div>

                  {/* Lista Compacta de Platos en la Columna */}
                  <div className="space-y-2 w-full">
                    {(section.items as MenuItem[]).map((item) => (
                      <div
                        key={item.id}
                        className="w-full bg-neutral-950/90 backdrop-blur-sm border border-amber-900/40 rounded-xl p-2.5 shadow-md flex flex-col justify-between gap-2 print:bg-neutral-950 print:border-amber-900/50 print:[-webkit-print-color-adjust:exact]"
                      >
                        {/* Fila: Foto + Título + Descripción */}
                        <div className="flex gap-2 items-center w-full">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-amber-500/20 shadow flex-shrink-0">
                            <img
                              src={
                                SAMPLE_IMAGES[category.id] ||
                                SAMPLE_IMAGES.default
                              }
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <h3 className="text-xs font-black text-white tracking-wide truncate">
                                {item.name}
                              </h3>
                              {item.price && (
                                <span className="font-black text-amber-400 text-xs whitespace-nowrap">
                                  S/{item.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-400 line-clamp-2 leading-tight">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Bloque de Precios Triples (Personal / Mediana / Familiar) */}
                        {item.prices && (
                          <div className="grid grid-cols-3 gap-1 w-full pt-1 border-t border-neutral-800">
                            <div className="flex justify-between items-center bg-neutral-900/80 px-1.5 py-0.5 rounded border border-neutral-800/80 print:bg-neutral-900 print:[-webkit-print-color-adjust:exact]">
                              <span className="text-[8px] text-neutral-400 font-semibold">
                                P
                              </span>
                              <span className="font-black text-amber-400 text-[10px]">
                                S/{item.prices.personal.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-neutral-900/80 px-1.5 py-0.5 rounded border border-neutral-800/80 print:bg-neutral-900 print:[-webkit-print-color-adjust:exact]">
                              <span className="text-[8px] text-neutral-400 font-semibold">
                                M
                              </span>
                              <span className="font-black text-amber-400 text-[10px]">
                                S/{item.prices.mediana.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-neutral-900/80 px-1.5 py-0.5 rounded border border-neutral-800/80 print:bg-neutral-900 print:[-webkit-print-color-adjust:exact]">
                              <span className="text-[8px] text-neutral-400 font-semibold">
                                F
                              </span>
                              <span className="font-black text-amber-400 text-[10px]">
                                S/{item.prices.familiar.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ))}
        </div>

        {/* Pie de Página */}
        <footer className="mt-4 pt-2 text-center text-[10px] text-neutral-400 border-t border-amber-950/60 print:text-neutral-500">
          <p>
            Don Corleone Tacna • Siente la Diferencia • Carta de Especialidades
          </p>
        </footer>
      </main>
    </>
  );
}
