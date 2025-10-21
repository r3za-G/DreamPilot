import React, { createContext, useContext, useState, useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
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
import { COLORS } from "../theme/design";

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
  initialLoadComplete: boolean; // ✅ ADD THIS
  isPremium: boolean;
  refreshData: () => Promise<void>;
  refreshDreams: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  refreshLessons: () => Promise<void>;
  showLevelUpModal: boolean;
  newLevel: number;
  triggerLevelUp: (level: number) => void;
  dismissLevelUp: () => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [dreamPatterns, setDreamPatterns] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [newLevel, setNewLevel] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await loadAllData();
      } else {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    });

    return unsubscribe;
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      await Promise.all([refreshDreams(), refreshUserData(), refreshLessons()]);

      setInitialLoadComplete(true);
    } catch (error) {
      console.error("Error loading data:", error);
      setInitialLoadComplete(true);
    } finally {
      setLoading(false);
    }
  };

  const triggerLevelUp = (level: number) => {
    setNewLevel(level);
    setShowLevelUpModal(true);
  };

  const dismissLevelUp = async () => {
    setShowLevelUpModal(false);
    await refreshUserData();
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
    }
  };

  const refreshUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // ✅ Force fetch from Firebase (not cache)
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        console.warn("⚠️ User document missing - creating default document");

        await setDoc(doc(db, "users", user.uid), {
          firstName: user.displayName?.split(" ")[0] || "Dream",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "Pilot",
          email: user.email || "",
          createdAt: new Date().toISOString(),
          currentStreak: 0,
          totalDreams: 0,
          lucidDreams: 0,
          level: 1,
          totalXP: 0,
          isPremium: false,
          lastDreamDate: "",
        });

        const newUserDoc = await getDoc(doc(db, "users", user.uid));
        if (!newUserDoc.exists()) {
          console.error("Failed to create user document");
          return;
        }

        const data = newUserDoc.data();
        const premiumStatus = data.isPremium || false;
        setIsPremium(premiumStatus);

        setUserData({
          firstName: data.firstName || "Dream",
          lastName: data.lastName || "Pilot",
          email: user.email || "",
          level: data.level || 1, // ✅ Read directly from document
          xp: data.totalXP || 0, // ✅ Read directly from document
          totalXP: data.totalXP || 0, // ✅ Read directly from document
          currentStreak: data.currentStreak || 0,
          lastDreamDate: data.lastDreamDate || "",
          createdAt: data.createdAt || "",
          isPremium: premiumStatus,
        });

        return;
      }

      const data = userDoc.data();
      const premiumStatus = data.isPremium || false;
      setIsPremium(premiumStatus);

      // ✅ Read level and totalXP directly from the document
      // Your xpManager already updates these fields
      const level = data.level || calculateLevel(data.totalXP || 0);
      const totalXP = data.totalXP || 0;

      console.log(
        "🔄 Refreshed user data - Level:",
        level,
        "TotalXP:",
        totalXP
      ); // ✅ Debug log

      setUserData({
        firstName: data.firstName || data.name?.split(" ")[0] || "Dream",
        lastName:
          data.lastName || data.name?.split(" ").slice(1).join(" ") || "Pilot",
        email: user.email || "",
        level: level, // ✅ Use the level from document
        xp: totalXP, // ✅ Use totalXP from document
        totalXP: totalXP, // ✅ Use totalXP from document
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

      const lessonProgressCollection = collection(
        db,
        "users",
        user.uid,
        "lessonProgress"
      );

      const progressSnapshot = await getDocs(lessonProgressCollection);

      const completed: number[] = [];
      progressSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.completed && data.lessonId !== undefined) {
          completed.push(data.lessonId);
        }
      });

      setCompletedLessons(completed);
    } catch (error) {
      console.error("Error refreshing lessons:", error);
    }
  };

  const refreshData = async () => {
    await loadAllData();
  };

  if (!initialLoadComplete) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text
          style={{
            color: COLORS.textSecondary,
            marginTop: 16,
            fontSize: 16,
          }}
        >
          Loading DreamPilot...
        </Text>
      </View>
    );
  }

  return (
    <DataContext.Provider
      value={{
        dreams,
        userData,
        completedLessons,
        dreamPatterns,
        loading,
        initialLoadComplete,
        isPremium,
        refreshData,
        refreshDreams,
        refreshUserData,
        refreshLessons,
        showLevelUpModal,
        newLevel,
        triggerLevelUp,
        dismissLevelUp,
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
