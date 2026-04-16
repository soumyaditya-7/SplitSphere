import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  FileText,
  DollarSign,
  Users,
  Loader2,
  Check,
} from 'lucide-react';
import { isValidStellarAddress, sendPayment } from '../services/stellar';
import { TX_STATUS, parseError } from '../services/errors';
import TransactionStatus from './TransactionStatus';
import ErrorBanner from './ErrorBanner';
import toast from 'react-hot-toast';

export default function ExpenseForm({ walletAddress, connectedWallet, onPaymentComplete }) {
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitWays, setSplitWays] = useState(2);
  const [receiver, setReceiver] = useState('');
  
  const [txStatus, setTxStatus] = useState(TX_STATUS.IDLE);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const [error, setError] = useState(null);

  const myShare = totalAmount && splitWays ? (parseFloat(totalAmount) / splitWays) : 0;

  const handleSettle = async (e) => {
    e.preventDefault();
    if (!description.trim() || !totalAmount || myShare <= 0) {
      toast.error('Please enter valid amount and description');
      return;
    }
    if (!isValidStellarAddress(receiver.trim())) {
      toast.error('Invalid receiver address');
      return;
    }
    if (receiver.trim() === walletAddress) {
      toast.error('You cannot pay yourself');
      return;
    }

    setTxStatus(TX_STATUS.IDLE);
    setTxHash(null);
    setTxError(null);
    setError(null);

    try {
      const amountStr = myShare.toFixed(7);
      const result = await sendPayment(
        walletAddress,
        receiver.trim(),
        amountStr,
        `Split: ${description.slice(0, 20)}`,
        connectedWallet || 'freighter',
        setTxStatus
      );

      setTxHash(result.hash);
      setTxStatus(TX_STATUS.SUCCESS);
      
      onPaymentComplete({
         id: Date.now(),
         description,
         totalAmount: parseFloat(totalAmount),
         paidAmount: parseFloat(amountStr),
         receiver: receiver.trim(),
         txHash: result.hash,
         timestamp: new Date().toISOString()
      });
      toast.success('Payment sent successfully!');
      
      // Reset form on success
      setDescription('');
      setTotalAmount('');
      setReceiver('');
      setSplitWays(2);
      
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed);
      setTxError(parsed.userMessage || parsed.message);
      setTxStatus(TX_STATUS.FAILED);
      toast.error(parsed.userMessage || 'Transaction failed');
    }
  };

  if (!walletAddress) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {txStatus !== TX_STATUS.IDLE && (
        <TransactionStatus
          status={txStatus}
          txHash={txHash}
          error={txError}
          label="Payment"
          onReset={() => {
            setTxStatus(TX_STATUS.IDLE);
            setTxHash(null);
            setTxError(null);
          }}
        />
      )}

      <form onSubmit={handleSettle} className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Instant Split & Pay</h2>
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
            <FileText className="w-4 h-4" />
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner with John"
            className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            required
          />
        </div>

        {/* Amount & Split Ways */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <DollarSign className="w-4 h-4" />
              Total Bill (XLM)
            </label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="any"
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <Users className="w-4 h-4" />
              Split Ways
            </label>
            <select
              value={splitWays}
              onChange={(e) => setSplitWays(Number(e.target.value))}
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>
                  {n === 1 ? 'Just me' : `Split smoothly by ${n}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Card */}
        <AnimatePresence>
          {myShare > 0 && (
             <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-5 overflow-hidden"
             >
                <div className="flex flex-col items-center justify-center text-center">
                   <p className="text-sm text-gray-400">Your Share to Pay</p>
                   <p className="text-3xl font-bold text-emerald-400 mt-1">
                     {myShare.toFixed(4)} <span className="text-sm text-gray-500">XLM</span>
                   </p>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Receiver */}
        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
            <Send className="w-4 h-4" />
            Send to Wallet Address
          </label>
          <input
            type="text"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            placeholder="G... (Receiver's Public Key)"
            className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono text-sm"
            required
          />
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={txStatus === TX_STATUS.BUILDING || txStatus === TX_STATUS.SIGNING || txStatus === TX_STATUS.SUBMITTING}
          className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-dark-950 font-bold text-base transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400/30 hover:border-emerald-300/60 disabled:opacity-50 cursor-pointer"
        >
          {(txStatus === TX_STATUS.BUILDING || txStatus === TX_STATUS.SIGNING || txStatus === TX_STATUS.SUBMITTING) ? (
            <>
               <Loader2 className="w-5 h-5 animate-spin" />
               Processing...
            </>
          ) : (
            <>
               <Check className="w-5 h-5" />
               Settle Payment Now
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
