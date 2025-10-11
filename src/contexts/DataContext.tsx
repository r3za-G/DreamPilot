import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { getUserDreamPatterns } from '../services/dreamAnalysisService';
import { calculateLevel } from '../data/levels';
import { getUserXP } from '../utils/xpManager';

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
  name: string;
  email: string;
  level: number;
  xp: number;
  totalXP: number;
  currentStreak: number;
  lastDreamDate: string;
  createdAt: string;
};

type DataContextType = {
  dreams: Dream[];
  userData: UserData | null;
  completedLessons: number[];
  dreamPatterns: any;
  loading: boolean;
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadAllData();
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        refreshDreams(),
        refreshUserData(),
        refreshLessons(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshDreams = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const dreamsQuery = query(
        collection(db, 'dreams'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(dreamsQuery);
      const dreamsData: Dream[] = [];

      querySnapshot.forEach((doc) => {
        dreamsData.push({
          id: doc.id,
          ...doc.data(),
        } as Dream);
      });

      setDreams(dreamsData);

      // Also refresh patterns when dreams change
      const patterns = await getUserDreamPatterns(user.uid);
      setDreamPatterns(patterns);
    } catch (error) {
      console.error('Error refreshing dreams:', error);
    }
  };

  const refreshUserData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      
      // Get XP from the XP manager (stored separately)
      const totalXP = await getUserXP(user.uid);
      const level = calculateLevel(totalXP);
      
      setUserData({
        name: data.name || 'Dreamer',
        email: user.email || '',
        level: level,
        xp: totalXP, // This is actually total XP
        totalXP: totalXP,
        currentStreak: data.currentStreak || 0,
        lastDreamDate: data.lastDreamDate || '',
        createdAt: data.createdAt || '',
      });
    }
  } catch (error) {
    console.error('Error refreshing user data:', error);
  }
};


  const refreshLessons = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { LESSONS } = require('../data/lessons');
      const completed: number[] = [];

      for (const lesson of LESSONS) {
        const progressDoc = await getDoc(
          doc(db, 'users', user.uid, 'lessonProgress', `lesson_${lesson.id}`)
        );

        if (progressDoc.exists() && progressDoc.data().completed) {
          completed.push(lesson.id);
        }
      }

      setCompletedLessons(completed);
    } catch (error) {
      console.error('Error refreshing lessons:', error);
    }
  };

  const refreshData = async () => {
    await loadAllData();
  };

  return (
    <DataContext.Provider
      value={{
        dreams,
        userData,
        completedLessons,
        dreamPatterns,
        loading,
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
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
