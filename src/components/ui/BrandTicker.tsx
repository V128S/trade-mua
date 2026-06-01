// Server component — no state, pure CSS animation
// `split`: [white part, gold part] — two-tone like the "TradeM" logo.
// The *-miner brands split before "miner"; the rest split where the user asked.
const BRANDS = [
  { split: ["Ant", "miner"]   as const, sub: "Bitmain"        },
  { split: ["Whats", "miner"] as const, sub: "MicroBT"        },
  { split: ["Ava", "lon"]     as const, sub: "Canaan"         },
  { split: ["Elpha", "pex"]   as const, sub: "FoundationLogic"},
  { split: ["Flu", "miner"]   as const, sub: "Fulu Technology"},
  { split: ["Volc", "miner"]  as const, sub: "VolcMiner Tech" },
  { split: ["Pine", "cone"]   as const, sub: "INIBOX"         },
  { split: ["Jas", "miner"]   as const, sub: "Jasminer Inc."  },
  { split: ["Bom", "bax"]     as const, sub: "Bombax Mining"  },
];

// Duplicate for seamless infinite loop (animation translates -50%)
const ITEMS = [...BRANDS, ...BRANDS];

export default function BrandTicker() {
  return (
    <div className="glass w-full overflow-hidden py-5 select-none !rounded-2xl">
      <div className="animate-brand-scroll flex w-max">
        {ITEMS.map((brand, i) => (
          <div
            key={i}
            className="flex items-center gap-0 shrink-0"
          >
            {/* Brand item */}
            <div className="w-[52vw] md:w-[380px] px-5 md:px-8 flex flex-col items-center justify-center gap-0.5">
              <span className="font-headline-md text-headline-md uppercase tracking-widest whitespace-nowrap">
                <span className="text-on-surface">{brand.split[0]}</span>
                <span className="text-primary">{brand.split[1]}</span>
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
