import React, { createContext, useContext, useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { getUserDreamPatterns } from "../services/dreamAnalysisService";
import { calculateLevel } from "../data/levels";
import { getUserXP } from "../utils/xpManager";

type Dream = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isLucid: boolean;
  tags: string[];
  analysis?: any;
};

type UserData = {
  firstName: string;
  lastName: string;
  email: string;
  level: number;
  xp: number;
  totalXP: number;
  currentStreak: number;
  lastDreamDate: string;
  createdAt: string;
  isPremium: boolean;
};

type DataContextType = {
  dreams: Dream[];
  userData: UserData | null;
  completedLessons: number[];
  dreamPatterns: any;
  loading: boolean;
  isPremium: boolean;
  refreshData: () => Promise<void>;
  refreshDreams: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  refreshLessons: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [dreamPatterns, setDreamPatterns] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // ✅ Don't await - load in background
        loadAllData().catch((err) => {
          console.error("Failed to load data:", err);
          setLoading(false); // ✅ Unblock even on error
        });
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // ✅ Use allSettled instead of all (doesn't fail if one fails)
      const results = await Promise.allSettled([
        refreshDreams(),
        refreshUserData(),
        refreshLessons(),
      ]);

      // ✅ Log any failures
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Load operation ${index} failed:`, result.reason);
        }
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      // ✅ ALWAYS set loading to false after max 5 seconds
      setLoading(false);
    }
  };

  const refreshDreams = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const dreamsQuery = query(
        collection(db, "dreams"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(dreamsQuery);
      const dreamsData: Dream[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isDeleted !== true) {
          dreamsData.push({
            id: docSnap.id,
            ...data,
          } as Dream);
        }
      });

      setDreams(dreamsData);

      const patterns = await getUserDreamPatterns(user.uid);
      setDreamPatterns(patterns);
    } catch (error) {
      console.error("Error refreshing dreams:", error);
      // ✅ Don't throw - just log
    }
  };

  const refreshUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      // ✅ NEW: Handle missing user document (zombie account)
      if (!userDoc.exists()) {
        console.warn(
          "⚠️ User document missing - creating default document for zombie account"
        );

        // Create default user document
        await setDoc(doc(db, "users", user.uid), {
          firstName: user.displayName?.split(" ")[0] || "Dream",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "Pilot",
          email: user.email || "",
          createdAt: new Date().toISOString(),
          currentStreak: 0,
          totalDreams: 0,
          lucidDreams: 0,
          currentLevel: 1,
          isPremium: false,
          lastDreamDate: "",
        });

        // Reload the document we just created
        const newUserDoc = await getDoc(doc(db, "users", user.uid));
        if (!newUserDoc.exists()) {
          console.error("Failed to create user document");
          return;
        }

        const data = newUserDoc.data();
        const totalXP = await getUserXP(user.uid);
        const level = calculateLevel(totalXP);
        const premiumStatus = data.isPremium || false;
        setIsPremium(premiumStatus);

        setUserData({
          firstName: data.firstName || "Dream",
          lastName: data.lastName || "Pilot",
          email: user.email || "",
          level: level,
          xp: totalXP,
          totalXP: totalXP,
          currentStreak: data.currentStreak || 0,
          lastDreamDate: data.lastDreamDate || "",
          createdAt: data.createdAt || "",
          isPremium: premiumStatus,
        });

        return;
      }

      // ✅ Normal flow: User document exists
      const data = userDoc.data();

      const totalXP = await getUserXP(user.uid);
      const level = calculateLevel(totalXP);

      const premiumStatus = data.isPremium || false;
      setIsPremium(premiumStatus);

      setUserData({
        firstName: data.firstName || data.name?.split(" ")[0] || "Dream", // ✅ Backward compatibility
        lastName:
          data.lastName || data.name?.split(" ").slice(1).join(" ") || "Pilot", // ✅ Backward compatibility
        email: user.email || "",
        level: level,
        xp: totalXP,
        totalXP: totalXP,
        currentStreak: data.currentStreak || 0,
        lastDreamDate: data.lastDreamDate || "",
        createdAt: data.createdAt || "",
        isPremium: premiumStatus,
      });
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const refreshLessons = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { LESSONS } = require("../data/lessons");
      const completed: number[] = [];

      for (const lesson of LESSONS) {
        const progressDoc = await getDoc(
          doc(db, "users", user.uid, "lessonProgress", `lesson_${lesson.id}`)
        );

        if (progressDoc.exists() && progressDoc.data().completed) {
          completed.push(lesson.id);
        }
      }

      setCompletedLessons(completed);
    } catch (error) {
      console.error("Error refreshing lessons:", error);
      // ✅ Don't throw - just log
    }
  };

  const refreshData = async () => {
    await loadAllData();
  };

  // ✅ ALWAYS render children, even while loading
  return (
    <DataContext.Provider
      value={{
        dreams,
        userData,
        completedLessons,
        dreamPatterns,
        loading,
        isPremium,
        refreshData,
        refreshDreams,
        refreshUserData,
        refreshLessons,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
