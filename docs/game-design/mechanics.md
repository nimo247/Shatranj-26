# Shatranj: Game Master & Admin Mechanics Guide

This document is the operational playbook for Game Masters (GMs) and Admins. It details how to read the room, apply disasters dynamically, manage the digital ledger, intervene in economic crises, and handle player disruptions without breaking the underlying mathematical balance of the game.

---

## 1. Disaster Application & Timing
Disasters (from `Disasters.txt`) should not be drawn purely at random. The GM should curate the 6 disasters deployed during the game based on the current room dynamics.

### Timing of Calamities
* **The Sudden Strike:** Calamities strike immediately and without notice, taking effect on the ledger. However, GMs are encouraged to drop narrative hints or "impending notices" slightly beforehand to build tension.

### When & How to Apply Disasters
* **Rounds 3 & 4 (Early Game):** Drop **Regional Disasters**. The goal here is to test trade routes. If Group 1 (Quarries/Mines) is hoarding Material, drop "The Eastern Fault Quake" (D14) to wipe out 400 Material from them.
* **Rounds 6 & 8 (Late Game):** Drop **Continental Disasters**. The goal here is to test macro-economic resilience. 
* **Reading the Room:**
  * *If teams are hoarding unbuilt cards:* Use D1 or D2 (Lose 100 Food per [FOOD] card).
  * *If teams are hoarding cash:* Use D4 (Flat loss of 300 Gold from all stockpiles).
  * *If one specific resource is over-abundant:* Use a production debuff (e.g., D6: 50% Material yield cut).

---

## 2. Digital Ledger & Trade Mechanics
The game relies exclusively on an instant, live digital limit-order book for all transactions.

* **Public vs. Targeted Orders:** The ledger supports both open-market public listings and targeted orders directed at a specific team ID.
* **Partial Fills:** Teams can buy partial amounts of a listed order (e.g., buying 40 Food from a 300 Food listing).
* **Unbuilt Cards Non-Transferable:** Trading unbuilt drafted card deeds between players is **strictly prohibited**. Drafted cards are bound to the team that picked them until built.
* **Verbal Promises are Void:** There are no enforceable verbal trades or multi-round loans. Only trades executed on the digital sheet are recognized by the Citadel. If a team reneges on a verbal promise, the Admin does not intervene (Caveat Emptor).

---

## 3. Engine Operations & Upkeep Failure
At the end of Phase 2 (Minute 15:00), the sheet processes engine upkeeps. 
* **Auto-Deactivation:** If a team lacks the required Food or Material to pay for all their active cards, the team gets to select which card(s) to deactivate.
* **Zero Penalty:** A deactivated card simply consumes 0 Upkeep and produces 0 Yield for the round. There are no additional stall fees or maintenance penalties.

---

## 4. King's Wrath Tax Collection & Solvency
In Rounds 4 and 7, the Top 3 NAV teams owe the King's Wrath Tax (400G and 800G). 
* **Multi-Asset Payment:** Teams can pay the tax using a mix of their Liquid Gold, Food, and Material (at the 1:1 NAV scrap rate).
* **Card Liquidation (Surrender):** If completely illiquid, a team can surrender a built card. The team chooses the card. It clears tax equal to its **Base Gold Value**. Any excess value beyond the tax owed is refunded back to the team as Liquid Gold.
* **The Imperial Lien (Debt Penalty):** If a team still cannot cover the full tax, the unpaid remainder becomes a loan (Imperial Lien). This incurs a conversion penalty of **1.5x**. *(Example: 100 unpaid tax becomes 150 Debt, logged as -150 NAV at the end of the game).*

---

## 5. Dynamic Adjustments & Economic Scenarios
Use these mathematically exact levers to correct room behavior.

### Scenario A: The Room Refuses to Trade (Admin Farming)
* **The Problem:** Teams are too stubborn to negotiate and instead just sell raw goods to the Admin at 100G, and buy from the Admin at 200G.
* **The Solution:** Announce an "Imperial Tariff." Change Admin Standing Orders to a **5x spread** (Sell to Admin = 50G, Buy from Admin = 250G). Teams instantly lose purchasing power and are forced back to player markets.

### Scenario B: Massive Inflation (Too Much Gold)
* **The Solution:** Trigger Disaster D9 (Gold Maintenance Doubled) OR temporarily increase the King's Wrath Tax by 50%. 

### Scenario C: Market Gridlock (No Liquidity)
* **The Problem:** Teams have plenty of Food and Material, but NO Liquid Gold to facilitate trades.
* **The Solution (The Sovereign's Procurement):** The Admin temporarily offers to buy Food/Material at a premium **150 Gold per 100 Units** (up from 100G) for exactly 10 minutes to inject cash.

---

## 6. The "Poor Room" Crisis (Room-Wide Poverty)
If 8 out of 10 teams are mathematically incapable of paying the 1,000+ Winter Upkeep and face a negative-NAV collapse:
1. **The Imperial Jubilee:** Hold the Winter Upkeep flat for two rounds to let engines catch up.
2. **Public Works Project:** The Admin pays 300 Gold per 100 Materials (normally 100G) for a single round to inject stimulus cash.
3. **Amnesty Protocol:** Allow teams to permanently "Sell" built Common Cards back to the Admin for 300 Gold each to avoid bankruptcy.

---

## 7. Drafting & Auction Logistics (Rounds 1–6)

### Physical Tray Audits (Rounds 1–5)
To prevent lost cards and pool corruption during drafting:
* **Rounds 1, 3, 5:** 3 cards delivered $\rightarrow$ 1 card kept $\rightarrow$ exactly **2 cards returned** in the tray.
* **Rounds 2, 4:** 6 cards delivered $\rightarrow$ 2 cards kept $\rightarrow$ exactly **4 cards returned** in the tray.
* Table Verifiers must physically count the tray before taking it back to the Citadel desk.

### Auction Logistics (Rounds 5 & 6)
* **Round 5 (Royal Auction):** Features 8-10 Elite Cards. The GM can enforce the **"Winter Solvency" Rule**, rejecting massive bids if the team cannot prove they have enough food/material to survive the impending Winter.
* **Round 6 (Normal Auction):** Features exactly 30 Common Cards. Because live-auctioning 30 cards would stall the 20-minute round, this is handled via a **Digital Silent Auction** (bids placed on a dedicated sheet tab) OR by auctioning the cards in **Bundles/Lots** (e.g., 10 lots of 3 cards).

---

## 8. Event Disruptions & Operational Protocols

### A. "Kingmaking" (Asset Dumping)
A dying team trades all their assets to a friend for 1G. 
* **Fix:** The Anti-Dumping Protocol. The sheet Admin explicitly VETOES any trade where assets are transferred at less than 50% of their Admin Scrap Value.

### B. Rigid Cartels
5 teams refuse to trade with the other 5. 
* **Fix:** Drop Regional Disasters directly targeting the cartel's territories.

### C. The "Hovering" Strategy (Tax Evasion)
A top team burns small resources or manages NAV to stay in 4th place before Round 4/7 to avoid King's Wrath.
* **Fix:** Allow it completely. This is a legitimate tactical metagame play ("The Peloton Effect").

### D. Digital Sabotage / Espionage
Players physically peeking at other team tablets. 
* **Fix:** Enforce the "Fog of War." Tablets are strictly private. To know a team's inventory, players must send a diplomat to ask (and lying is allowed).

### E. Quiet / Passive Tables
In a structured environment, introverted teams might hesitate to initiate trades on the ledger.
* **Fix:** Admins and Table Verifiers must actively encourage trading and guide teams on order book listings without making strategic decisions for them.

---

## 9. Final Victory & Tiebreakers
At the end of Round 10, the winner is determined by the highest Final Net Asset Value (NAV). If two or more teams tie on exact NAV, use the following hierarchy to determine the winner:
1. **Lowest cumulative Starvation / Imperial Debt** taken across the entire game.
2. **Highest total Base Value** of all Active and Built Cards.
3. **Highest remaining Liquid Gold** stockpile.
