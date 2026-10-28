"use client";

import { useState } from "react";
import menuData from "./data/menuData.json";
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

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState(
    menuData.categories[0].id,
  );

  // Estado para controlar el menú flotante hamburguesa
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const selectedCategoryData = menuData.categories.find(
    (cat) => cat.id === activeCategory,
  );

  return (
    <main className="min-h-screen text-white font-sans w-full max-w-md mx-auto flex flex-col relative bg-transparent shadow-2xl">
      {/* Header Fijo */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-amber-950/60 px-4 py-3 text-center shadow-xl">
        <div className="flex justify-center mb-1">
          <Image
            src="/logo.svg"
            alt="Logo Don Corleone"
            width={160}
            height={50}
            priority
            className="h-11 w-auto drop-shadow-[0_2px_10px_rgba(255,107,0,0.3)]"
          />
        </div>

        <p className="text-[11px] text-amber-400 font-semibold tracking-wide uppercase">
          Pizzas artesanales • Siente la diferencia
        </p>

        {/* Pestañas Interactivas */}
        <nav className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar w-full">
          {menuData.categories.map((category) => {
            const isActive = category.id === activeCategory;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/50 border border-amber-500/40 scale-105"
                    : "bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 border border-neutral-800"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Contenido Principal */}
      <div className="p-4 space-y-6 pb-24 flex-1 w-full relative z-10">
        {selectedCategoryData?.sections.map((section) => (
          <section key={section.title} className="space-y-4 w-full">
            {/* Banner de Título estilo Pizzería Artesanal */}
            <div className="flex items-center gap-2.5 bg-gradient-to-r from-red-900 via-red-800 to-neutral-900 px-3.5 py-2.5 rounded-xl border-l-4 border-amber-400 border-y border-r border-red-700/60 shadow-xl">
              <span className="text-base">🍕</span>
              <h2 className="text-xs font-black tracking-widest text-white uppercase drop-shadow">
                {section.title}
              </h2>
            </div>

            {/* Listado de Tarjetas */}
            <div className="space-y-4 w-full">
              {(section.items as MenuItem[]).map((item) => (
                <div
                  key={item.id}
                  className="w-full bg-neutral-950/90 backdrop-blur-sm border border-amber-900/40 rounded-2xl p-3.5 shadow-xl flex flex-col gap-3 hover:border-red-600/40 transition-all"
                >
                  <div>
                    <h3 className="text-base font-black text-white tracking-wide">
                      {item.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex gap-3 items-center w-full">
                    {/* Imagen Local con carga diferida (lazy) */}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-amber-500/20 shadow-md flex-shrink-0 bg-neutral-900">
                      <img
                        src={item.image || "/images/default.jpg"}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-1.5 pl-2 border-l border-neutral-800/80 w-full">
                      {item.prices ? (
                        <>
                          <div className="flex justify-between items-center text-xs w-full bg-neutral-950/60 px-2 py-1 rounded-lg border border-neutral-800">
                            <span className="text-neutral-400 font-semibold">
                              Personal
                            </span>
                            <span className="font-black text-amber-400 text-xs">
                              S/{item.prices.personal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs w-full bg-neutral-950/60 px-2 py-1 rounded-lg border border-neutral-800">
                            <span className="text-neutral-400 font-semibold">
                              Mediana
                            </span>
                            <span className="font-black text-amber-400 text-xs">
                              S/{item.prices.mediana.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs w-full bg-neutral-950/60 px-2 py-1 rounded-lg border border-neutral-800">
                            <span className="text-neutral-400 font-semibold">
                              Familiar
                            </span>
                            <span className="font-black text-amber-400 text-xs">
                              S/{item.prices.familiar.toFixed(2)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center px-3 py-2 bg-gradient-to-r from-red-950/60 to-neutral-900 rounded-xl border border-red-900/40 w-full">
                          <span className="text-neutral-300 text-xs font-bold uppercase tracking-wider">
                            Precio
                          </span>
                          <span className="font-black text-amber-400 text-base">
                            S/{item.price?.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Menú Flotante Estilo Hamburguesa (Abajo a la derecha) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {/* Opciones desplegables cuando el menú está abierto */}
        {isMenuOpen && (
          <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <a
              href="/print"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMenuOpen(false)}
              className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl shadow-xl border border-amber-500/40 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer"
            >
              <span>🖨️</span>
              <span>Imprimir / Guardar PDF</span>
            </a>
          </div>
        )}

        {/* Botón Circular Principal con el Icono de Hamburguesa */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-14 h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-full shadow-2xl shadow-red-950/90 border-2 border-amber-400/70 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none"
          aria-label="Menú de opciones"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>
    </main>
  );
}
