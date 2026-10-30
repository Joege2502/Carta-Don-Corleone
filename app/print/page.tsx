"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import menuData from "../data/menuData.json";
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
}

type MergedSection = {
  title: string;
  groups: { subtitle: string; items: MenuItem[] }[];
};

type MenuElement =
  | { type: "section-title"; data: string }
  | { type: "item"; data: MenuItem; hideImage: boolean }
  | { type: "dish-row"; data: MenuItem[]; section: string }
  | { type: "section-block"; data: { title: string; items: MenuItem[] } }
  | { type: "merged-section"; data: MergedSection };

// Secciones que se imprimen sin foto, como una lista (nombre + precio).
const NO_IMAGE_SECTIONS = new Set([
  "Bebidas",
  "Infusiones",
  "Aperitivos",
  "Vinos",
  "Jugos Naturales",
  "Adicionales",
]);

const MERGED_SECTIONS: Record<string, { title: string; sections: string[] }> = {
  Bebidas: {
    title: "Bebidas e Infusiones",
    sections: ["Bebidas", "Infusiones"],
  },
  Aperitivos: {
    title: "Aperitivos y Vinos",
    sections: ["Aperitivos", "Vinos"],
  },
};

const MERGED_BLOCK_ORDER = ["Aperitivos", "Bebidas"];

const SIZE_LABELS: Record<string, string> = {
  personal: "Personal",
  mediana: "Mediana",
  familiar: "Familiar",
  gigante: "Gigante",
  "1/2 jarra": "1/2 Jarra",
  jarra: "Jarra",
  copa: "Copa",
};

const PHOTO_TOP_SECTIONS = new Set([
  "Pastas",
  "Pizzas de la Casa",
  "Pizzas Clásicas",
  "Pizzas Especiales",
  "Salchipapas",
]);

const NO_DESCRIPTION_ITEMS = new Set([
  "lasagna-bolognesa",
  "espaguetti-pesto-pollo",
  "espaguetti-pesto-bisteck",
]);

const SECTION_ITEM_ORDER: Record<string, string[]> = {
  Bebidas: [
    "agua-mineral",
    "gaseosa-personal",
    "gaseosa-medio-litro",
    "gaseosa-1lt",
    "gaseosa-pepsi-1lt",
    "gaseosa-1-5lt",
    "chicha-morada",
    "limonada",
    "maracuya",
    "inca-kola-gordita",
  ],
};

const COLUMN_AVAILABLE_HEIGHT = 680;
const COLUMN_GAP = 2;

const SECTION_GAP_IMAGE: Record<string, FillerKind> = {
  Pastas: "stamp",
  "Pizzas Clásicas": "logo",
  Salchipapas: "logo",
};

type FillerKind = "logo" | "stamp";

type PackedItem = { el: MenuElement; height: number };
type ColumnLayout = {
  items: PackedItem[];
  height: number;
};
type PageLayout = ColumnLayout[];

function packMeasured(
  elements: MenuElement[],
  heights: number[],
  maxHeight: number,
): ColumnLayout[] {
  const columns: ColumnLayout[] = [];
  let current: PackedItem[] = [];

  const sumHeight = (items: PackedItem[]) =>
    items.reduce(
      (total, item, index) =>
        total + item.height + (index > 0 ? COLUMN_GAP : 0),
      0,
    );

  const pushColumn = (items: PackedItem[]) => {
    if (items.length === 0) return;
    columns.push({ items, height: sumHeight(items) });
  };

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const height = heights[i] ?? 0;
    const extra = current.length > 0 ? COLUMN_GAP : 0;

    if (current.length > 0 && sumHeight(current) + extra + height > maxHeight) {
      const last = current[current.length - 1];

      if (last.el.type === "section-title") {
        current.pop();
        pushColumn(current);
        current = [last];
      } else {
        pushColumn(current);
        current = [];
      }
    }

    current.push({ el, height });
  }

  pushColumn(current);
  return columns;
}

function buildPageLayouts(columns: ColumnLayout[]): PageLayout[] {
  const pages: PageLayout[] = [];
  for (let i = 0; i < columns.length; i += 3) {
    pages.push(columns.slice(i, i + 3));
  }
  return pages;
}

function orderSectionItems<T extends { id: string }>(
  title: string,
  items: T[],
): T[] {
  const order = SECTION_ITEM_ORDER[title];
  if (!order) return items;

  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((item): item is T => Boolean(item));
  const remaining = items.filter((item) => !order.includes(item.id));

  return [...ordered, ...remaining];
}

export default function PrintMenuPage() {
  const [pages, setPages] = useState<PageLayout[] | null>(null);
  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const didPrint = useRef(false);

  const allElements = useMemo<MenuElement[]>(() => {
    const elements: MenuElement[] = [];

    type RawSection = { title: string; items: MenuItem[] };
    const sectionsByTitle = new Map<string, RawSection>();
    (menuData.categories as { sections: RawSection[] }[]).forEach((cat) => {
      cat.sections.forEach((sec) => sectionsByTitle.set(sec.title, sec));
    });

    const mergedMembers = new Set(
      Object.values(MERGED_SECTIONS).flatMap((config) => config.sections),
    );
    let mergedEmitted = false;

    menuData.categories.forEach((cat) => {
      cat.sections.forEach((sec) => {
        if (mergedMembers.has(sec.title)) {
          if (!mergedEmitted) {
            mergedEmitted = true;
            MERGED_BLOCK_ORDER.forEach((trigger) => {
              const mergeConfig = MERGED_SECTIONS[trigger];
              const groups = mergeConfig.sections
                .map((sectionTitle) => {
                  const source = sectionsByTitle.get(sectionTitle);
                  if (!source) return null;
                  return {
                    subtitle: sectionTitle,
                    items: orderSectionItems(sectionTitle, source.items),
                  };
                })
                .filter(
                  (group): group is { subtitle: string; items: MenuItem[] } =>
                    Boolean(group),
                );

              elements.push({
                type: "merged-section",
                data: { title: mergeConfig.title, groups },
              });
            });
          }
          return;
        }

        const hideImage = NO_IMAGE_SECTIONS.has(sec.title);
        const items = orderSectionItems(sec.title, sec.items as MenuItem[]);

        if (sec.title === "Entradas") {
          elements.push({
            type: "section-block",
            data: { title: sec.title, items },
          });
          return;
        }

        elements.push({ type: "section-title", data: sec.title });

        if (PHOTO_TOP_SECTIONS.has(sec.title)) {
          for (let i = 0; i < items.length; i += 2) {
            elements.push({
              type: "dish-row",
              data: items.slice(i, i + 2),
              section: sec.title,
            });
          }
          return;
        }

        items.forEach((item) => {
          elements.push({
            type: "item",
            data: item,
            hideImage,
          });
        });
      });
    });

    return elements;
  }, []);

  useLayoutEffect(() => {
    if (pages) return;

    const heights = allElements.map((el, index) => {
      const node = measureRefs.current[index];
      if (!node) return 0;
      return (
        node.getBoundingClientRect().height +
        (el.type === "section-title" ? 4 : 0)
      );
    });

    setPages(
      buildPageLayouts(
        packMeasured(allElements, heights, COLUMN_AVAILABLE_HEIGHT),
      ),
    );
  }, [allElements, pages]);

  useEffect(() => {
    if (!pages) return;

    const timer = setTimeout(() => {
      if (didPrint.current) return;
      didPrint.current = true;
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, [pages]);

  return (
    <>
      <style>{`
        @page {
          size: A4 landscape;
          margin: 0;
        }
        @media print {
          body {
            background-color: #050505 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0;
          }
          .a4-sheet {
            break-after: page;
            page-break-after: always;
            margin: 0 !important;
            box-shadow: none !important;
            background-image: none !important;
            background-color: #0a0a0a !important;
          }
        }
        .a4-sheet {
          width: 297mm;
          height: 210mm;
          max-height: 210mm;
          box-sizing: border-box;
          overflow: hidden;
          background-color: #0a0a0a;
          background-image: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
      `}</style>

      {pages === null ? (
        <div
          aria-hidden="true"
          className="font-sans"
          style={{
            position: "absolute",
            left: "-10000px",
            top: 0,
            width: "calc((297mm - 64px) / 3)",
          }}
        >
          {allElements.map((el, index) => (
            <div
              key={index}
              ref={(node) => {
                measureRefs.current[index] = node;
              }}
            >
              {renderMenuElement(el, index)}
            </div>
          ))}
        </div>
      ) : (
        <main className="w-full bg-[#050505] text-white font-sans flex flex-col items-center gap-4 print:gap-0">
          {pages.map((pageColumns, pageIndex) => {
            const isLastPage = pageIndex === pages.length - 1;

            return (
              <div
                key={pageIndex}
                className="a4-sheet relative p-4 shadow-2xl my-2 print:my-0 border border-neutral-800"
              >
                {/* Cabecera Fija por Hoja */}
                <header className="flex justify-between items-center bg-neutral-900/90 backdrop-blur-md border border-amber-800/60 px-4 py-2.5 rounded-lg shadow-md flex-shrink-0 mb-2">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/logo.svg"
                      alt="Logo Don Corleone"
                      width={120}
                      height={32}
                      priority
                      className="h-7 w-auto drop-shadow-[0_2px_8px_rgba(255,107,0,0.3)]"
                    />
                    <span className="text-[11px] text-amber-400 font-bold tracking-widest uppercase border-l border-neutral-700 pl-3">
                      Carta Oficial • Edición Impresa (Pág. {pageIndex + 1} de{" "}
                      {pages.length})
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-semibold uppercase">
                    Pizzas Artesanales • Tacna
                  </p>
                </header>

                {/* Grilla Estricta de 3 Columnas */}
                <div className="grid grid-cols-3 gap-3 w-full flex-1 items-start overflow-hidden px-1">
                  {[0, 1, 2].map((colIndex) => {
                    const column = pageColumns[colIndex];

                    if (!column) {
                      return <div key={colIndex} className="flex flex-col" />;
                    }

                    return (
                      <div
                        key={colIndex}
                        className="flex flex-col gap-[2px] h-full"
                      >
                        {column.items.map((item, idx) =>
                          renderMenuElement(item.el, idx),
                        )}
                        {/* Imagen decorativa final sin borde naranja y con desvanecimiento limpio */}
                        {isLastPage && colIndex === 2 && (
                          <div className="mt-1 relative w-full flex-1 rounded-md overflow-hidden bg-[#0a0a0a] flex">
                            <img
                              src="/decoracion-platos-carta.webp"
                              alt="Don Corleone Decoración"
                              className="w-full h-full object-cover"
                              style={{
                                objectPosition: "center 40%",
                                maskImage:
                                  "radial-gradient(circle at center, black 50%, transparent 88%)",
                                WebkitMaskImage:
                                  "radial-gradient(circle at center, black 50%, transparent 88%)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pie de Página Fijo por Hoja */}
                <footer className="py-2.5 text-center text-[9px] font-semibold text-neutral-100 bg-neutral-900 border-t border-amber-800/50 flex-shrink-0 mt-1">
                  <p>
                    Don Corleone Tacna • Siente la Diferencia • Carta de
                    Especialidades
                  </p>
                </footer>
              </div>
            );
          })}
        </main>
      )}
    </>
  );
}

function renderMenuElement(el: MenuElement, index: number, wrapName = false) {
  if (el.type === "section-title") {
    return (
      <div
        key={`sec-${index}`}
        className="flex items-center gap-2 bg-red-900 px-2 py-0.5 rounded-md border-l-4 border-amber-400 border-y border-r border-red-700/60 shadow my-0.5"
      >
        <span className="text-[9px]">🍕</span>
        <h2 className="text-[8.5px] font-black tracking-widest text-white uppercase truncate">
          {el.data}
        </h2>
      </div>
    );
  }

  if (el.type === "section-block") {
    if (el.data.title === "Entradas") {
      const panes = el.data.items.filter((item) => item.id !== "calzone");
      const calzone = el.data.items.find((item) => item.id === "calzone");

      return (
        <div key={`block-${index}`} className="w-full flex flex-col">
          <div className="flex items-center gap-2 bg-red-900 px-2 py-0.5 rounded-md border-l-4 border-amber-400 border-y border-r border-red-700/60 shadow my-0.5">
            <span className="text-[9px]">🍕</span>
            <h2 className="text-[8.5px] font-black tracking-widest text-white uppercase truncate">
              {el.data.title}
            </h2>
          </div>

          <div className="w-full bg-neutral-900/90 backdrop-blur-sm border border-amber-700/40 rounded-md px-1.5 py-1 shadow">
            <div className="flex gap-2 items-stretch">
              <div className="relative w-28 h-32 rounded overflow-hidden border border-amber-500/30 shadow-sm flex-shrink-0 bg-neutral-950">
                <img
                  src="/images/menu/pan-ajo-especial.webp"
                  alt="Pan al Ajo"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 grid grid-rows-5 py-0.5 divide-y divide-neutral-800">
                {panes.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center gap-1"
                  >
                    <span className="text-[8.5px] font-semibold text-white leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-black text-amber-400 whitespace-nowrap">
                      S/{item.price?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {calzone && (
              <div className="mt-1.5 pt-1.5 border-t border-amber-700/40 flex gap-2 items-center">
                <div className="relative w-12 h-12 rounded overflow-hidden border border-amber-500/30 shadow-sm flex-shrink-0 bg-neutral-950">
                  <img
                    src={calzone.image || "/images/menu/al-tono.jpg"}
                    alt="Calzone"
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/images/menu/al-tono.jpg";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-1">
                    <span className="text-[9px] font-black text-white tracking-wide">
                      {calzone.name}
                    </span>
                    <span className="text-[9px] font-black text-amber-400 whitespace-nowrap">
                      S/{calzone.price?.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[7.5px] text-neutral-300 leading-tight">
                    {calzone.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={`block-${index}`} className="w-full flex flex-col">
        <div className="flex items-center gap-2 bg-red-900 px-2 py-0.5 rounded-md border-l-4 border-amber-400 border-y border-r border-red-700/60 shadow my-0.5">
          <span className="text-[9px]">🍕</span>
          <h2 className="text-[8.5px] font-black tracking-widest text-white uppercase truncate">
            {el.data.title}
          </h2>
        </div>
        <div className="flex flex-col">
          {el.data.items.map((item, idx) =>
            renderMenuElement(
              { type: "item", data: item, hideImage: true },
              idx,
              true,
            ),
          )}
        </div>
      </div>
    );
  }

  if (el.type === "merged-section") {
    return (
      <div key={`merged-${index}`} className="w-full flex flex-col">
        <div className="flex items-center gap-2 bg-red-900 px-2 py-0.5 rounded-md border-l-4 border-amber-400 border-y border-r border-red-700/60 shadow my-0.5">
          <span className="text-[9px]">🍕</span>
          <h2 className="text-[8.5px] font-black tracking-widest text-white uppercase truncate">
            {el.data.title}
          </h2>
        </div>
        <div className="relative grid grid-cols-2 gap-2">
          {el.data.groups.map((group) => (
            <div key={group.subtitle} className="flex flex-col min-w-0">
              <h3 className="text-[8px] font-black tracking-wider text-amber-300 uppercase border-b border-neutral-700 pb-1 mb-1">
                {group.subtitle}
              </h3>
              <div className="flex flex-col">
                {group.items.map((item, idx) =>
                  renderMenuElement(
                    { type: "item", data: item, hideImage: true },
                    idx,
                    true,
                  ),
                )}
              </div>
            </div>
          ))}
          {el.data.title === "Aperitivos y Vinos" && (
            <div className="pointer-events-none absolute bottom-0 left-0 w-1/2 flex items-end justify-center">
              <img
                src="/sello-don-corleone-transparente.svg"
                alt="Sello Don Corleone"
                className="w-[90%] max-h-[120px] object-contain opacity-85 -rotate-12"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (el.type === "dish-row") {
    const gapKind =
      el.data.length % 2 === 1 ? SECTION_GAP_IMAGE[el.section] : undefined;
    return (
      <div key={`row-${index}`} className="grid grid-cols-2 gap-2 w-full">
        {el.data.map((item) => renderPhotoCard(item, el.section))}
        {gapKind && (
          <div className="relative w-full h-full min-h-0 overflow-hidden flex items-center justify-center p-2">
            <img
              src={
                gapKind === "logo"
                  ? "/logo.svg"
                  : "/sello-don-corleone-transparente.svg"
              }
              alt={
                gapKind === "logo" ? "Logo Don Corleone" : "Sello Don Corleone"
              }
              className="max-h-full max-w-full object-contain opacity-90"
            />
          </div>
        )}
      </div>
    );
  }

  const item = el.data as MenuItem;
  return (
    <div
      key={item.id}
      className="w-full bg-neutral-900/90 backdrop-blur-sm border border-amber-700/40 rounded-md px-1 py-0.5 shadow flex flex-col justify-between gap-0.5"
    >
      <div className="flex gap-1.5 items-center w-full">
        {!el.hideImage && (
          <div className="relative w-7 h-7 rounded overflow-hidden border border-amber-500/30 shadow-sm flex-shrink-0 bg-neutral-950">
            <img
              src={item.image || "/images/menu/al-tono.jpg"}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/images/menu/al-tono.jpg";
              }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-1">
            <h3
              className={`text-[9.5px] font-black text-white tracking-wide ${
                wrapName ? "leading-tight" : "truncate"
              }`}
            >
              {item.name}
            </h3>
            {item.price !== undefined && item.price !== null && (
              <span className="font-black text-amber-400 text-[9.5px] whitespace-nowrap">
                S/{item.price.toFixed(2)}
              </span>
            )}
            {item.price === null && (
              <span className="font-semibold text-amber-300 text-[7px] uppercase italic whitespace-nowrap">
                Próximamente
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-[8.5px] text-neutral-300 line-clamp-2 leading-tight">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {item.prices && (
        <div className="grid grid-flow-col auto-cols-fr gap-1 w-full pt-1 border-t border-neutral-800">
          {Object.entries(item.prices).map(([size, val]) => {
            if (val === undefined) return null;
            const label = SIZE_LABELS[size] ?? size;
            return (
              <div
                key={size}
                className={`flex gap-1 bg-neutral-950 px-1 py-0.2 rounded border border-neutral-800 ${
                  wrapName
                    ? "flex-col items-start"
                    : "justify-between items-center"
                }`}
              >
                <span className="text-[7px] text-neutral-300 font-semibold leading-tight">
                  {label}
                </span>
                <span className="font-black text-amber-400 text-[9px] whitespace-nowrap">
                  S/{val.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderPhotoCard(item: MenuItem, sectionTitle?: string) {
  const isPastas = sectionTitle === "Pastas";
  const hideDescription =
    isPastas || !item.description || NO_DESCRIPTION_ITEMS.has(item.id);
  const priceEntries = item.prices
    ? Object.entries(item.prices).filter(([, val]) => val !== undefined)
    : [];

  return (
    <div
      key={item.id}
      className="w-full flex flex-col overflow-hidden rounded-md border border-amber-700/40 bg-neutral-900/90 shadow"
    >
      <div
        className={`relative w-full ${
          isPastas ? "h-16" : "h-22"
        } bg-neutral-950 flex-shrink-0`}
      >
        <img
          src={item.image || "/images/menu/al-tono.jpg"}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/images/menu/al-tono.jpg";
          }}
        />

        {priceEntries.length > 0 && (
          <div
            className={`absolute bottom-0 left-0 right-0 grid ${
              priceEntries.length >= 4
                ? "grid-cols-4"
                : priceEntries.length === 3
                  ? "grid-cols-3"
                  : priceEntries.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-1"
            } bg-black/85 backdrop-blur-sm`}
          >
            {priceEntries.map(([size, val]) => (
              <div
                key={size}
                className="flex flex-col items-center px-0.5 py-0.5 border-r border-white/10 last:border-r-0"
              >
                <span className="text-[7px] text-neutral-300 font-semibold leading-none">
                  {SIZE_LABELS[size] ?? size}
                </span>
                <span className="font-black text-amber-400 text-[9px] whitespace-nowrap leading-none">
                  S/{val!.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {priceEntries.length === 0 &&
          item.price !== undefined &&
          item.price !== null && (
            <div className="absolute bottom-0 right-0 bg-black/85 backdrop-blur-sm px-1 py-0.5">
              <span className="font-black text-amber-400 text-[9px] whitespace-nowrap leading-none">
                S/{item.price.toFixed(2)}
              </span>
            </div>
          )}
      </div>

      <div className={isPastas ? "px-1.5 py-1" : "px-1.5 py-0.5"}>
        <h3
          className={`${
            isPastas ? "text-[9.5px]" : "text-[8px]"
          } font-black text-white tracking-wide leading-tight`}
        >
          {item.name}
        </h3>
        {!hideDescription && (
          <p className="text-[8.5px] text-neutral-300 leading-tight mt-0.5">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
