import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import logoLight from '@/assets/logo_light.png';
import logoDark from '@/assets/logo_dark.png';

export function Login() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-dark-base dark:via-dark-surface dark:to-dark-base flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center space-y-8">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
              className="inline-block"
            >
              <div className="bg-white dark:bg-dark-surface p-4 rounded-3xl border-4 border-neutral-900 dark:border-dark-border shadow-te-brutal">
                <img
                  src={logoLight}
                  alt="LifeOS logo"
                  className="h-16 w-auto md:h-20 block dark:hidden"
                />
                <img
                  src={logoDark}
                  alt="LifeOS logo"
                  className="h-16 w-auto md:h-20 hidden dark:block"
                />
              </div>
            </motion.div>
            <div>
              <h1 className="sr-only">LifeOS</h1>
              <p className="text-xl text-neutral-600 dark:text-dark-subtext font-medium">
                Your Life, Organized by AI
              </p>
            </div>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            <div className="bg-white dark:bg-dark-surface border-4 border-neutral-900 dark:border-dark-border rounded-3xl shadow-te-brutal dark:shadow-none p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-bold text-neutral-900 dark:text-dark-text">
                  Welcome Back
                </h2>
                <p className="text-neutral-600 dark:text-dark-subtext">
                  Sign in to access your personal command center
                </p>
              </div>

              {/* Decorative Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-neutral-200 dark:border-dark-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-dark-surface px-4 text-neutral-500 dark:text-dark-subtext font-mono">
                    Secure OAuth 2.0
                  </span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="btn-te w-full h-14 text-lg bg-primary-blue hover:bg-primary-blue/90 text-white group relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                />
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="h-5 w-5" />
                      </motion.div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      {/* Google Logo SVG */}
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </Button>

              {/* Privacy Notice */}
              <p className="text-xs text-center text-neutral-500 dark:text-dark-subtext">
                By signing in, you agree to sync your calendar and store data securely.
                <br />
                <span className="font-mono">End-to-end encrypted • GDPR compliant</span>
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-neutral-200 dark:border-dark-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-orange">AI</div>
                  <div className="text-xs text-neutral-600 dark:text-dark-subtext font-mono">
                    Powered
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-green">∞</div>
                  <div className="text-xs text-neutral-600 dark:text-dark-subtext font-mono">
                    Storage
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-blue">24/7</div>
                  <div className="text-xs text-neutral-600 dark:text-dark-subtext font-mono">
                    Sync
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
