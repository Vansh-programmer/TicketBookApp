import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  ensureUserProfile,
  isEmailAdmin,
  subscribeToUserProfile,
} from '../services/adminCatalog';

const SessionContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(auth?.currentUser || null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return () => {};
    }

    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      unsubscribeProfile();

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        await ensureUserProfile(nextUser);
      } catch (error) {
        console.error('Unable to sync user profile:', error);
      }

      unsubscribeProfile = subscribeToUserProfile(
        nextUser.uid,
        (nextProfile) => {
          setProfile(
            nextProfile || {
              email: nextUser.email || '',
              role: isEmailAdmin(nextUser.email) ? 'admin' : 'user',
            },
          );
          setLoading(false);
        },
        (error) => {
          console.error('Unable to subscribe to user profile:', error);
          setProfile({
            email: nextUser.email || '',
            role: isEmailAdmin(nextUser.email) ? 'admin' : 'user',
          });
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAdmin: profile?.role === 'admin' || isEmailAdmin(user?.email),
    }),
    [loading, profile, user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => useContext(SessionContext);
