import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, ViewStyle } from "react-native";
import { COLORS, RADIUS } from "../theme/design";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = RADIUS.sm,
  style,
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  // ✅ Create style object with proper typing
  const containerStyle: ViewStyle = {
    width: width as any, // Cast to any to allow string percentages
    height,
    borderRadius,
  };

  return (
    <View style={[styles.skeleton, containerStyle, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: COLORS.border,
            borderRadius,
            opacity,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
});

// Pre-built skeleton components for common use cases
export function SkeletonDreamCard() {
  return (
    <View style={cardStyles.container}>
      <SkeletonLoader height={24} width="60%" style={cardStyles.title} />
      <SkeletonLoader height={16} width="40%" style={cardStyles.date} />
      <SkeletonLoader height={60} width="100%" style={cardStyles.content} />
      <View style={cardStyles.tags}>
        <SkeletonLoader height={24} width={80} borderRadius={RADIUS.round} />
        <SkeletonLoader height={24} width={100} borderRadius={RADIUS.round} />
        <SkeletonLoader height={24} width={60} borderRadius={RADIUS.round} />
      </View>
    </View>
  );
}

export function SkeletonLessonCard() {
  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.lessonHeader}>
        <SkeletonLoader height={50} width={50} borderRadius={25} />
        <View style={cardStyles.lessonInfo}>
          <SkeletonLoader height={20} width="70%" />
          <SkeletonLoader height={16} width="50%" style={cardStyles.subtitle} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonAchievementCard() {
  return (
    <View style={cardStyles.achievementContainer}>
      <SkeletonLoader
        height={60}
        width={60}
        borderRadius={30}
        style={cardStyles.center}
      />
      <SkeletonLoader height={18} width="80%" style={cardStyles.center} />
      <SkeletonLoader height={14} width="90%" style={cardStyles.center} />
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    marginBottom: 8,
  },
  date: {
    marginBottom: 12,
  },
  content: {
    marginBottom: 12,
  },
  tags: {
    flexDirection: "row",
    gap: 8,
  },
  lessonHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  subtitle: {
    marginTop: 6,
  },
  achievementContainer: {
    width: "48%",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  center: {
    marginVertical: 8,
  },
});
