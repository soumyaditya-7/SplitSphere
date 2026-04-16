/**
 * LiveActivityFeed — Green Belt: Real-time event stream display
 * Shows incoming Stellar transactions in real-time as they appear on-chain.
 */
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ExternalLink, CheckCircle, XCircle, Wifi } from 'lucide-react';

export default function LiveActivityFeed({ events, isStreaming }) {
  if (!isStreaming && events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Live Activity</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
            }`}
          />
          <span className="text-xs text-gray-500">
            {isStreaming ? 'Streaming' : 'Offline'}
          </span>
          <Wifi className={`w-3 h-3 ${isStreaming ? 'text-emerald-400' : 'text-gray-600'}`} />
        </div>
      </div>

      {/* Events list */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-4">
              Waiting for on-chain activity...
            </p>
          ) : (
            events.slice(0, 8).map((ev) => (
              <motion.div
                key={ev.hash}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-between p-2.5 bg-dark-800/60 rounded-xl border border-dark-600/50"
              >
                <div className="flex items-center gap-2">
                  {ev.successful ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs text-gray-300 font-mono">
                      {ev.hash.slice(0, 8)}...{ev.hash.slice(-6)}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      {ev.operationCount} op{ev.operationCount !== 1 ? 's' : ''} ·{' '}
                      {new Date(ev.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${ev.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-emerald-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
