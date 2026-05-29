// Server component — no state, pure CSS animation
const BRANDS = [
  { name: "Antminer",   sub: "Bitmain"  },
  { name: "Whatsminer", sub: "MicroBT"  },
  { name: "Avalon",     sub: "Canaan"   },
  { name: "Elphapex",   sub: ""         },
  { name: "Fluminer",   sub: ""         },
  { name: "Volcminer",  sub: ""         },
  { name: "Pinecone",   sub: ""         },
  { name: "Jasminer",   sub: ""         },
  { name: "Bombax",     sub: ""         },
];

// Duplicate for seamless infinite loop (animation translates -50%)
const ITEMS = [...BRANDS, ...BRANDS];

export default function BrandTicker() {
  return (
    <div className="w-full border-y border-[#2e2d2b] overflow-hidden bg-card/60 py-5 select-none">
      <div className="animate-brand-scroll flex w-max">
        {ITEMS.map((brand, i) => (
          <div
            key={i}
            className="flex items-center gap-0 shrink-0"
          >
            {/* Brand item */}
            <div className="w-[33vw] md:w-[380px] px-8 flex flex-col items-center justify-center gap-0.5">
              <span className="font-headline-md text-headline-md text-on-surface uppercase tracking-widest whitespace-nowrap">
                {brand.name}
              </span>
              {brand.sub && (
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">
                  {brand.sub}
                </span>
              )}
            </div>
            {/* Separator */}
            <span className="text-primary/40 text-[18px] shrink-0">◆</span>
          </div>
        ))}
      </div>
    </div>
  );
}
