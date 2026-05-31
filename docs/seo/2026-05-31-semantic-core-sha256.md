# Semantic core — SHA-256 / Bitcoin ASIC cluster — 2026-05-31

Largest cluster: **33 SHA-256 models (56% of catalog)**, all mine BTC. Source: live
Supabase. **No GSC data yet** (property unverified) → every term below is
*expansion / bet*, not confirmed demand. Re-anchor to `analytics_top_queries`
once GSC is verified and accrues ~2–4 weeks of data.

## Entity inventory (SHA-256, brand → model families)
- **AntMiner S23** — S23, S23 (June), S23 Hyd (July), S23 Hyd 3U, S23 IMM — newest/top ($8.2k–$32k)
- **AntMiner S21 XP** — S21XP, S21XP IMM, S21 XP Hyd/Hydro ($4.1k–$7.4k)
- **AntMiner S21 / S21+ / S21 Pro** — S21, S21 Pro, S21 Pro+, S21+, S21+ Hyd, S21 IMM, S21e Hyd ($1.4k–$3.5k) — **S21 200 TH/s is the only IN-STOCK SHA-256 model**
- **AntMiner S19** — S19 XP+ Hyd 3U, S19XP+ Hyd, S19K Pro ($0.8k–$3.65k)
- **Avalon** — Q, Mini 3, Nano 3s ($0.65k–$2k)
- **FluMiner** — T3 ($2.05k)

## Intent grid (UA + RU) — apply per model + per family

| Intent | UA pattern | RU pattern |
|---|---|---|
| Buy | `{model} купити`, `{model} ціна`, `купити {model} Україна` | `{model} купить`, `{model} цена`, `купить {model} Украина` |
| Profitability | `{model} дохідність`, `{model} окупність` | `{model} доходность`, `{model} окупаемость` |
| Spec/compare | `{model} характеристики`, `{model} огляд`, `{model} vs {model2}` | `{model} характеристики`, `{model} обзор`, `{model} vs {model2}` |
| Service | `прошивка {model}`, `ремонт {model}` | `прошивка {model}`, `ремонт {model}` |

Head/algorithm terms (map to the hub, not a single card):
`асік для біткоїна` / `асик для биткоина`, `SHA-256 майнер купити` / `SHA-256 майнер купить`,
`Bitcoin ASIC ціна` / `цена`, `Antminer купити Україна` / `Antminer купить Украина`,
`майнінг ферма під ключ` / `майнинг ферма под ключ`.

## Clusters → target URL

| Cluster | Intent | UA / RU sample | Target URL | Status |
|---|---|---|---|---|
| Per-model "buy" (×~25 base models) | transactional | `Antminer S23 купити` / `купить` | existing `/products/<id>` (+`/ru`) | exists — needs meta/H1 (#meta-content) |
| Per-model "profitability" | commercial | `Antminer S21 дохідність` | product card + `/calculator?...` deep link | partial — calculator link exists |
| **SHA-256 / Bitcoin ASIC hub** | category head | `асік для біткоїна купити` | **NEW** `/products?algorithm=SHA256` as indexable hub | gap → #structure |
| S21 family hub | category | `Antminer S21 серія` / `серия` | NEW sub-hub or filtered view | gap → #structure |
| Service × model | service | `прошивка Antminer S21` | `/services` (anchor) | exists — enrich |
| Pillar: "Як вибрати ASIC для біткоїна" | informational | guide linking hub ↔ cards ↔ calculator | **NEW** content page | gap → #structure + content |

## Recommended first actions (GSC-independent)
1. **#meta-content for the highest-value models first** (UA+RU title/description/H1):
   the in-stock **S21 (200 TH/s)** + top-ticket **S23 Hyd 3U / S23 Hyd / S21E XP Hyd 3U**.
   These carry the most revenue surface and the only in-stock conversion path.
2. **#structure: make `/products?algorithm=SHA256` an indexable "Bitcoin ASIC" hub**
   (canonical, intro copy, internal links) — captures the algorithm-head terms no
   single card can rank for.
3. Defer long-tail per-model expansion until GSC confirms which models actually
   draw impressions — avoid mass-producing pages for unproven demand.

> Honesty note: rankings/volumes are unmeasured (no GSC). This core is a
> structured **hypothesis** from real inventory; validate & prune with Search
> Console data before scaling page creation.
