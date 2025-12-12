import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db as firestore } from './firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userBalance, setUserBalance] = useState({ balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 UserContext: Starting authentication check');
    
    let unsubscribeBalance = null;
    
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('🔄 UserContext: Auth state changed', user ? 'User found' : 'No user');
      setUser(user);
      
      // Clean up previous balance listener if it exists
      if (unsubscribeBalance) {
        unsubscribeBalance();
        unsubscribeBalance = null;
      }
      
      if (user) {
        try {
          // Listen to user balance changes
          const userDocRef = doc(firestore, 'users', user.uid);
          unsubscribeBalance = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setUserBalance({
                balance: data.balance || 0
              });
            } else {
              setUserBalance({ balance: 0 });
            }
          }, (error) => {
            console.log('🔄 UserContext: Firestore error, using default balance');
            setUserBalance({ balance: 0 });
          });
        } catch (error) {
          console.log('🔄 UserContext: Error accessing user data, using default balance');
          setUserBalance({ balance: 0 });
        }
      } else {
        setUserBalance({ balance: 0 });
      }
      
      console.log('🔄 UserContext: Setting loading to false');
      setLoading(false);
    });

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('🔄 UserContext: Auth timeout - setting loading to false');
      setLoading(false);
    }, 2000); // 2 second timeout - reasonable for user experience

    return () => {
      unsubscribe();
      if (unsubscribeBalance) {
        unsubscribeBalance();
      }
      clearTimeout(timeoutId);
    };
  }, []);

  const updateUserData = async (updates) => {
    if (!user) return;
    
    // If no updates provided, return early (useful for refresh calls)
    if (!updates || (typeof updates === 'object' && Object.keys(updates).length === 0)) {
      return;
    }
    
    const userDocRef = doc(firestore, 'users', user.uid);
    await updateDoc(userDocRef, updates);
  };

  const value = {
    user,
    userBalance,
    updateUserData,
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 