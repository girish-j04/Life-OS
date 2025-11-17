import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDarkMode } from '@/hooks/useDarkMode';

export function DarkModeToggle() {
  const { darkMode, setDarkMode } = useDarkMode();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setDarkMode(!darkMode)}
      className="p-3 rounded-xl bg-white dark:bg-dark-surface border-4 border-neutral-900 dark:border-dark-border shadow-te-brutal dark:shadow-none hover:shadow-te-brutal-lg transition-all"
      aria-label="Toggle dark mode"
    >
      <motion.div
        initial={false}
        animate={{ rotate: darkMode ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {darkMode ? (
          <Moon className="h-5 w-5 text-primary-blue" />
        ) : (
          <Sun className="h-5 w-5 text-primary-orange" />
        )}
      </motion.div>
    </motion.button>
  );
}
