import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if there's a hash fragment (OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasAuthParams = hashParams.has('access_token') || hashParams.has('error');

        if (hasAuthParams) {
          // Wait for Supabase to process the OAuth callback
          const { data, error: authError } = await supabase.auth.getSession();

          if (authError) {
            console.error('Auth error:', authError);
            setError(authError.message);
            setTimeout(() => navigate('/login', { replace: true }), 3000);
            return;
          }

          if (data.session) {
            // Session established successfully
            navigate('/dashboard', { replace: true });
          } else {
            // No session but no error - wait a bit and retry
            setTimeout(async () => {
              const { data: retryData } = await supabase.auth.getSession();
              if (retryData.session) {
                navigate('/dashboard', { replace: true });
              } else {
                setError('Could not establish session. Please try again.');
                setTimeout(() => navigate('/login', { replace: true }), 2000);
              }
            }, 1000);
          }
        } else {
          // No auth params, redirect to login
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('An unexpected error occurred');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-dark-base dark:via-dark-surface dark:to-dark-base flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="bg-primary-red/10 p-8 rounded-3xl border-4 border-primary-red dark:border-primary-red shadow-te-brutal">
            <AlertCircle className="h-16 w-16 text-primary-red mx-auto" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-dark-text">
              Authentication Failed
            </h2>
            <p className="text-neutral-600 dark:text-dark-subtext font-mono text-sm">
              {error}
            </p>
            <p className="text-neutral-500 dark:text-dark-subtext text-xs">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
