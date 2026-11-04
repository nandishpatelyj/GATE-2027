import React from 'react';
import { Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BadgeDefinition } from '../types';

interface BadgeToastProps {
  badge: BadgeDefinition | null;
  onDismiss: () => void;
}

export const BadgeToast: React.FC<BadgeToastProps> = ({ badge, onDismiss }) => {
  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-teal-500/50 rounded-xl p-4 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
                Milestone Unlocked · {badge.days}-Day Streak
              </p>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {badge.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {badge.description}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss milestone notification"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
