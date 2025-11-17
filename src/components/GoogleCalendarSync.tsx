import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { syncFromGoogleCalendar } from '@/lib/calendar';
import { Calendar, RefreshCw, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GoogleCalendarSync() {
  const { isSignedIn, isInitialized, user, signIn, signOut } = useGoogleAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSignIn = async () => {
    try {
      await signIn();
      // Auto-sync after successful sign-in
      await handleSync();
    } catch (error) {
      console.error('Sign in failed:', error);
      setSyncStatus('error');
      setErrorMessage('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSyncStatus('idle');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    setErrorMessage('');

    try {
      await syncFromGoogleCalendar();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setErrorMessage('Failed to sync events. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <RefreshCw className="h-8 w-8 text-primary-blue" />
          </motion.div>
          <p className="mt-4 text-neutral-600 dark:text-dark-subtext">
            Initializing Google Calendar...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-neutral-900 dark:border-dark-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-blue" />
          Google Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSignedIn ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-dark-subtext">
              Connect your Google Calendar to automatically sync events created in LifeOS.
            </p>
            <Button
              onClick={handleSignIn}
              className="btn-te bg-primary-blue text-white w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign in with Google
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary-green/10 dark:bg-primary-green/20 rounded-xl border-2 border-primary-green">
              <CheckCircle2 className="h-5 w-5 text-primary-green flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-dark-text">
                  Connected as
                </p>
                <p className="text-sm text-neutral-600 dark:text-dark-subtext truncate">
                  {user?.getBasicProfile()?.getEmail()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="btn-te bg-primary-blue text-white flex-1"
              >
                <AnimatePresence mode="wait">
                  {syncing ? (
                    <motion.div
                      key="syncing"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                </AnimatePresence>
                {syncing ? 'Syncing...' : 'Sync Calendar'}
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="btn-te border-2 border-neutral-900 dark:border-dark-border"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <AnimatePresence>
              {syncStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 bg-primary-green/10 dark:bg-primary-green/20 rounded-xl border-2 border-primary-green"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary-green" />
                  <span className="text-sm font-medium text-primary-green">
                    Calendar synced successfully!
                  </span>
                </motion.div>
              )}

              {syncStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 bg-primary-red/10 dark:bg-primary-red/20 rounded-xl border-2 border-primary-red"
                >
                  <AlertCircle className="h-4 w-4 text-primary-red" />
                  <span className="text-sm font-medium text-primary-red">
                    {errorMessage}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
