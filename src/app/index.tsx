import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";

const NAVY = "#14213D";
const DARK_BLUE = "#1E3A8A";
const GREEN = "#2E9E5B";
const DARK_GREEN = "#1B7A45";
const GRAY = "#6B7280";
const BG_TINT = "#F3F8F4";
const screenWidth = Dimensions.get("window").width;

const LOGO_SIZE = screenWidth * 0.28;
const TITLE_SIZE = Math.min(screenWidth * 0.086, 34);

export default function SplashScreen() {
  // useState variable to control whether content is visible yet
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 300);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.blob, { top: -70, left: -70, backgroundColor: "#B9D6FF" }]} />
      <View style={[styles.blob, { top: -50, right: -90, backgroundColor: "#CFF0D8" }]} />
      <View style={[styles.blob, { bottom: 100, left: -100, backgroundColor: "#DCEBFF" }]} />
      <View style={[styles.blob, { bottom: -80, right: -70, backgroundColor: "#D6F2DD" }]} />

      {/* Dot-grid accents - plain nested Views, no extra library */}
      <View style={[styles.dotGrid, { top: screenWidth * 0.32, left: 20 }]} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, row) => (
          <View key={row} style={styles.dotRow}>
            {Array.from({ length: 4 }).map((_, col) => (
              <View key={col} style={[styles.dot, { backgroundColor: "#AFC6E8" }]} />
            ))}
          </View>
        ))}
      </View>
      <View style={[styles.dotGrid, { bottom: screenWidth * 0.55, right: 20 }]} pointerEvents="none">
        {Array.from({ length: 6 }).map((_, row) => (
          <View key={row} style={styles.dotRow}>
            {Array.from({ length: 4 }).map((_, col) => (
              <View key={col} style={[styles.dot, { backgroundColor: "#A9DDBB" }]} />
            ))}
          </View>
        ))}
      </View>
      <View style={[styles.content, { opacity: visible ? 1 : 0 }]}>
        <View style={styles.logoShadowWrap}>
          <Image
            source={require("../../assets/logo.png")}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          <Text style={{ color: DARK_BLUE }}>Society </Text>
          <Text style={{ color: DARK_GREEN }}>Connect</Text>
        </Text>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: NAVY }]} />
          <Text style={styles.tagline}>Better Living, Stronger Together</Text>
          <View style={[styles.dividerLine, { backgroundColor: DARK_GREEN }]} />
        </View>

        <Text style={styles.subtitle}>
          A smart platform to connect residents, manage society activities and build a stronger community.
        </Text>
      </View>

      <View style={[styles.bottomSection, { opacity: visible ? 1 : 0 }]}>
        <TouchableOpacity
          onPress={() => router.push("/role-selection")}
          activeOpacity={0.85}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_TINT,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  blob: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.45,
  },
  dotGrid: {
    position: "absolute",
    opacity: 0.55,
  },
  dotRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 14,
  },
  logoShadowWrap: {
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontSize: TITLE_SIZE,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  dividerLine: {
    width: 26,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: "600",
    color: NAVY,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: GRAY,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 19,
    maxWidth: 300,
  },
  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: 36,
    alignItems: "center",
  },
  button: {
    backgroundColor: DARK_GREEN,
    paddingVertical: 17,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});