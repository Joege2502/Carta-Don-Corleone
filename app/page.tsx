"use client";

import { useState } from "react";
import menuData from "./data/menuData.json";
import Image from "next/image";

interface PizzaPrices {
  personal?: number;
  mediana?: number;
  familiar?: number;
  gigante?: number;
  [key: string]: number | undefined;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  image?: string;
  price?: number | null;
  prices?: PizzaPrices;
  promo?: boolean;
}

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState(
    menuData.categories[0].id,
  );

  // Subcategoría activa para "Pizzas" ("all" muestra todas)
  const [activePizzaSubcategory, setActivePizzaSubcategory] = useState("all");

  // Estados para la pantalla de portada (Splash Screen)
  const [showCover, setShowCover] = useState(true);
  const [isFading, setIsFading] = useState(false);

  const selectedCategoryData = menuData.categories.find(
    (cat) => cat.id === activeCategory,
  );

  const isPizzas = activeCategory === "pizzas";

  const visibleSections =
    isPizzas && activePizzaSubcategory !== "all"
      ? (selectedCategoryData?.sections ?? []).filter(
          (section) => section.title === activePizzaSubcategory,
        )
      : (selectedCategoryData?.sections ?? []);

  const handleEnterMenu = () => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => setShowCover(false), 700);
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    if (categoryId === "pizzas") setActivePizzaSubcategory("all");
  };

  const handlePizzaSubcategoryChange = (subcategory: string) => {
    setActivePizzaSubcategory(subcategory);
    requestAnimationFrame(() => {
      if (subcategory === "all") {
        document
          .getElementById("menu-content")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      document
        .getElementById(`section-${subcategory}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const getPizzaTabLabel = (title: string) =>
    title.replace(/^Pizzas\s+/i, "");

  return (
    <>
      {/* Pantalla de Portada (Splash Screen) */}
      {showCover && (
        <div
          onClick={handleEnterMenu}
          className={`fixed inset-0 z-[60] bg-gradient-to-b from-zinc-950 via-neutral-900 to-black flex flex-col items-center justify-center px-8 text-center cursor-pointer transition-opacity duration-700 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Brillo radial cálido central */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(217,119,6,0.22),transparent_60%)]" />
          {/* Resplandor rojizo inferior para dar profundidad */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(127,29,29,0.28),transparent_55%)]" />
          {/* Textura sutil superpuesta */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:18px_18px]" />

          <div className="relative z-10 flex flex-col items-center">
            <Image
              src="/logo.svg"
              alt="Logo Don Corleone"
              width={220}
              height={70}
              priority
              className="h-20 w-auto drop-shadow-[0_2px_20px_rgba(255,107,0,0.45)]"
            />

            <p className="mt-6 text-sm text-neutral-300 leading-relaxed max-w-xs">
              Pizzería artesanal en el corazón de Tacna. Masa madre,
              ingredientes frescos y el auténtico sabor italiano hecho a mano.
            </p>

            <a
              href="https://wa.me/51945782072?text=Hola,%20deseo%20hacer%20un%20pedido"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-green-900/50 border border-amber-400/40 transition-all hover:scale-105 active:scale-95"
            >
              <span>💬</span>
              <span>Pedidos por WhatsApp</span>
            </a>
          </div>

          <p className="absolute bottom-6 left-0 right-0 px-8 text-center text-sm md:text-base text-zinc-200 tracking-wide leading-relaxed drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] animate-pulse">
            Toca en cualquier parte para ingresar a la carta
          </p>
        </div>
      )}

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
                  onClick={() => handleCategoryChange(category.id)}
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

          {/* Sub-pestañas exclusivas para Pizzas */}
          {isPizzas && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 no-scrollbar w-full">
              <button
                onClick={() => handlePizzaSubcategoryChange("all")}
                aria-pressed={activePizzaSubcategory === "all"}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  activePizzaSubcategory === "all"
                    ? "bg-red-900/60 border border-red-500/60 text-white font-semibold"
                    : "bg-zinc-900/90 border border-zinc-800 text-zinc-400"
                }`}
              >
                Todas
              </button>
              {selectedCategoryData?.sections.map((section) => {
                const isSubActive =
                  section.title === activePizzaSubcategory;
                return (
                  <button
                    key={section.title}
                    onClick={() =>
                      handlePizzaSubcategoryChange(section.title)
                    }
                    aria-pressed={isSubActive}
                    className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                      isSubActive
                        ? "bg-red-900/60 border border-red-500/60 text-white font-semibold"
                        : "bg-zinc-900/90 border border-zinc-800 text-zinc-400"
                    }`}
                  >
                    {getPizzaTabLabel(section.title)}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* Contenido Principal */}
        <div
          id="menu-content"
          className="p-4 space-y-6 pb-24 flex-1 w-full relative z-10 scroll-mt-56"
        >
          {visibleSections.map((section) => (
            <section
              key={section.title}
              id={`section-${section.title}`}
              className="space-y-4 w-full scroll-mt-56"
            >
              {/* Banner de Título estilo Pizzería Artesanal */}
              <div className="flex items-center gap-2.5 bg-gradient-to-r from-red-900 via-red-800 to-neutral-900 px-3.5 py-2.5 rounded-xl border-l-4 border-amber-400 border-y border-r border-red-700/60 shadow-xl">
                <span className="text-base">🍕</span>
                <h2 className="text-xs font-black tracking-widest text-white uppercase drop-shadow">
                  {section.title}
                </h2>
              </div>

              {/* Lista limpia para Adicionales y Bebidas/Infusiones */}
              {section.title === "Adicionales" ||
              activeCategory === "bebidas-infusiones" ? (
                <div className="w-full bg-zinc-950/80 backdrop-blur-sm border border-amber-900/40 rounded-2xl shadow-xl overflow-hidden divide-y divide-neutral-800/70">
                  {(section.items as MenuItem[]).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-900/60 transition-colors"
                    >
                      <span className="text-sm font-semibold text-neutral-100 tracking-wide">
                        {item.name}
                      </span>
                      <span className="text-sm font-black text-amber-400 whitespace-nowrap">
                        {item.price !== null && item.price !== undefined
                          ? `S/${item.price.toFixed(2)}`
                          : "Próximamente"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Listado de Tarjetas */
                <div className="space-y-4 w-full">
                  {(section.items as MenuItem[]).map((item) =>
                    item.promo ? (
                      <div
                        key={item.id}
                        className="relative w-full border border-amber-500/40 bg-zinc-900/90 rounded-2xl shadow-xl overflow-hidden hover:border-amber-400/60 transition-all"
                      >
                        <span className="absolute top-0 right-0 z-20 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl border-l border-b border-amber-500/40 shadow-md">
                          ¡PROMOCIÓN!
                        </span>

                        {/* Imagen superior de las dos pizzas (sin gaseosa) */}
                        <div className="relative w-full aspect-[16/10] overflow-hidden bg-neutral-900">
                          <img
                            src={item.image || "/images/menu/don-corleone.webp"}
                            alt={item.name}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                "/images/menu/don-corleone.webp";
                            }}
                            className="w-full h-full object-cover"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
                        </div>

                        {/* Título, descripción y precio debajo de la imagen */}
                        <div className="p-4">
                          <h3 className="text-base font-black text-white tracking-wide pr-20">
                            {item.name}
                          </h3>
                          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="mt-3 flex justify-end">
                            <span className="text-amber-400 font-bold text-lg">
                              {item.price !== null && item.price !== undefined
                                ? `S/ ${item.price.toFixed(2)}`
                                : "Próximamente"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
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
                            <div className="space-y-1 w-full">
                              {Object.entries(item.prices).map(
                                ([size, val]) => {
                                  if (val === undefined) return null;
                                  const formattedSize =
                                    size.charAt(0).toUpperCase() +
                                    size.slice(1);
                                  return (
                                    <div
                                      key={size}
                                      className="flex justify-between items-center text-xs w-full bg-neutral-950/60 px-2 py-1 rounded-lg border border-neutral-800"
                                    >
                                      <span className="text-neutral-400 font-semibold capitalize">
                                        {formattedSize}
                                      </span>
                                      <span className="font-black text-amber-400 text-xs">
                                        S/{val.toFixed(2)}
                                      </span>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-between items-center px-3 py-2 bg-gradient-to-r from-red-950/60 to-neutral-900 rounded-xl border border-red-900/40 w-full">
                              <span className="text-neutral-300 text-xs font-bold uppercase tracking-wider">
                                Precio
                              </span>
                              <span className="font-black text-amber-400 text-base">
                                {item.price !== null &&
                                item.price !== undefined ? (
                                  `S/${item.price.toFixed(2)}`
                                ) : (
                                  <span className="text-xs text-amber-300 italic uppercase">
                                    Próximamente
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Botón Flotante de WhatsApp (Abajo a la derecha) */}
        <a
          href="https://wa.me/51945782072?text=Hola,%20deseo%20hacer%20un%20pedido"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pedir por WhatsApp"
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-2xl shadow-green-950/70 border-2 border-green-400/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-green-500/40"
        >
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </main>
    </>
  );
}
