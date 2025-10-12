import React, { createContext, useContext, useState, useEffect } from 'react';
import Purchases, { PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import { auth, db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

type SubscriptionContextType = {
  isPremium: boolean;
  offerings: PurchasesOffering | null;
  purchasePackage: (packageToPurchase: any) => Promise<void>;
  restorePurchases: () => Promise<void>;
  loading: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  offerings: null,
  purchasePackage: async () => {},
  restorePurchases: async () => {},
  loading: true,
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      // Configure RevenueCat
      // Replace with your actual API keys from RevenueCat dashboard
      const apiKey = Platform.select({
        ios: 'YOUR_IOS_API_KEY', // Get from RevenueCat
        android: 'YOUR_ANDROID_API_KEY', // Get from RevenueCat
      });

      if (apiKey) {
        await Purchases.configure({ apiKey });
      }

      // Set user ID if logged in
      const user = auth.currentUser;
      if (user) {
        await Purchases.logIn(user.uid);
      }

      // Check subscription status
      await checkSubscriptionStatus();

      // Load offerings
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOfferings(offerings.current);
      }
    } catch (error) {
      console.error('Error initializing purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = customerInfo.entitlements.active['premium'] !== undefined;
      setIsPremium(isPro);

      // Update Firestore
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          isPremium: isPro,
          subscriptionUpdatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsPremium(false);
    }
  };

  const purchasePackage = async (packageToPurchase: any) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      const isPro = customerInfo.entitlements.active['premium'] !== undefined;
      setIsPremium(isPro);

      // Update Firestore
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          isPremium: isPro,
          subscriptionUpdatedAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
        throw error;
      }
    }
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active['premium'] !== undefined;
      setIsPremium(isPro);

      // Update Firestore
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          isPremium: isPro,
          subscriptionUpdatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        offerings,
        purchasePackage,
        restorePurchases,
        loading,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
