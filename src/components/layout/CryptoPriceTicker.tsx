// Server component — static crypto prices bar with direction animations
const COINS = [
  { id: "bitcoin",      symbol: "BTC"  },
  { id: "litecoin",     symbol: "LTC"  },
  { id: "kaspa",        symbol: "KAS"  },
  { id: "dogecoin",     symbol: "DOGE" },
  { id: "bitcoin-cash", symbol: "BCH"  },
  { id: "dash",         symbol: "DASH" },
  { id: "alephium",     symbol: "ALPH" },
  { id: "ergo",         symbol: "ERG"  },
];

function formatPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString("en", { maximumFractionDigits: 0 });
  if (price >= 1)     return price.toFixed(2);
  return price.toFixed(4);
}

async function fetchPrices(): Promise<Record<string, { usd: number; usd_24h_change: number }> | null> {
  try {
    const ids = COINS.map((c) => c.id).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CryptoPriceTicker() {
  const prices = await fetchPrices();

  const items = COINS.map((coin) => ({
    symbol: coin.symbol,
    price:  prices?.[coin.id]?.usd             ?? null,
    change: prices?.[coin.id]?.usd_24h_change  ?? null,
  }));

  return (
    <div className="w-full h-9 flex items-center select-none border-b border-[#2e2d2b]/40">
      <div className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop flex items-center justify-between gap-3 overflow-x-auto scrollbar-hide">
        {items.map((coin, i) => {
          const isUp   = (coin.change ?? 0) >= 0;
          const hasData = coin.price != null;
          return (
            <div
              key={coin.symbol}
              className="flex items-center gap-1.5 group cursor-default shrink-0"
            >
              {/* Symbol */}
              <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">
                {coin.symbol}
              </span>

              {/* Price */}
              {hasData ? (
                <span className="font-technical-data text-[11px] text-on-surface group-hover:text-primary transition-colors duration-200">
                  ${formatPrice(coin.price!)}
                </span>
              ) : (
                <span className="font-technical-data text-[10px] text-on-surface-variant/30">—</span>
              )}

              {/* Change badge */}
              {coin.change != null && (
                <span
                  className={`font-technical-data text-[9px] leading-none ${
                    isUp ? "text-green-400 crypto-up" : "text-red-400 crypto-down"
                  }`}
                  style={{ animationDelay: `${i * 0.35}s` }}
                >
                  {isUp ? "▲" : "▼"}&thinsp;{Math.abs(coin.change).toFixed(2)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
