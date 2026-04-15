import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Receipt,
  Users,
  DollarSign,
  FileText,
  UserPlus,
} from 'lucide-react';
import { isValidStellarAddress, truncateAddress } from '../services/stellar';
import toast from 'react-hot-toast';

export default function ExpenseForm({ walletAddress, onAddExpense }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [participants, setParticipants] = useState(['']);
  const [isOpen, setIsOpen] = useState(false);

  const addParticipantField = () => {
    setParticipants([...participants, '']);
  };

  const removeParticipant = (index) => {
    if (participants.length <= 1) return;
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index, value) => {
    const updated = [...participants];
    updated[index] = value;
    setParticipants(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Filter and validate participant addresses
    const validParticipants = participants.filter((p) => p.trim());
    if (validParticipants.length === 0) {
      toast.error('Add at least one participant');
      return;
    }

    const invalidAddresses = validParticipants.filter(
      (p) => !isValidStellarAddress(p.trim())
    );

    if (invalidAddresses.length > 0) {
      toast.error(`Invalid Stellar address detected. Check your entries.`);
      return;
    }

    // Check no duplicates and not self
    const uniqueParticipants = [...new Set(validParticipants.map((p) => p.trim()))];
    if (uniqueParticipants.includes(walletAddress)) {
      toast.error("You can't add yourself as a participant");
      return;
    }

    // Split equally: amount / (participants + payer)
    const totalPeople = uniqueParticipants.length + 1; // +1 for the payer
    const sharePerPerson = parsedAmount / totalPeople;

    const expense = {
      id: Date.now(),
      description: description.trim(),
      totalAmount: parsedAmount,
      payer: walletAddress,
      participants: uniqueParticipants,
      sharePerPerson,
      timestamp: new Date().toISOString(),
      settled: {},
    };

    onAddExpense(expense);
    toast.success('Expense added!');

    // Reset form
    setDescription('');
    setAmount('');
    setParticipants(['']);
    setIsOpen(false);
  };

  if (!walletAddress) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(true)}
          className="w-full glass-card glass-card-hover rounded-2xl p-5 flex items-center justify-center gap-3 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-semibold text-lg">Add New Expense</span>
        </motion.button>
      )}

      {/* Form */}
      <AnimatePresence>
        {isOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="glass-card rounded-2xl p-6 space-y-5 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">New Expense</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-300 text-sm cursor-pointer"
              >
                Cancel
              </button>
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
                placeholder="e.g. Dinner at Pizza Hub"
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Amount field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <DollarSign className="w-4 h-4" />
                Total Amount (XLM)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-lg font-medium"
              />
            </div>

            {/* Participants */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <Users className="w-4 h-4" />
                Participants (Stellar Public Keys)
              </label>

              <AnimatePresence>
                {participants.map((p, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={p}
                      onChange={(e) => updateParticipant(index, e.target.value)}
                      placeholder={`G... (Participant ${index + 1})`}
                      className="flex-1 bg-dark-800 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-mono"
                    />
                    {participants.length > 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeParticipant(index)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addParticipantField}
                className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add another participant
              </motion.button>
            </div>

            {/* Preview */}
            {amount && participants.filter((p) => p.trim()).length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4"
              >
                <p className="text-sm text-gray-400">
                  Split between{' '}
                  <span className="text-emerald-400 font-medium">
                    {participants.filter((p) => p.trim()).length + 1} people
                  </span>{' '}
                  →{' '}
                  <span className="text-white font-semibold">
                    {(
                      parseFloat(amount) /
                      (participants.filter((p) => p.trim()).length + 1)
                    ).toFixed(4)}{' '}
                    XLM
                  </span>{' '}
                  each
                </p>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-dark-950 font-semibold text-sm transition-all glow-green cursor-pointer"
            >
              Add Expense
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
