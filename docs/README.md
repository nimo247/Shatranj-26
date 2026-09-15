# Shatranj Digital Ledger: Project Context

## Background
Shatranj is an in-person, 10-team megagame centered around resource management, economic trading, and strategic diplomacy. Previously managed via physical tracking and manual spreadsheets, the event requires a technological upgrade to handle the high volume of live player-to-player trades without bottlenecks (like the "14:59 trade rush").

## The Solution
To eliminate manual logging, the project is migrating to a **hybrid local-network web application**. This digitalization specifically targets the trading ledger, real-time inventory tracking, and Game Master (Admin) oversight. 

## Constraints & Environment
* **Offline Requirement:** The event takes place in a college hall/auditorium where internet access is unreliable. The system must operate 100% locally on a closed Wi-Fi network (192.168.x.x) via a local router.
* **Scale:** 11 concurrent devices (10 participant team tablets + 1 Admin host laptop).
* **Reference Architecture:** This project heavily borrows from the proven event-driven, real-time Socket.IO architecture of **Aarohan '26**, adapting it from a stock market simulator to a physical commodity (Food, Material, Gold) bilateral trading ledger.

## Source of Truth
The core game mechanics and systems are strictly derived from the files within the `game-design/` directory.

## Directory Index
This documentation is organized into domain-specific folders to maintain world-class repository standards:

* 📂 **`engineering/`**: Backend architecture, socket event handling, and Prisma ORM database schemas.
* 📂 **`game-design/`**: The core "tabletop" mechanics—Cards, Disasters, Regions, Rules, and Geography. *Note: These are raw design references; no code logic exists here.*
* 📂 **`manuals/`**: Operation manuals for the event day. Contains instructions for the Game Master (Admin) and the Participant UI.
* 📂 **`management/`**: Project tracking, Product Requirements (PRD), milestones (PLAN), and the live CHANGELOG.
* 📂 **`ai-agents/`**: Technical context and skill catalogs for the autonomous agents working on this workspace.
