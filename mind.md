# 🧠 Stellar Split Project Mind Map

## 📌 Idea

Stellar Split is a blockchain-based expense splitting app that allows users to split bills and settle debts using XLM on Stellar. It's decentralized, fast, and transparent — no middlemen, no delays.

## 🚀 Features

- [x] Wallet connection (Freighter)
- [x] Balance display
- [x] Add expense (manual public key entry)
- [x] Debt calculation (split equally)
- [x] Send XLM (settle debt)
- [x] Multi-wallet support (Freighter, xBull, Albedo, LOBSTR, Hana, Rabet)
- [x] Smart contract integration (Soroban)
- [x] Error handling (3 types: WalletNotFound, TransactionRejected, InsufficientBalance)
- [x] Transaction status tracking (Building → Signing → Submitting → Success/Failed)
- [x] On-chain expense recording
- [ ] Expense history (persistent)
- [ ] Dashboard
- [ ] Real-time updates

## 🥋 Levels Progress

### ⚪️ Level 1 (White Belt) ✅

- [x] Wallet connect
- [x] Wallet disconnect
- [x] Balance fetch
- [x] Expense input UI (with Stellar pubkey entry)
- [x] Debt calculation logic (equal split)
- [x] XLM transaction send
- [x] Transaction feedback UI (success/fail + hash link)

### 🟡 Level 2 (Yellow Belt) ✅

- [x] Multi-wallet support (custom wallet modal with 6 wallets)
- [x] Contract deployed (Soroban SplitTracker)
- [x] Contract interaction (record_expense, get_expense, get_expense_count)
- [x] Debt tracking on-chain
- [x] Error handling (wallet missing, rejected tx, insufficient funds)
- [x] Transaction status UI (Building → Signing → Submitting → Success/Failed)
- [x] Contract dashboard panel
- [x] On-chain activity feed

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

**Level 2 Complete** ✅

All core features for Level 2 are implemented:
- Multi-wallet selection modal (Freighter, xBull, Albedo, LOBSTR, Hana, Rabet)
- Soroban SplitTracker contract deployed on testnet
- Contract called from frontend (record, read, count)
- 3 error types with color-coded UI banners
- Real-time transaction status tracking with animated step indicators
- Contract dashboard with on-chain expense count
- Activity feed of recorded on-chain transactions
- Premium green & black UI with glassmorphism and animations

## 🧱 Next Steps

1. Deploy updated version to Vercel
2. Take screenshots for README (wallet modal, contract panel)
3. Create meaningful git commits
4. Begin Level 3: Dashboard & testing

## 🛠️ Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Blockchain**: Stellar Testnet (Horizon API + Soroban RPC)
- **Wallet**: Multi-wallet (Freighter, xBull, Albedo, etc.)
- **Smart Contract**: Soroban (Rust)
- **SDK**: `@stellar/stellar-sdk`
- **Notifications**: react-hot-toast
- **Icons**: Lucide React
