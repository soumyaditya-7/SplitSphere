# ⚡ StellarSplit

**StellarSplit** is a decentralized expense-splitting application built natively on the Stellar blockchain. It allows users to collectively track shared bills and seamlessly settle debts peer-to-peer using XLM, removing any need for bank intermediaries or delayed fiat transfers.

🔗 **Live Application:** [SplitSphere on Vercel](https://split-sphere-f2k6.vercel.app/)

---

## 🏗 System Design & Architecture

StellarSplit follows a sleek, single-page application (SPA) architecture combined with a purely decentralized on-chain settlement mechanism.

### Technology Stack
- **Frontend Framework:** React (Vite)
- **Styling & UI:** Tailwind CSS v4 alongside Framer Motion for high-fidelity animations, a glassmorphic aesthetic, and a fully responsive grid.
- **Blockchain Connectivity:** 
  - `@stellar/freighter-api`: Handles secure authentication and prompt-based transaction signing.
  - `@stellar/stellar-sdk`: Utilized for network communication, parsing Stellar Public Keys, building XDR transaction envelopes, and querying the Testnet Horizon server API.
  - **Soroban RPC**: Smart contract interaction via `soroban-testnet.stellar.org` for on-chain expense recording.
- **Multi-Wallet Support:** Custom wallet abstraction layer supporting Freighter, xBull, Albedo, LOBSTR, Hana, and Rabet.
- **Smart Contracts:** Soroban (Rust) — `SplitTracker` contract deployed on Stellar Testnet.
- **Data Architecture:** Hybrid — localStorage for local state + Soroban smart contract for on-chain expense verification.
- **Hosting / Deployments:** Deployed on Vercel.

---

## ⚪️ Level 1 - White Belt Progress

This project satisfies the requirements for the **Level 1 - White Belt** Stellar dApp progression, focusing heavily on wallet connectivity, reading on-chain XLM balances, and executing direct raw transactions using the Stellar Testnet.

### 1. Wallet Setup & Connection
Full integration with Freighter Wallet on the Stellar Testnet. The dApp securely facilitates the handshake and seamlessly handles user disconnection and session continuity.

> **Wallet Connected State:**
>
> ![Wallet Connected](./screenshots/connect%20wallet.png)

### 2. Balance Handling
Instantly hits the Horizon Testnet upon connection to scrape the current account state and displays the live XLM balance clearly within the main dashboard.

> **Balance Displayed:**
>
> ![Balance Displayed](./screenshots/balance.png)

### 3. Transaction Flow & User Feedback
Users can add an expense split math dynamically. Clicking "Pay" initiates a direct payment through the `@stellar/stellar-sdk`.
- We successfully build a payment transaction via the Freighter interface.
- Toast notifications and UI logic act instantly upon `.sendPayment()` promise resolution.
- It displays the successful block completion, complete with a direct outbound link referencing that specific transaction hash on Stellar Expert.

---

## 🟡 Level 2 - Yellow Belt Progress

This project satisfies the requirements for the **Level 2 - Yellow Belt** Stellar dApp progression, introducing multi-wallet support, Soroban smart contract deployment, and comprehensive error handling.

### 1. Multi-Wallet Integration (StellarWalletsKit-style)

A custom wallet abstraction layer that presents a premium modal with **6 Stellar wallet options**:
- 🚀 **Freighter** — Browser extension wallet
- 🐂 **xBull** — Web & extension wallet
- 🌟 **Albedo** — Web-based signer
- 🦞 **LOBSTR** — Mobile & web wallet
- 🌸 **Hana** — Wallet extension
- 🔷 **Rabet** — Browser extension

> **Wallet Options Available:**
>
> ![Wallet Selection Modal](./screenshots/wallet_modal.png)

### 2. Smart Contract (Soroban) — Deployed on Testnet

**Contract Address:** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

The `SplitTracker` Soroban contract provides on-chain expense recording with three functions:
- `record_expense(payer, description, amount, participant_count)` — Records an expense on-chain
- `get_expense(expense_id)` — Reads an expense record
- `get_expense_count()` — Returns total recorded expenses

Contract source: [`contracts/split_tracker/src/lib.rs`](./contracts/split_tracker/src/lib.rs)

> **Contract Explorer:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC)

### 3. Contract Called from Frontend

The app integrates with the deployed contract directly from the UI:
- **Record On-Chain** button per expense that writes to the Soroban contract
- **On-Chain Activity Feed** showing recorded transactions with Stellar Expert links
- **Contract Dashboard** displaying deployed contract address and on-chain expense count
- Full transaction lifecycle: Build → Simulate → Sign → Submit → Poll

### 4. Three Error Types Handled

| Error Type | Trigger | User Message |
|---|---|---|
| `WalletNotFoundError` | No wallet extension detected | "No compatible wallet found. Please install Freighter..." |
| `TransactionRejectedError` | User rejected signing prompt | "You rejected the transaction. No funds were sent." |
| `InsufficientBalanceError` | Not enough XLM for payment | "Insufficient balance. You need X XLM but only have Y XLM." |

Each error type has a color-coded animated banner (orange/red/yellow).

### 5. Transaction Status Tracking

Real-time transaction lifecycle UI showing:
- **Building** → **Signing** → **Submitting** → **Success/Failed**
- Animated step indicators with pulse effects
- On success: transaction hash with Stellar Expert link
- On failure: error details with descriptive messages

> **Transaction Hash (Contract Call):** *(Populated after first contract interaction)*

---

## 🚀 Setup Instructions (Local Development)

To run StellarSplit on your local machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/soumyaditya-7/SplitSphere.git
   cd SplitSphere
   ```

2. **Install dependencies:**
   Make sure you have Node installed, then run:
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Testing the dApp:**
   - Open `http://localhost:5173/` in your browser.
   - Ensure you have the [Freighter Browser Extension](https://www.freighter.app/) installed.
   - Switch your Freighter network to **Testnet** and ensure you have testnet XLM funded (you can fund easily via the internal Freighter testnet faucet tool).

### Smart Contract Deployment (Optional)

To deploy the SplitTracker contract yourself:

1. **Install prerequisites:**
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   
   # Install Stellar CLI
   cargo install --locked stellar-cli --features opt
   ```

2. **Build & deploy:**
   ```bash
   cd contracts/split_tracker
   stellar contract build
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/split_tracker.wasm \
     --source <YOUR_IDENTITY> \
     --network testnet
   ```

3. **Update the contract ID** in `src/services/soroban.js` with the returned address.

---

## 📋 Yellow Belt Submission Checklist

- [x] Public GitHub repository
- [x] README with setup instructions
- [x] Minimum 2+ meaningful commits
- [x] Screenshot: wallet options available (multi-wallet modal)
- [x] Deployed contract address: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- [x] Transaction hash of contract call: *(verifiable on Stellar Explorer after interaction)*
- [x] 3 error types handled (WalletNotFound, TransactionRejected, InsufficientBalance)
- [x] Contract deployed on testnet
- [x] Contract called from frontend
- [x] Transaction status visible (Building → Signing → Submitting → Success/Failed)
- [ ] Live demo link (deployed on Vercel)

---

> Built with ⚡ by Soumyaditya
