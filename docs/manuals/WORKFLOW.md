# Shatranj App Setup Workflow

This document outlines the step-by-step process to set up, build, and run the Shatranj digital ledger on your local network.

## 1. Prerequisites
* **Node.js** (v18 or higher recommended)
* A dedicated **Wi-Fi Router** (does not need internet access, just local LAN capabilities)

## 2. Installation & Initialization
1. Open a terminal in the root of the project directory.
2. Install dependencies for both server and client:
   ```bash
   npm run setup
   ```
   *(This command runs `npm install`, pushes the Prisma schema to the SQLite database, and builds the client frontend).*
3. Create a `.env` file in the root directory and define the Admin keyword:
   ```env
   JWT_SECRET=<generate-a-long-random-value>
   ADMIN_KEYWORD=<choose-a-private-admin-password>
   PORT=3000
   ```

## 3. Starting the Server
1. Find your machine's local IP address (e.g., open command prompt and type `ipconfig`. Look for `IPv4 Address` under your Wi-Fi adapter, usually something like `192.168.1.5`).
2. Start the application:
   ```bash
   npm start
   ```
3. The server will now listen on Port 3000.

## 4. Event Day Execution (The Live Run)
1. **Admin Setup:**
   * On the host laptop, open a browser and go to `http://localhost:3000/admin`.
   * Log in using the `ADMIN_KEYWORD`.
   * Navigate to **Team Onboarding**. Upload the CSV of team names or enter them manually. Assign Regions and click **Confirm** to generate the Team IDs and Passwords.
   * Navigate to **Cards** and assign the initial starting cards to all teams.
2. **Participant Onboarding:**
   * Have all 10 teams connect their tablets/laptops to the local Wi-Fi router.
   * Instruct them to open their browser and go to the host's IP address (e.g., `http://192.168.1.5:3000`).
   * Distribute the generated Team IDs and Passwords to the respective tables.
3. **Running the Game:**
   * Teams log in and see the live ledger.
   * The Admin controls the overall game state from the Dashboard, edits NAVs in the Leaderboard, and watches the economy flow.
