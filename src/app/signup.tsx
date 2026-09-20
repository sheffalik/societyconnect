import { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Animated, ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth } from "../firebase/auth";
import { db } from "../firebase/firebaseConfig";
import { StatusBar } from "expo-status-bar";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const GRAY = "#6B7280";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [societyName, setSocietyName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSignup = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (!name.trim() || !flatNumber.trim() || !societyName.trim()) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

      await setDoc(doc(db, "members", userCred.user.uid), {
        name: name.trim(),
        flatNumber: flatNumber.trim(),
        societyName: societyName.trim(),
        maintenanceDue: 0,
        dueDate: "N/A",
      });

      router.replace("/dashboard");
    } catch (error: any) {
      console.log("Signup error:", error.code, error.message);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Account exists", "This email is already registered. Please login instead.");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Invalid email", "Please check the email address you entered.");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Weak password", "Password must be at least 6 characters.");
      } else {
        Alert.alert("Signup failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <LinearGradient colors={["#FFFFFF", "#F3F8F4"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, { top: -70, right: -80, backgroundColor: "#CFF0D8" }]} />
      <View style={[styles.blob, { bottom: -70, left: -80, backgroundColor: "#DCEBFF" }]} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Animated.View
          style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <View style={styles.header}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="person-add-outline" size={28} color={NAVY} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join your society community</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>Flat Number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g. A-204"
                placeholderTextColor="#9CA3AF"
                value={flatNumber}
                onChangeText={setFlatNumber}
              />
            </View>

            <Text style={styles.label}>Society Name</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Green Meadows"
                placeholderTextColor="#9CA3AF"
                value={societyName}
                onChangeText={setSocietyName}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={GRAY} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={[NAVY, GREEN]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signupButton}
              >
                <Text style={styles.signupButtonText}>{loading ? "Creating account..." : "Sign Up"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.loginRow}>
              Already have an account?{" "}
              <Text style={styles.loginLink} onPress={() => router.replace("/login")}>
                Login
              </Text>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden" },
  blob: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.35,
  },
  header: { alignItems: "center", paddingTop: 50, paddingHorizontal: 24, marginBottom: 24 },
  headerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: "700", color: NAVY },
  subtitle: { fontSize: 13, color: GRAY, marginTop: 6 },

  body: { paddingHorizontal: 24, paddingBottom: 30 },
  label: { fontSize: 13, fontWeight: "600", color: NAVY, marginBottom: 6, marginTop: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 8,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  input: { flex: 1, fontSize: 15, color: NAVY },

  signupButton: {
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  signupButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  loginRow: { textAlign: "center", marginTop: 22, color: GRAY },
  loginLink: { color: NAVY, fontWeight: "700" },
});