import { useState, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import BalanceCard from './components/BalanceCard';
import ExpenseForm from './components/ExpenseForm';
import SettlementList from './components/SettlementList';
import { connectWallet, isFreighterInstalled } from './services/stellar';
import toast from 'react-hot-toast';

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('stellarSplit_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const balanceRef = useRef(null);

  // Persist expenses to localStorage
  const saveExpenses = useCallback((newExpenses) => {
    setExpenses(newExpenses);
    localStorage.setItem('stellarSplit_expenses', JSON.stringify(newExpenses));
  }, []);

  const handleAddExpense = useCallback(
    (expense) => {
      const updated = [expense, ...expenses];
      saveExpenses(updated);
    },
    [expenses, saveExpenses]
  );

  const handleSettled = useCallback(
    (expenseId, participant) => {
      const updated = expenses.map((exp) => {
        if (exp.id === expenseId) {
          return {
            ...exp,
            settled: { ...exp.settled, [participant]: true },
          };
        }
        return exp;
      });
      saveExpenses(updated);
    },
    [expenses, saveExpenses]
  );

  const handleDeleteExpense = useCallback(
    (expenseId) => {
      const updated = expenses.filter((exp) => exp.id !== expenseId);
      saveExpenses(updated);
      toast.success('Expense deleted');
    },
    [expenses, saveExpenses]
  );

  const handleHeroConnect = useCallback(async () => {
    const installed = await isFreighterInstalled();
    if (!installed) {
      toast.error('Freighter wallet not detected. Please install it first.');
      window.open('https://www.freighter.app/', '_blank');
      return;
    }
    try {
      const pubKey = await connectWallet();
      setWalletAddress(pubKey);
      localStorage.setItem('stellarSplit_wallet', pubKey);
      toast.success('Wallet connected!');
    } catch (err) {
      toast.error(err.message || 'Failed to connect wallet');
    }
  }, []);

  const handleRefreshBalance = useCallback(() => {
    // Trigger a re-render of BalanceCard by updating a key or similar
    // The BalanceCard will refetch on its own via its effect
    setWalletAddress((prev) => prev); // no-op to keep it simple; BalanceCard uses its own effect
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 bg-grid">
      <Navbar
        walletAddress={walletAddress}
        setWalletAddress={setWalletAddress}
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {walletAddress ? (
          <>
            <BalanceCard
              ref={balanceRef}
              walletAddress={walletAddress}
            />
            <ExpenseForm
              walletAddress={walletAddress}
              onAddExpense={handleAddExpense}
            />
            <SettlementList
              expenses={expenses}
              walletAddress={walletAddress}
              onSettled={handleSettled}
              onDeleteExpense={handleDeleteExpense}
              onRefreshBalance={handleRefreshBalance}
            />
          </>
        ) : (
          <HeroSection onConnectClick={handleHeroConnect} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-700 text-xs">
        <p>
          Stellar Split · Built on{' '}
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-500/60 hover:text-emerald-400 transition-colors"
          >
            Stellar Network
          </a>{' '}
          · Testnet
        </p>
      </footer>
    </div>
  );
}

export default App;
