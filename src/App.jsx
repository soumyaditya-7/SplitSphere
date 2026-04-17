import { useState, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import BalanceCard from './components/BalanceCard';
import ExpenseForm from './components/ExpenseForm';
import ContractPanel from './components/ContractPanel';
import LiveActivityFeed from './components/LiveActivityFeed';
import AnimatedBackground from './components/AnimatedBackground';
import { useEventStream } from './hooks/useEventStream';
import { signTransactionWithWallet } from './services/stellar';


function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('stellarSplit_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [liveEvents, setLiveEvents] = useState([]);
  const balanceRef = useRef(null);

  // Real-time event stream
  const handleNewTx = useCallback((tx) => {
    setLiveEvents(prev => [tx, ...prev].slice(0, 20));
  }, []);
  const { isStreaming } = useEventStream(walletAddress, handleNewTx);

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





  // Open wallet modal from hero
  const handleHeroConnect = useCallback(() => {
    // Trigger the navbar's modal by simulating a click
    // We'll handle this by lifting the modal state
    document.querySelector('[data-connect-wallet]')?.click();
  }, []);

  // Create a sign function bound to the current wallet
  const signTransaction = useCallback(
    async (xdr, opts) => {
      return signTransactionWithWallet(connectedWallet || 'freighter', xdr, opts);
    },
    [connectedWallet]
  );

  return (
    <div className="min-h-screen w-full bg-dark-950 relative">
      <AnimatedBackground />
      <Navbar
        walletAddress={walletAddress}
        setWalletAddress={setWalletAddress}
        connectedWallet={connectedWallet}
        setConnectedWallet={setConnectedWallet}
      />

      <main className="w-full px-4 sm:px-6 py-8">
        {walletAddress ? (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            <BalanceCard
              ref={balanceRef}
              walletAddress={walletAddress}
            />
            <ExpenseForm
              walletAddress={walletAddress}
              connectedWallet={connectedWallet}
              signTransaction={signTransaction}
              onPaymentComplete={handleAddExpense}
            />
            <LiveActivityFeed
              events={liveEvents}
              isStreaming={isStreaming}
            />
            <ContractPanel
              walletAddress={walletAddress}
              signTransaction={signTransaction}
              expenses={expenses}
            />
          </div>
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
          · Soroban Smart Contracts · Testnet
        </p>
      </footer>
    </div>
  );
}

export default App;
