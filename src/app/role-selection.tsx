import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const GRAY = "#6B7280";

export default function RoleSelectionScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <LinearGradient colors={["#FFFFFF", "#F3F8F4"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.blob, { top: -60, right: -70, backgroundColor: "#CFF0D8" }]} />
      <View style={[styles.blob, { bottom: -60, left: -70, backgroundColor: "#DCEBFF" }]} />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="people-outline" size={30} color={NAVY} />
          </View>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Choose your role to continue</Text>
        </View>

        <View style={styles.body}>
          <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push("/login")}>
            <LinearGradient colors={[NAVY, GREEN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
              <Ionicons name="person-outline" size={26} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>I am a</Text>
              <Text style={styles.cardRole}>Member (Resident)</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={GRAY} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push("/guard-login")}>
            <LinearGradient colors={[NAVY, GREEN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
              <Ionicons name="shield-checkmark-outline" size={26} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>I am a</Text>
              <Text style={styles.cardRole}>Security Guard</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={GRAY} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => router.push("/admin-login")}>
            <LinearGradient colors={[NAVY, GREEN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
              <Ionicons name="settings-outline" size={26} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>I am a</Text>
              <Text style={styles.cardRole}>Admin</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={GRAY} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  blob: { position: "absolute", width: 200, height: 200, borderRadius: 100, opacity: 0.4 },
  header: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24, marginBottom: 36 },
  headerIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: "#EAF2FF",
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "700", color: NAVY },
  subtitle: { fontSize: 14, color: GRAY, marginTop: 6 },
  body: { paddingHorizontal: 24, gap: 14 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 18, padding: 18, gap: 14,
    shadowColor: NAVY, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 5,
  },
  iconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  cardLabel: { fontSize: 13, color: GRAY },
  cardRole: { fontSize: 16, fontWeight: "700", color: NAVY, marginTop: 2 },
});