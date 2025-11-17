import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];

interface GoogleAuthContextType {
  isSignedIn: boolean;
  isInitialized: boolean;
  user: any | null; // Using any due to gapi types
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<any | null>(null); // Using any due to gapi types

  useEffect(() => {
    const initClient = () => {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            clientId: CLIENT_ID,
            scope: SCOPES,
            discoveryDocs: DISCOVERY_DOCS,
          });

          const authInstance = gapi.auth2.getAuthInstance();

          // Listen for sign-in state changes
          authInstance.isSignedIn.listen((signedIn: boolean) => {
            setIsSignedIn(signedIn);
            if (signedIn) {
              setUser(authInstance.currentUser.get());
            } else {
              setUser(null);
            }
          });

          // Set initial sign-in state
          const currentSignedIn = authInstance.isSignedIn.get();
          setIsSignedIn(currentSignedIn);
          if (currentSignedIn) {
            setUser(authInstance.currentUser.get());
          }

          setIsInitialized(true);
        } catch (error) {
          console.error('Error initializing Google Auth:', error);
          setIsInitialized(true);
        }
      });
    };

    initClient();
  }, []);

  const signIn = async () => {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signIn();
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return (
    <GoogleAuthContext.Provider value={{ isSignedIn, isInitialized, user, signIn, signOut }}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within GoogleAuthProvider');
  }
  return context;
}
