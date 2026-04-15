# 🧠 Stellar Split Project Mind Map

## 📌 Idea

Stellar Split is a blockchain-based expense splitting app that allows users to split bills and settle debts using XLM on Stellar. It's decentralized, fast, and transparent — no middlemen, no delays.

## 🚀 Features

- [x] Wallet connection (Freighter)
- [x] Balance display
- [x] Add expense (manual public key entry)
- [x] Debt calculation (split equally)
- [x] Send XLM (settle debt)
- [ ] Smart contract integration
- [ ] Expense history (persistent)
- [ ] Dashboard
- [ ] Real-time updates

## 🥋 Levels Progress

### ⚪️ Level 1 (White Belt)

- [x] Wallet connect
- [x] Wallet disconnect
- [x] Balance fetch
- [x] Expense input UI (with Stellar pubkey entry)
- [x] Debt calculation logic (equal split)
- [x] XLM transaction send
- [x] Transaction feedback UI (success/fail + hash link)

### 🟡 Level 2

- [ ] Multi-wallet support (StellarWalletsKit)
- [ ] Contract deployed (Soroban)
- [ ] Contract interaction
- [ ] Debt tracking on-chain
- [ ] Error handling (wallet missing, rejected tx, insufficient funds)

### 🟠 Level 3

- [ ] Dashboard (total expenses, debts, credits)
- [ ] Expense history
- [ ] Debt minimization logic
- [ ] Tests added (3+)
- [ ] 1-minute demo video

### 🟢 Level 4

- [ ] Group expenses (multi-user)
- [ ] Auto-settlement smart contract
- [ ] Real-time feed
- [ ] CI/CD pipeline
- [ ] Mobile-responsive UI

## 📊 Current Status

**Level 1 Complete** ✅

All core features for Level 1 are implemented:
- Freighter wallet connect/disconnect with auto-reconnect
- XLM balance fetching with live refresh
- Expense creation with manual Stellar public key entry
- Equal split calculation with live preview
- XLM payment transactions signed via Freighter
- Transaction success/failure feedback with StellarExpert links
- State persistence via localStorage
- Premium green & black UI with glassmorphism and animations

## 🧱 Next Steps

1. Initialize git repository and push to GitHub
2. Create meaningful commit history (5+ commits)
3. Begin Level 2: Multi-wallet support & Soroban integration

## 🛠️ Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Blockchain**: Stellar Testnet (Horizon API)
- **Wallet**: Freighter (`@stellar/freighter-api`)
- **SDK**: `@stellar/stellar-sdk`
- **Notifications**: react-hot-toast
- **Icons**: Lucide React
