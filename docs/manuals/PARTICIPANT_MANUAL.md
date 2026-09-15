# Shatranj: Participant Manual

Welcome to Shatranj. You represent a faction in a dynamic economic simulation.

## Core Mechanics
- You produce specific goods depending on your assigned Region.
- The overarching goal is economic stability, generating wealth, and managing crises.

## Dashboard Overview
1. **HUD (Heads Up Display)**
   - Located at the top. Displays your live balances for **Food**, **Material**, and **Gold**.
   - Your escrowed balances (resources tied up in active orders) are shown in parentheses next to the total.

2. **The Ledger (Market)**
   - Displays all `OPEN` orders on the network.
   - You can see whether a faction is Buying or Selling, the Resource (Food or Material), the Amount, and the Price per unit.
   - **Imperial Citadel** orders are always pinned at the top.
   - You can click **Accept** on any valid player order to instantly execute the trade.

3. **Placing Orders**
   - Use the "Place Order" panel to broadcast your trade intents.
   - **Resource**: Select Food or Material.
   - **Type**: Select Buy or Sell.
   - **Target**: Leave blank to broadcast to the whole market, or specify a Team ID for a private trade.
   - You cannot double-spend. Creating an order locks the respective resources in escrow.

4. **Imperial Citadel (Admin Trade)**
   - The Citadel holds infinite resources.
   - Use the dedicated "Imperial Trade" panel to Buy from or Sell to the Citadel at their current standing rates.
   - This bypasses the peer-to-peer ledger entirely.

5. **Mailbox**
   - Check your Mailbox for trade execution receipts or notifications from the Admin.

## Cards & Infrastructure
- You will be assigned specific infrastructure Cards by the Admin throughout the event.
- **Building**: You must pay the one-time build cost in resources to permanently construct a card.
- **Activation**: Once built, you can toggle the card to `Active`. Active cards consume Maintenance Costs every round but generate Returns (Yields).
- **Next Round Ticker**: A live HUD element above your cards displays exactly how much Net Food, Material, and Gold your active cards will generate or consume when the round ticks over.
- **Elite Cards**: Denoted by a purple star (★). These are highly powerful assets that are strictly immune to all Disasters.

## Disasters
- Occasional disasters may strike your region or the entire continent.
- Active disasters will appear as debuff banners on your Cards screen. 
- These may cause one-off flat resource losses or sustained percentage penalties (e.g., -50% Food Production) to your *total normal yield*. Elite card yields are protected from these percentage modifiers.
