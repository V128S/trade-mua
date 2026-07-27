---
title: "ASIC Power Wiring in 2026: Single-Phase vs Three-Phase, Breakers, Cable, Grounding"
description: "How to wire an ASIC miner properly: current calculation, breaker rating and cable cross-section, 230 V vs 400 V, RCD and grounding. A practical guide from Trade M."
date: "2026-07-27"
---

An ASIC is not a household appliance — it is a constant 24/7 load with no pauses. That is why most "miner failures" at home turn out to be wiring problems: overheated terminals, the wrong breaker rating, a 10 A socket feeding a 3.5 kW machine. Let's cover how to calculate current, pick cable and breakers, and when one phase is no longer enough.

## What an ASIC actually draws

Nameplate consumption is not the maximum. Real load runs 5–10% above the spec because of PSU efficiency, and startup draws even more for a moment. So always size the wiring with headroom:

**Design power = nameplate × 1.15**

For an AntMiner S21 (3510 W), plan for ~4 kW on the line, not 3.5 kW. One more principle: a miner is a **continuous load**, so its breaker is rated one step higher than for household equipment of the same wattage.

## Calculating current

Single-phase (230 V):

**I = P / U** — 3510 W / 230 V ≈ 15.3 A

Three-phase (400 V):

**I = P / (1.73 × U)** — 11180 W / (1.73 × 400) ≈ 16.1 A per phase

A three-phase connection spreads the same power across three lines, so the current on each is three times lower. That is exactly why 8–12 kW models are only connected to 400 V.

## Single-phase vs three-phase

| Parameter | Single-phase 230 V | Three-phase 400 V |
|---|---|---|
| Practical ceiling | up to ~7 kW | 30 kW and above |
| How many ASICs | 1–2 machines | a farm |
| Current at 11 kW | ~48 A (too much) | ~16 A per phase |
| Cable | thicker | thinner for the same power |
| Where it's used | home, garage | workshop, [mining hotel](/services) |

Rule of thumb: one or two machines up to 3.5 kW each are fine on a solid single-phase line. From three machines, or from a single 10+ kW model (an S21E XP Hyd, for example), you need three phases.

## Breaker and cable cross-section

Copper cable, concealed wiring, indicative figures:

| Cross-section | Breaker | Power (230 V) | Suits |
|---|---|---|---|
| 2.5 mm² | 16–20 A | up to ~4 kW | one 3–3.5 kW ASIC |
| 4 mm² | 25 A | up to ~5.5 kW | S21 Hydro, high-power air-cooled |
| 6 mm² | 32 A | up to ~7 kW | two machines on one line |
| 10 mm² | 40–50 A | up to ~10 kW | feed for a group |

Three rules that save hardware:

1. **A dedicated line from the panel** for every miner — no sharing a socket with a kettle or water heater.
2. **Copper only.** Aluminium wiring creeps under continuous load, terminals loosen, heat builds up.
3. **Size the breaker to the cable, not the other way round.** The breaker protects the wire: 32 A on 2.5 mm² means the cable burns before the protection trips.

## Grounding, RCD and voltage stabilisation

- **Grounding is mandatory.** Without it the chassis can float, and the miner's controller is sensitive to interference — a classic cause of "random" reboots and corrupted firmware.
- **An RCD (30 mA) or RCBO** — protection against electric shock and against a live-to-chassis fault in a damp garage or basement.
- **A stabiliser or voltage relay.** Sags and spikes in rural grids kill power supplies — the single most common item in [ASIC repair](/blog/asic-repair-guide).
- **Generators: handle with care.** Cheap inverter units produce a "dirty" sine wave; a miner runs unstably on it and wears out its PSU faster.

## Common mistakes

- An extension cord instead of a fixed line — contacts heat up, voltage drops.
- A 10 A household socket feeding a machine that pulls 15 A.
- One breaker shared between the miner and the rest of the premises: everything trips at once.
- Twisted joints instead of terminals — the leading cause of fires in home "farms".
- Sizing to nameplate power with no headroom for overclocking. After a [firmware overclock](/blog/asic-firmware-guide), consumption can rise 20–30%.

## When not to do the electrics yourself

Wiring for 2–3 machines is already a project with a panel, separate circuits and ventilation. Above 7–10 kW, getting that capacity legally connected to a residential building is often more expensive and slower than [placing the hardware in a mining hotel](/services), where industrial power, cooling and 24/7 monitoring already exist. A side-by-side comparison is in our [mining hotel vs home](/blog/mining-hotel-vs-home) article.

## Conclusion

Electrics are half the job when commissioning an ASIC. Size current with 15% headroom, run a dedicated copper line per machine, match the breaker to the cable, and never cut corners on grounding and the RCD. Above 7 kW move to three phases; above three machines, work out whether industrial hosting is simply cheaper.

Not sure your wiring will handle the model you want? [Get in touch](/contact) — we'll spell out the line requirements for a specific ASIC from the [catalog](/products), and you can estimate electricity cost in the [calculator](/calculator).
