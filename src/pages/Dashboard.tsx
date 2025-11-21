import { useEffect, useState } from 'react';
import { CaptureBox } from '@/components/CaptureBox';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { storage } from '@/lib/storage';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logoLight from '@/assets/logo_light.png';
import logoDark from '@/assets/logo_dark.png';
import {
  Zap,
  Target,
  CheckCircle,
  FileText,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Dashboard() {
  const [tasksCount, setTasksCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load tasks count (incomplete only)
      const tasks = await storage.tasks.getAll();
      setTasksCount(tasks.filter(t => !t.isCompleted).length);

      // Load events count
      const events = await storage.events.getAll();
      setEventsCount(events.length);

      // Load notes count
      const notes = await storage.notes.getAll();
      setNotesCount(notes.length);

      // Load total expenses
      const transactions = await storage.transactions.getAll();
      const expenses = transactions.filter(t => t.type === 'expense');
      setTotalExpenses(expenses.reduce((sum, t) => sum + t.amount, 0));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="h-8 w-8 text-primary-orange" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg transition-colors">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header - Teenage Engineering style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-dark-surface border-4 border-neutral-900 dark:border-dark-border rounded-2xl shadow-te-brutal-sm p-3">
              <img
                src={logoLight}
                alt="LifeOS logo"
                className="h-12 md:h-16 w-auto block dark:hidden"
              />
              <img
                src={logoDark}
                alt="LifeOS logo"
                className="h-12 md:h-16 w-auto hidden dark:block"
              />
            </div>
            <div className="flex flex-col">
              <span className="sr-only">LifeOS</span>
              <p className="text-neutral-500 dark:text-dark-subtext font-mono text-sm tracking-wide">
                {format(new Date(), 'EEE, MMM d yyyy').toUpperCase()}
              </p>
            </div>
          </div>
          <DarkModeToggle />
        </motion.div>

        {/* Capture Box - Teenage Engineering brutalist style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <CaptureBox onSuccess={loadDashboardData} />
        </motion.div>

        {/* Stats Grid - Strava inspired */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: CheckCircle, label: 'Tasks', value: tasksCount, color: 'bg-primary-green', textColor: 'text-primary-green', path: '/tasks' },
            { icon: Calendar, label: 'Events', value: eventsCount, color: 'bg-primary-blue', textColor: 'text-primary-blue', path: '/calendar' },
            { icon: FileText, label: 'Notes', value: notesCount, color: 'bg-primary-purple', textColor: 'text-primary-purple', path: '/notes' },
            { icon: TrendingUp, label: 'Spent', value: `$${totalExpenses.toFixed(2)}`, color: 'bg-primary-red', textColor: 'text-primary-red', path: '/finance' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={stat.path}
                className="block bg-white dark:bg-dark-surface border-4 border-neutral-900 dark:border-dark-border rounded-2xl p-6 shadow-te-brutal cursor-pointer hover:shadow-te-brutal-lg transition-all"
              >
                <div className={`inline-flex p-3 ${stat.color} rounded-xl mb-4`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-4xl font-display font-bold mb-1 dark:text-dark-text">{stat.value}</div>
                <div className="text-sm font-mono uppercase text-neutral-600 dark:text-dark-subtext">{stat.label}</div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Today's Focus - Duolingo card style */}
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-primary-orange to-te-orange rounded-3xl p-8 text-white shadow-te-brutal dark:shadow-none"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur">
              <Target className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold">TODAY'S FOCUS</h2>
              <p className="text-white/80 font-mono text-sm">Stay on track, crush your goals</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border-2 border-white/20">
            <div className="flex items-center justify-center gap-3 text-center py-8">
              <Zap className="h-12 w-12" />
              <div>
                <p className="text-2xl font-bold mb-2">All Clear!</p>
                <p className="text-white/80">Use the capture box above to add your first item</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
