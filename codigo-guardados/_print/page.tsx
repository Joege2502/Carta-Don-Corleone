"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import menuData from "../../app/data/menuData.json";
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
  | { type: "photo-item"; data: MenuItem }
  | {
      type: "section-block";
      data: {
        title: string;
        items: MenuItem[];
        banner?: { src: string; alt: string; objectPosition?: string };
      };
    }
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

const COLUMN_AVAILABLE_HEIGHT = 985;
const COLUMN_GAP = 2;
const MAX_PAGES = 6;
const COLUMNS_PER_PAGE = 2;

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
  for (let i = 0; i < columns.length; i += COLUMNS_PER_PAGE) {
    pages.push(columns.slice(i, i + COLUMNS_PER_PAGE));
  }
  return pages;
}

function packWithinPageLimit(
  elements: MenuElement[],
  heights: number[],
): PageLayout[] {
  let maxHeight = COLUMN_AVAILABLE_HEIGHT;
  let pages = buildPageLayouts(packMeasured(elements, heights, maxHeight));

  const absoluteMaxHeight = COLUMN_AVAILABLE_HEIGHT * 1.6;
  let guard = 0;

  while (
    pages.length > MAX_PAGES &&
    maxHeight < absoluteMaxHeight &&
    guard < 40
  ) {
    maxHeight = Math.min(absoluteMaxHeight, maxHeight + 60);
    pages = buildPageLayouts(packMeasured(elements, heights, maxHeight));
    guard += 1;
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

        if (sec.title === "Jugos Naturales") {
          elements.push({
            type: "section-block",
            data: {
              title: sec.title,
              items,
              banner: {
                src: "/jugos-decoracion-carta.webp",
                alt: "Jugos naturales Don Corleone",
                objectPosition: "center 50%",
              },
            },
          });
          return;
        }

        if (sec.title === "Adicionales") {
          elements.push({
            type: "section-block",
            data: { title: sec.title, items },
          });
          return;
        }

        elements.push({ type: "section-title", data: sec.title });

        if (PHOTO_TOP_SECTIONS.has(sec.title)) {
          items.forEach((item) => {
            elements.push({ type: "photo-item", data: item });
          });
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

    setPages(packWithinPageLimit(allElements, heights));
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
          size: A4 portrait;
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
          width: 210mm;
          height: 297mm;
          max-height: 297mm;
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
            width: "calc((210mm - 64px) / 2)",
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
                      className="h-8 w-auto drop-shadow-[0_2px_8px_rgba(255,107,0,0.3)]"
                    />
                    <span className="text-[12px] text-amber-400 font-bold tracking-widest uppercase border-l border-neutral-700 pl-3">
                      Carta Oficial • Edición Impresa (Pág. {pageIndex + 1} de{" "}
                      {pages.length})
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-semibold uppercase">
                    Pizzas Artesanales • Tacna
                  </p>
                </header>

                {/* Grilla Estricta de 2 Columnas (A4 Vertical) */}
                <div className="grid grid-cols-2 gap-3 w-full flex-1 items-start overflow-hidden px-1">
                  {[0, 1].map((colIndex) => {
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
                        {isLastPage && colIndex === 1 && (
                          <div className="mt-1 relative w-full flex-1 min-h-[140px] rounded-md overflow-hidden bg-[#0a0a0a] flex">
                            <img
                              src="/decoracion-platos-carta.webp"
                              alt="Don Corleone Decoración"
                              className="w-full h-full object-cover"
                              style={{
                                objectPosition: "center 40%",
                                filter:
                                  "contrast(1.05) saturate(1.08) brightness(1.04)",
                                maskImage:
                                  "radial-gradient(circle at center, black 52%, transparent 90%)",
                                WebkitMaskImage:
                                  "radial-gradient(circle at center, black 52%, transparent 90%)",
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pie de Página Fijo por Hoja */}
                <footer className="py-2.5 text-center text-[10px] font-semibold text-neutral-100 bg-neutral-900 border-t border-amber-800/50 flex-shrink-0 mt-1">
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
        <span className="text-[12px]">🍕</span>
        <h2 className="text-[12px] font-black tracking-widest text-white uppercase truncate">
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
            <span className="text-[12px]">🍕</span>
            <h2 className="text-[12px] font-black tracking-widest text-white uppercase truncate">
              {el.data.title}
            </h2>
          </div>

          <div className="w-full bg-neutral-900/90 backdrop-blur-sm border border-amber-700/40 rounded-md px-1.5 py-1 shadow">
            <div className="flex gap-2 items-stretch">
              <div className="relative w-32 h-40 rounded overflow-hidden border border-amber-500/30 shadow-sm flex-shrink-0 bg-neutral-950">
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
                    <span className="text-[11px] font-semibold text-white leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-black text-amber-400 whitespace-nowrap">
                      S/{item.price?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {calzone && (
              <div className="mt-1.5 pt-1.5 border-t border-amber-700/40 flex gap-2 items-center">
                <div className="relative w-28 h-28 rounded overflow-hidden border border-amber-500/30 shadow-sm flex-shrink-0 bg-neutral-950">
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
                    <span className="text-[11px] font-black text-white tracking-wide">
                      {calzone.name}
                    </span>
                    <span className="text-[11px] font-black text-amber-400 whitespace-nowrap">
                      S/{calzone.price?.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-300 leading-tight">
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
          <span className="text-[12px]">🍕</span>
          <h2 className="text-[12px] font-black tracking-widest text-white uppercase truncate">
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
        {el.data.banner && (
          <SectionBanner
            src={el.data.banner.src}
            alt={el.data.banner.alt}
            objectPosition={el.data.banner.objectPosition}
          />
        )}
      </div>
    );
  }

  if (el.type === "merged-section") {
    return (
      <div key={`merged-${index}`} className="w-full flex flex-col">
        <div className="flex items-center gap-2 bg-red-900 px-2 py-0.5 rounded-md border-l-4 border-amber-400 border-y border-r border-red-700/60 shadow my-0.5">
          <span className="text-[12px]">🍕</span>
          <h2 className="text-[12px] font-black tracking-widest text-white uppercase truncate">
            {el.data.title}
          </h2>
        </div>
        <div className="relative grid grid-cols-2 items-start gap-2">
          {el.data.groups.map((group) => (
            <div key={group.subtitle} className="flex flex-col min-w-0">
              <h3 className="text-[10.5px] font-black tracking-wider text-amber-300 uppercase border-b border-neutral-700 pb-1 mb-1">
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
              {el.data.title === "Aperitivos y Vinos" &&
                group.subtitle === "Aperitivos" && (
                  <div className="relative w-full h-[180px] mt-2 rounded-md overflow-hidden bg-[#0a0a0a]">
                    <img
                      src="/images/menu/mojito.webp"
                      alt="Mojito Don Corleone"
                      className="w-full h-full object-contain"
                      style={{
                        filter: "contrast(1.06) saturate(1.1) brightness(1.05)",
                        maskImage:
                          "radial-gradient(ellipse at center, black 60%, transparent 95%)",
                        WebkitMaskImage:
                          "radial-gradient(ellipse at center, black 60%, transparent 95%)",
                      }}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "/decoracion-platos-carta.webp";
                      }}
                    />
                  </div>
                )}
            </div>
          ))}
        </div>

        {el.data.title === "Bebidas e Infusiones" && (
          <SectionBanner
            src="/sello-don-corleone-transparente.svg"
            alt="Bebidas e infusiones Don Corleone"
            objectPosition="center 50%"
            fallback="/logo.svg"
            heightClass="h-[150px]"
            contain
          />
        )}
      </div>
    );
  }

  if (el.type === "photo-item") {
    return renderPhotoCard(el.data);
  }

  const item = el.data as MenuItem;
  return (
    <div
      key={item.id}
      className="w-full bg-neutral-900/90 backdrop-blur-sm border border-amber-700/40 rounded-md px-1.5 py-1 shadow flex flex-col justify-between gap-0.5"
    >
      <div className="flex gap-1.5 items-center w-full">
        {!el.hideImage && (
          <div className="relative w-9 h-9 rounded overflow-hidden border border-amber-500/30 shadow-sm flex-shrink-0 bg-neutral-950">
            <img
              src={item.image || "/images/menu/al-tono.jpg"}
              alt={item.name}
              className="w-full h-full object-cover"
              style={{
                filter: "contrast(1.06) saturate(1.12) brightness(1.05)",
              }}
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
              className={`text-[11px] font-black text-white tracking-wide ${
                wrapName ? "leading-tight" : "truncate"
              }`}
            >
              {item.name}
            </h3>
            {item.price !== undefined && item.price !== null && (
              <span className="font-black text-amber-400 text-[11px] whitespace-nowrap">
                S/{item.price.toFixed(2)}
              </span>
            )}
            {item.price === null && (
              <span className="font-semibold text-amber-300 text-[10px] uppercase italic whitespace-nowrap">
                Próximamente
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-[10px] text-neutral-300 line-clamp-2 leading-tight">
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
                {size !== "copa" && (
                  <span className="text-[10px] text-neutral-300 font-semibold leading-tight">
                    {label}
                  </span>
                )}
                <span className="font-black text-amber-400 text-[11px] whitespace-nowrap">
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

function renderPhotoCard(item: MenuItem) {
  const priceEntries = item.prices
    ? Object.entries(item.prices).filter(([, val]) => val !== undefined)
    : [];

  return (
    <div
      key={item.id}
      className="w-full flex flex-col overflow-hidden rounded-md border border-amber-700/40 bg-neutral-900/90 shadow"
    >
      <div className="flex items-center gap-2 bg-gradient-to-r from-red-800 to-red-900 border-l-4 border-amber-400 px-2 py-1">
        <span className="text-[12px] leading-none">🍕</span>
        <h3 className="text-[13px] font-black text-white uppercase tracking-wide leading-tight shrink-0">
          {item.name}
        </h3>
        {item.description && (
          <p className="flex-1 min-w-0 text-[10px] text-neutral-200 leading-tight line-clamp-2">
            {item.description}
          </p>
        )}
      </div>

      <div className="flex gap-2 p-1.5">
        <div className="relative w-32 h-28 rounded overflow-hidden border border-amber-500/30 shadow-sm flex-shrink-0 bg-neutral-950">
          <img
            src={item.image || "/images/menu/al-tono.jpg"}
            alt={item.name}
            className="w-full h-full object-cover"
            style={{
              filter: "contrast(1.06) saturate(1.12) brightness(1.05)",
            }}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/images/menu/al-tono.jpg";
            }}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {priceEntries.length > 0 ? (
            <div className="flex flex-col divide-y divide-neutral-800">
              {priceEntries.map(([size, val]) => (
                <div key={size} className="flex items-center gap-1 py-0.5">
                  <span className="text-[10.5px] font-bold text-neutral-300 uppercase tracking-wide">
                    {SIZE_LABELS[size] ?? size}
                  </span>
                  <span className="flex-1 border-b border-dotted border-neutral-700 mx-1" />
                  <span className="text-[11px] font-black text-amber-400 whitespace-nowrap">
                    S/{val!.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : item.price !== undefined && item.price !== null ? (
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] font-bold text-neutral-300 uppercase tracking-wide">
                Precio
              </span>
              <span className="flex-1 border-b border-dotted border-neutral-700 mx-1" />
              <span className="text-[11px] font-black text-amber-400 whitespace-nowrap">
                S/{item.price.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-semibold text-amber-300 uppercase italic">
              Próximamente
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionBanner({
  src,
  alt,
  objectPosition = "center 50%",
  fallback = "/decoracion-platos-carta.webp",
  contain = false,
  heightClass = "h-[95px]",
  children,
}: {
  src: string;
  alt: string;
  objectPosition?: string;
  fallback?: string;
  contain?: boolean;
  heightClass?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative w-full ${heightClass} mt-1.5 rounded-md overflow-hidden bg-[#0a0a0a]`}
      style={
        contain
          ? {
              background:
                "radial-gradient(ellipse at center, rgba(120,53,15,0.28), #0a0a0a 72%)",
            }
          : undefined
      }
    >
      <img
        src={src}
        alt={alt}
        className={`w-full h-full ${contain ? "object-contain p-1.5" : "object-cover"}`}
        style={{
          objectPosition,
          filter: contain
            ? "drop-shadow(0 2px 12px rgba(0,0,0,0.85))"
            : "contrast(1.06) saturate(1.1) brightness(1.05)",
          maskImage:
            "radial-gradient(ellipse at center, black 55%, transparent 92%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 55%, transparent 92%)",
        }}
        onError={(event) => {
          if (event.currentTarget.src.endsWith(fallback)) return;
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallback;
        }}
      />
      {children}
    </div>
  );
}
