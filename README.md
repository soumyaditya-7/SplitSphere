# ⚡ SplitSphere

**SplitSphere** is a decentralized **Instant Split & Pay** application built natively on the Stellar blockchain. It allows users to calculate their share of a shared bill and instantly settle it peer-to-peer on-chain using XLM — no banks, no delays, no intermediaries.

🔗 **Live Application:** [SplitSphere on Vercel](https://split-sphere-f2k6.vercel.app/)  
📂 **GitHub Repository:** [github.com/soumyaditya-7/SplitSphere](https://github.com/soumyaditya-7/SplitSphere)

---

## 🏗 System Design & Architecture

SplitSphere follows a single-page application (SPA) architecture combined with a purely decentralized on-chain settlement mechanism via Soroban smart contracts on the Stellar Testnet.

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React (Vite) |
| Styling & Animations | Vanilla CSS + Framer Motion |
| Blockchain SDK | `@stellar/stellar-sdk` |
| Wallet Integration | `@stellar/freighter-api` + Custom Multi-Wallet Abstraction |
| Smart Contracts | Soroban (Rust) on Stellar Testnet |
| On-Chain RPC | `soroban-testnet.stellar.org` |
| Hosting | Vercel |

---

## ⚪️ Level 1 — White Belt

This project satisfies all **Level 1 - White Belt** requirements focused on wallet connectivity, reading live XLM balances, and executing transactions on Testnet.

### 1. Wallet Setup & Connection

Full integration with the Freighter Wallet on Stellar Testnet. The dApp securely handles the handshake, connection state, user disconnection, and session persistence.

> **Wallet Connected:**
>
> ![Wallet Connected](./screenshots/connect%20wallet.png)

### 2. Live Balance Handling

Upon connection, the app immediately queries the Horizon Testnet API to fetch and display the live XLM balance inside the main dashboard.

> **Balance Displayed:**
>
> ![Balance Displayed](./screenshots/balance.png)

### 3. Transaction Flow & User Feedback

Users can calculate a split and immediately send the payment to a receiver. Clicking **"Settle Payment Now"** triggers the full flow:
- Builds a payment transaction via `@stellar/stellar-sdk`
- Prompts the user to sign via their connected wallet
- Submits to the Stellar Testnet
- Displays a live status tracker (Building → Signing → Submitting → Success/Failed)
- Shows the transaction hash with a direct link to [Stellar Expert](https://stellar.expert)

> **Payment Settled On-Chain:**
>
> ![Payment Done](./screenshots/payment%20done.png)

---

## 🟡 Level 2 — Yellow Belt

This project satisfies all **Level 2 - Yellow Belt** requirements, introducing multi-wallet support, Soroban smart contract deployment, real-time event handling, and comprehensive error management.

---

### 1. Multi-Wallet Integration

A custom wallet abstraction layer presents a premium animated modal with **6 Stellar wallet options**:

| Wallet | Type |
|---|---|
| 🚀 **Freighter** | Browser Extension |
| 🐂 **xBull** | Web & Extension |
| 🌟 **Albedo** | Web-based Signer |
| 🦞 **LOBSTR** | Mobile & Web |
| 🌸 **Hana** | Browser Extension |
| 🔷 **Rabet** | Browser Extension |

The abstraction layer in `src/services/stellar.js` routes connections, signing, and error handling per wallet type — mimicking the `StellarWalletsKit` pattern.

> **Wallet Options Modal:**
>
> ![Wallet Selection Modal](./screenshots/connect%20wallet.png)

---

### 2. Smart Contract — Deployed on Testnet

**Contract ID:** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

> 🔗 [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC)

The `SplitTracker` Soroban contract (written in Rust) provides:

| Function | Description |
|---|---|
| `record_expense(payer, description, debts)` | Records a split payment on-chain with per-wallet debt mapping |
| `settle_debt(debtor, creditor, token, amount)` | Executes on-chain token transfer to settle a recorded debt |
| `get_expense(id)` | Reads a stored expense record |
| `get_expense_count(address)` | Returns total recorded expenses for a payer |

Contract source: [`contracts/split_tracker/src/lib.rs`](./contracts/split_tracker/src/lib.rs)

---

### 3. Contract Called from Frontend

The `ContractPanel` component in `src/components/ContractPanel.jsx` integrates directly with the deployed contract:

- **"Record On-Chain"** button per payment — writes the split details to the Soroban contract via `recordExpenseOnChain()`
- **On-Chain Activity Feed** — displays all contract-recorded payments with tx hash links to Stellar Expert
- **On-Chain Expense Count** — live counter queried from the contract via `get_expense_count()`
- Full transaction lifecycle: **Build → Simulate → Sign → Submit → Poll for result**

Implementation in `src/services/soroban.js`:
```js
// Records a finalized split on-chain
export async function recordExpenseOnChain(walletAddress, signTransaction, description, debtsObj, onStatusChange)

// Executes on-chain settlement transfer
export async function executeSettlementOnChain(senderPublicKey, signTransaction, receiver, amount, onStatusChange)
```

---

### 4. Three Error Types Handled

All errors are handled via a custom typed error system in `src/services/errors.js`:

| Error Class | When Triggered | User-Facing Message |
|---|---|---|
| `WalletNotFoundError` | No wallet extension detected | *"No compatible wallet found. Please install Freighter..."* |
| `TransactionRejectedError` | User dismisses or rejects the signing prompt | *"You rejected the transaction. No funds were sent."* |
| `InsufficientBalanceError` | Account balance too low for the requested payment | *"Insufficient balance. You need X XLM but only have Y XLM."* |

Each error type renders as a distinct animated banner (`src/components/ErrorBanner.jsx`) with color-coded indicators (orange for wallet issues, red for rejection, yellow for balance).

---

### 5. Transaction Status Tracking

Real-time transaction lifecycle UI in `src/components/TransactionStatus.jsx`:

```
🔵 Building  →  🟡 Signing  →  🟠 Submitting  →  ✅ Success / ❌ Failed
```

- Animated step indicators with pulse effects for the active step
- On **Success**: transaction hash displayed with a clickable Stellar Expert link
- On **Failure**: parsed error message with descriptive actionable feedback

---

### 6. Real-Time Data Synchronization

- **Live Balance Refresh** after every settled payment via `BalanceCard.jsx`
- **On-Chain Count Sync** — the contract's expense counter refreshes immediately after each successful `record_expense` call
- **Payment Activity Feed** — local state is updated in real time and data is persisted to `localStorage` for cross-session continuity

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- [Freighter Wallet Extension](https://www.freighter.app/) (switched to **Testnet**)
- Testnet XLM (fund via Freighter's built-in faucet)

### 1. Clone and Install

```bash
git clone https://github.com/soumyaditya-7/SplitSphere.git
cd SplitSphere
npm install
```

### 2. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Use the App

1. Click **Connect Wallet** and choose your wallet (Freighter recommended for Testnet)
2. In the **Instant Split & Pay** form:
   - Enter the **description** (e.g. *Dinner at Pizza Hub*)
   - Enter the **Total Bill** in XLM
   - Choose how many **ways to split** it (1–10)
   - The app **automatically calculates your exact share**
3. Paste the **receiver's Stellar public key** (starting with `G...`)
4. Click **Settle Payment Now** — your wallet prompts you to sign and the XLM goes directly on-chain
5. Optionally click **Record On-Chain** in the Smart Contract panel to log the split to the Soroban contract

---

### Smart Contract Deployment (Optional / Self-Host)

To deploy your own instance of the `SplitTracker` contract:

**Prerequisites:**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli --features opt
```

**Build & Deploy:**
```bash
cd contracts/split_tracker
stellar contract build
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/split_tracker.wasm \
  --source <YOUR_IDENTITY> \
  --network testnet
```

Update the returned Contract ID in `src/services/soroban.js` line 11:
```js
export const CONTRACT_ID = 'YOUR_NEW_CONTRACT_ID_HERE';
```

---

## 📋 Yellow Belt Submission Checklist

- [x] Public GitHub repository — [github.com/soumyaditya-7/SplitSphere](https://github.com/soumyaditya-7/SplitSphere)
- [x] README with full setup instructions
- [x] Minimum 2+ meaningful commits
- [x] **Live demo link** — [split-sphere-f2k6.vercel.app](https://split-sphere-f2k6.vercel.app/)
- [x] **Screenshot: wallet options available** — See `screenshots/connect wallet.png`
- [x] **Deployed contract address** — `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- [x] **Transaction hash of a contract call** — Verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC)
- [x] **3 error types handled** — `WalletNotFoundError`, `TransactionRejectedError`, `InsufficientBalanceError`
- [x] **Contract deployed on testnet** — Soroban Testnet
- [x] **Contract called from frontend** — `recordExpenseOnChain()` & `executeSettlementOnChain()`
- [x] **Transaction status visible** — Building → Signing → Submitting → Success/Failed

---

> Built with ⚡ by Soumyaditya on Stellar Testnet
