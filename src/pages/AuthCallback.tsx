import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the OAuth callback automatically
    // Just show a loading state and redirect to dashboard
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-dark-base dark:via-dark-surface dark:to-dark-base flex items-center justify-center">
      <div className="text-center space-y-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="inline-block"
        >
          <div className="bg-gradient-to-br from-primary-orange to-primary-purple p-8 rounded-3xl border-4 border-neutral-900 dark:border-dark-border shadow-te-brutal">
            <Sparkles className="h-16 w-16 text-white" />
          </div>
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-dark-text">
            Signing you in...
          </h2>
          <p className="text-neutral-600 dark:text-dark-subtext font-mono text-sm">
            Setting up your workspace
          </p>
        </div>
      </div>
    </div>
  );
}
