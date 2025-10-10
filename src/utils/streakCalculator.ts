type DreamEntry = {
  createdAt: string;
};

export const calculateStreak = (dreams: DreamEntry[]): number => {
  if (dreams.length === 0) return 0;

  // Sort dreams by date (most recent first)
  const sortedDreams = dreams.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get unique dates (ignore time, just dates)
  const uniqueDates = Array.from(
    new Set(
      sortedDreams.map(dream => {
        const date = new Date(dream.createdAt);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      })
    )
  );

  if (uniqueDates.length === 0) return 0;

  // Check if most recent dream is from today or yesterday
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

  // If most recent dream is not from today or yesterday, streak is broken
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  // Count consecutive days
  let streak = 0;
  let checkDate = new Date(today);
  
  // If today has a dream, start from today. Otherwise start from yesterday
  if (uniqueDates[0] === todayStr) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Most recent is yesterday, so streak starts at 1
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 2);
  }

  // Check backwards for consecutive days
  for (let i = 1; i < uniqueDates.length; i++) {
    const checkDateStr = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}`;
    
    if (uniqueDates[i] === checkDateStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Gap in dates, streak ends
      break;
    }
  }

  return streak;
};

export const getLongestStreak = (dreams: DreamEntry[]): number => {
  if (dreams.length === 0) return 0;

  // Sort dreams by date
  const sortedDreams = dreams.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Get unique dates
  const uniqueDates = Array.from(
    new Set(
      sortedDreams.map(dream => {
        const date = new Date(dream.createdAt);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      })
    )
  ).map(dateStr => new Date(dateStr));

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = uniqueDates[i - 1];
    const currDate = uniqueDates[i];
    
    // Calculate difference in days
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
};
