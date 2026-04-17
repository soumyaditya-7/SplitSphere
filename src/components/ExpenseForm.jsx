import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  FileText,
  DollarSign,
  Users,
  Loader2,
  Check,
  UserPlus,
  Trash2,
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
  // N-1 receiver fields: one slot per other person
  const [receivers, setReceivers] = useState(['']);

  const [txStatus, setTxStatus] = useState(TX_STATUS.IDLE);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const [error, setError] = useState(null);
  const [currentPayment, setCurrentPayment] = useState(0); // which receiver is being paid

  const myShare = totalAmount && splitWays ? (parseFloat(totalAmount) / splitWays) : 0;
  const receiverCount = splitWays - 1; // N-1 receivers

  // Resize receivers array when splitWays changes
  useEffect(() => {
    setReceivers(prev => {
      const next = Array.from({ length: receiverCount }, (_, i) => prev[i] ?? '');
      return next;
    });
  }, [receiverCount]);

  const updateReceiver = (index, value) => {
    setReceivers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSettle = async (e) => {
    e.preventDefault();

    if (!description.trim() || !totalAmount || myShare <= 0) {
      toast.error('Please enter valid amount and description');
      return;
    }

    // Validate all receiver fields (only if splitWays > 1)
    if (splitWays > 1) {
      for (let i = 0; i < receivers.length; i++) {
        const addr = receivers[i].trim();
        if (!isValidStellarAddress(addr)) {
          toast.error(`Receiver ${i + 1}: Invalid Stellar address`);
          return;
        }
        if (addr === walletAddress) {
          toast.error(`Receiver ${i + 1}: You cannot pay yourself`);
          return;
        }
      }
      // Check for duplicate receivers
      const unique = new Set(receivers.map(r => r.trim()));
      if (unique.size !== receivers.length) {
        toast.error('Duplicate receiver addresses detected');
        return;
      }
    }

    setTxStatus(TX_STATUS.IDLE);
    setTxHash(null);
    setTxError(null);
    setError(null);
    setCurrentPayment(0);

    const amountStr = myShare.toFixed(7);

    try {
      // eslint-disable-next-line react-hooks/purity
      const baseTimestamp = Date.now();

      // If split by 1 (just me), record expense without payment
      if (splitWays === 1) {
        onPaymentComplete({
          id: baseTimestamp,
          description,
          totalAmount: parseFloat(totalAmount),
          paidAmount: 0,
          receiver: walletAddress,
          txHash: null,
          timestamp: new Date().toISOString(),
        });
        toast.success('Expense recorded!');
        resetForm();
        return;
      }

      let lastHash = null;

      // Send one payment to each receiver sequentially
      for (let i = 0; i < receivers.length; i++) {
        setCurrentPayment(i + 1);
        const result = await sendPayment(
          walletAddress,
          receivers[i].trim(),
          amountStr,
          `Split: ${description.slice(0, 20)}`,
          connectedWallet || 'freighter',
          setTxStatus
        );
        lastHash = result.hash;

        onPaymentComplete({
          id: baseTimestamp + i,
          description,
          totalAmount: parseFloat(totalAmount),
          paidAmount: parseFloat(amountStr),
          receiver: receivers[i].trim(),
          txHash: result.hash,
          timestamp: new Date().toISOString(),
        });
      }

      setTxHash(lastHash);
      setTxStatus(TX_STATUS.SUCCESS);
      toast.success(`All ${receivers.length} payment${receivers.length > 1 ? 's' : ''} sent!`);
      resetForm();

    } catch (err) {
      const parsed = parseError(err);
      setError(parsed);
      setTxError(parsed.userMessage || parsed.message);
      setTxStatus(TX_STATUS.FAILED);
      toast.error(parsed.userMessage || 'Transaction failed');
    }
  };

  const resetForm = () => {
    setDescription('');
    setTotalAmount('');
    setSplitWays(2);
    setReceivers(['']);
    setCurrentPayment(0);
  };

  if (!walletAddress) return null;

  const isProcessing =
    txStatus === TX_STATUS.BUILDING ||
    txStatus === TX_STATUS.SIGNING ||
    txStatus === TX_STATUS.SUBMITTING;

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
          label={currentPayment > 0 ? `Payment ${currentPayment}/${receiverCount}` : 'Payment'}
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
          <h2 className="text-lg font-semibold text-white">Instant Split &amp; Pay</h2>
        </div>

        {/* Description */}
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
              className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Each person pays</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-0.5">
                    {myShare.toFixed(4)} <span className="text-sm text-gray-500">XLM</span>
                  </p>
                </div>
                {splitWays > 1 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Receivers</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-0.5">
                      {receiverCount} <span className="text-sm text-gray-500">people</span>
                    </p>
                  </div>
                )}
              </div>
              {splitWays > 1 && (
                <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-dark-600">
                  You will send <span className="text-emerald-400 font-medium">{myShare.toFixed(4)} XLM</span> to each of the {receiverCount} receiver{receiverCount > 1 ? 's' : ''} below
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Receiver Addresses — N-1 fields */}
        <AnimatePresence mode="sync">
          {splitWays > 1 && (
            <motion.div
              key="receivers-block"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400 pt-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Receiver Wallet Addresses
                <span className="ml-auto text-xs text-gray-600 bg-dark-700 px-2 py-0.5 rounded-full">
                  {receiverCount} of {splitWays} people
                </span>
              </label>

              {receivers.map((addr, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  className="flex items-center gap-2"
                >
                  {/* Receiver number badge */}
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                  </div>

                  <input
                    type="text"
                    value={addr}
                    onChange={(e) => updateReceiver(i, e.target.value)}
                    placeholder={`G... (Receiver ${i + 1} Public Key)`}
                    className={`flex-1 bg-dark-800 border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono text-sm ${
                      addr && !isValidStellarAddress(addr.trim())
                        ? 'border-red-500/50 focus:border-red-500/50'
                        : addr && isValidStellarAddress(addr.trim())
                        ? 'border-emerald-500/40 focus:border-emerald-500/50'
                        : 'border-dark-600 focus:border-emerald-500/50'
                    }`}
                    required
                  />

                  {/* Valid indicator */}
                  {addr && isValidStellarAddress(addr.trim()) && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  {addr && !isValidStellarAddress(addr.trim()) && (
                    <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={isProcessing}
          className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-dark-950 font-bold text-base transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-400/30 hover:border-emerald-300/60 disabled:opacity-50 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {currentPayment > 0
                ? `Sending to receiver ${currentPayment}/${receiverCount}...`
                : 'Processing...'}
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              {splitWays === 1
                ? 'Record Expense'
                : `Settle ${receiverCount} Payment${receiverCount > 1 ? 's' : ''} Now`}
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
