---
title: "Used or New ASIC in 2026: A Checklist for Inspecting a Second-Hand Miner"
description: "How to inspect a used ASIC before buying: load testing, hashboards, PSU, firmware, red flags. When second-hand makes sense and when to buy new — from Trade M."
date: "2026-07-27"
---

A used ASIC costs 30–60% less than a new one — and that discount is exactly what costs buyers money every year. A machine that spent two years in a dusty shed can hold its rated hashrate right up until the moment your payment clears. Let's go through what to check, how to load-test, and when second-hand genuinely makes sense.

## Used vs new: an honest comparison

| Parameter | New | Used |
|---|---|---|
| Price | 100% | 40–70% |
| Warranty | 6 months or more | usually none |
| Fan life left | full | 30–70% |
| Risk of hidden repairs | none | high |
| Lead time | 10–14 days from China | immediate |
| Real efficiency | as rated | often 5–15% worse |

The real trap with second-hand hardware isn't the price — it's **uncertainty**. A new miner has predictable economics: you know the hashrate, the draw, and that [the calculator's payback figure](/calculator) will hold. With a used unit, add repairs you haven't seen yet.

## What to establish before you inspect

Before meeting the seller, find out:

- **The exact model and serial number.** "Antminer S19" covers a dozen different machines with efficiency from 29 to 45 J/TH. The number should be on the chassis and in the web interface.
- **Its service history.** Hours of runtime, where it ran (home, shed, [mining hotel](/services)), whether it was immersion-cooled.
- **Whether it was repaired.** How many hashboards were replaced, and by whom. One replaced hashboard is normal; three is a reason to walk away.
- **Which firmware it runs.** Custom overclocked firmware means the machine spent years outside factory limits. Details in our [ASIC firmware guide](/blog/asic-firmware-guide).

## In-person inspection checklist

1. **Chassis and connectors.** No signs of water damage, rust, or melted connectors. Blackened power contacts are a red flag.
2. **Heatsinks and dust.** Dust-clogged heatsinks mean years without maintenance and, almost certainly, overheated chips.
3. **Smell.** The distinctive burnt smell never airs out and points straight at a past failure.
4. **Fans.** Spin them by hand: play, grinding, or a seized bearing means replacement.
5. **Hashboards.** Look at the boards: flux residue and fresh solder in many places means backyard repair, not factory service.
6. **Power supply.** Bulging capacitors, a discoloured case, unusual noise — the most common cause of failure right after purchase.

## Load testing is non-negotiable

An inspection without powering up proves nothing. Ask for the machine to run for at least 2–4 hours and watch the interface:

- **Actual vs rated hashrate.** Up to 5% off is normal; more means chip degradation.
- **Working chains.** Should read 3/3 (or whatever the model specifies). 2/3 means a dead hashboard.
- **Chip temperatures.** Even across boards; a 15–20 °C spread between boards is a warning.
- **HW errors.** A handful per hour is acceptable; hundreds means the chips are failing.
- **Rejected shares.** Consistently above 1% points at the board or the network, not at the [pool](/blog/mining-pool-guide-2026).
- **Behaviour once warm.** A machine that holds its hashrate for ten minutes and sags at the forty-minute mark is a textbook hidden defect.

## Red flags

- The seller won't power it up "because there's no electricity here".
- No serial number, or a defaced one.
- Locked or unfamiliar firmware with no access to settings.
- A price well below market "because it's urgent".
- A sale with no testing at all, cash only, on the spot.

## When a used ASIC does make sense

Second-hand works when you know what you're paying for:

1. **You can repair it** — or a service centre is nearby. Then a cheap machine with one dead hashboard becomes a good buy.
2. **You need spare parts** for an existing fleet of the same model.
3. **Older models on cheap power** — [Scrypt machines](/blog/litecoin-dogecoin-scrypt-mining-2026) or earlier SHA-256 generations can still pay off where the tariff is low.

Otherwise the price gap is eaten by the first repair: replacing a hashboard and a PSU easily consumes 20–40% of the saving. What gets repaired and at what cost is covered in our [ASIC repair guide](/blog/asic-repair-guide).

## Conclusion

Buying a used ASIC means buying someone else's operating history, not just hardware. Verify the serial, past repairs, and firmware before you inspect; look at the chassis, hashboards, and PSU in person; and always load-test for at least two hours. If the seller avoids the test, that is your answer.

Want predictable economics with no surprises? The [catalog](/products) carries new hardware with the price fixed at order time and a 6-month warranty. Unsure about a specific second-hand offer — [message us](/contact) and we'll help assess its condition and risks.
