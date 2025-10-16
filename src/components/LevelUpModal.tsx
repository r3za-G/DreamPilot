import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../theme/design";
import { getLevelTier } from "../data/levels";
import Button from "./Button";

const { width, height } = Dimensions.get("window");

type LevelUpModalProps = {
  visible: boolean;
  level: number;
  onClose: () => void;
};

export default function LevelUpModal({
  visible,
  level,
  onClose,
}: LevelUpModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiRef = useRef<any>(null);

  const tier = getLevelTier(level);

  useEffect(() => {
    if (visible) {
      // Trigger confetti
      setTimeout(() => {
        confettiRef.current?.start();
      }, 300);

      // Animate modal entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ConfettiCannon
          count={200}
          origin={{ x: width / 2, y: -10 }}
          fadeOut
          ref={confettiRef}
          autoStart={false}
          fallSpeed={2500}
        />

        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Level Badge */}
          <View style={[styles.levelBadge, { backgroundColor: tier.color }]}>
            <Text style={styles.levelNumber}>{level}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Level Up!</Text>

          {/* Tier Name */}
          <Text style={[styles.tierName, { color: tier.color }]}>
            {tier.title}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            You've reached Level {level}! Keep up the amazing progress on your
            lucid dreaming journey.
          </Text>

          {/* Celebration Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={48} color={COLORS.warning} />
          </View>

          {/* Continue Button */}
          <Button title="Continue" onPress={onClose} style={styles.button} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  container: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxxl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  levelBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  tierName: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  button: {
    width: "100%",
  },
});
