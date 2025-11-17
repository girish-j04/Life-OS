import { Home, Calendar, CheckSquare, StickyNote, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'HOME', color: 'bg-primary-orange' },
  { path: '/calendar', icon: Calendar, label: 'CALENDAR', color: 'bg-primary-blue' },
  { path: '/tasks', icon: CheckSquare, label: 'TASKS', color: 'bg-primary-green' },
  { path: '/notes', icon: StickyNote, label: 'NOTES', color: 'bg-primary-purple' },
  { path: '/finance', icon: TrendingUp, label: 'MONEY', color: 'bg-primary-red' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-surface border-t-4 border-neutral-900 dark:border-dark-border shadow-te-brutal dark:shadow-none transition-colors">
      <div className="flex justify-around items-center h-20 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-1"
            >
              {/* Icon Container */}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  'relative flex items-center justify-center transition-all',
                  isActive ? 'scale-110' : 'scale-100'
                )}
              >
                {/* Active Indicator - Teenage Engineering style */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={cn(
                      'absolute inset-0 rounded-xl border-3 border-neutral-900 shadow-te-brutal-sm',
                      item.color
                    )}
                    style={{ width: '48px', height: '48px' }}
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                  />
                )}

                {/* Icon */}
                <div className={cn(
                  'relative z-10 p-3 rounded-xl transition-colors',
                  isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                )}>
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
              </motion.div>

              {/* Label - Monospace uppercase */}
              <span className={cn(
                'text-[10px] font-mono font-bold uppercase tracking-wider transition-colors',
                isActive ? 'text-neutral-900 dark:text-dark-text' : 'text-neutral-400 dark:text-dark-subtext'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
