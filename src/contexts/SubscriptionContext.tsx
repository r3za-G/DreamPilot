import React, { createContext, useContext, useState, useEffect } from "react";
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesPackage,
} from "react-native-purchases";
import { Platform, Alert } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Constants from "expo-constants";

interface SubscriptionContextType {
  isPremium: boolean;
  loading: boolean;
  checkSubscriptionStatus: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  getOfferings: () => Promise<any>;
}

const IOS_API_KEY = Constants.expoConfig?.extra?.revenueCatApiKey ?? "";

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      console.log("🚀 Initializing RevenueCat...");

      // Set debug logs FIRST
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      // Configure with API key
      if (Platform.OS === "ios") {
        await Purchases.configure({
          apiKey: IOS_API_KEY,
        });
      } else if (Platform.OS === "android") {
        // Skip Android for now
        setLoading(false);
        return;
      }

      console.log("✅ RevenueCat configured successfully");

      // NOW check subscription (after configure completes)
      await checkSubscriptionStatus();
    } catch (error) {
      console.error("❌ Error initializing purchases:", error);
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      console.log("🔍 Checking subscription status...");

      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in");
        setIsPremium(false);
        setLoading(false);
        return;
      }

      // Get customer info from RevenueCat
      const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
      console.log("📦 Customer Info:", customerInfo);

      // Check if premium entitlement is active
      const hasPremium =
        customerInfo.entitlements.active["premium"] !== undefined;
      console.log("💎 Has Premium:", hasPremium);

      setIsPremium(hasPremium);

      // Sync with Firebase
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { isPremium: hasPremium }, { merge: true });

      setLoading(false);
    } catch (error) {
      console.error("❌ Error checking subscription:", error);
      setIsPremium(false);
      setLoading(false);
    }
  };

  const getOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error("Error fetching offerings:", error);
      return null;
    }
  };

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const hasPremium =
        customerInfo.entitlements.active["premium"] !== undefined;

      setIsPremium(hasPremium);

      // Update Firebase
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { isPremium: hasPremium }, { merge: true });
      }

      return hasPremium;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log("User cancelled purchase");
      } else {
        console.error("Purchase error:", error);
      }
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasPremium =
        customerInfo.entitlements.active["premium"] !== undefined;

      setIsPremium(hasPremium);

      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { isPremium: hasPremium }, { merge: true });
      }

      return hasPremium;
    } catch (error) {
      console.error("Restore error:", error);
      return false;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        loading,
        checkSubscriptionStatus,
        purchasePackage,
        restorePurchases,
        getOfferings,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
};
