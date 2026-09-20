import { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Animated, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/auth";
import { StatusBar } from "expo-status-bar";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const GRAY = "#6B7280";

const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function MemberLoginScreen() {
  const [email, setEmail] = useState("");
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

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      showAlert("Missing Fields", "Enter the Credentials");
      return;
    }
    if (password.length === 0) {
      showAlert("Missing Password", "Enter the Password");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      router.replace("/dashboard");
    } catch (error: any) {
      console.log("Login error:", error.code, error.message);
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        showAlert("Login failed", "Email or password is incorrect.");
      } else if (error.code === "auth/user-not-found") {
        showAlert("No account found", "No account exists with this email. Please sign up.");
      } else if (error.code === "auth/invalid-email") {
        showAlert("Invalid email", "Please check the email address you entered.");
      } else {
        showAlert("Login failed", error.message);
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

      <Animated.View
        style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={styles.header}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="lock-closed-outline" size={28} color={NAVY} />
          </View>
          <Text style={styles.title}>Member Login</Text>
          <Text style={styles.subtitle}>Login to manage your society services</Text>
        </View>

        <View style={styles.body}>
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
              underlineColorAndroid="transparent"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={GRAY} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={[NAVY, GREEN]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>{loading ? "Logging in..." : "Login"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.signupRow}>
            Don't have an account?{" "}
            <Text
              style={styles.signupLink}
              onPress={() => router.push("/signup")}
            >
              Sign Up
            </Text>
          </Text>
        </View>
      </Animated.View>
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
  header: { alignItems: "center", paddingTop: 50, paddingHorizontal: 24, marginBottom: 30 },
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

  body: { paddingHorizontal: 24 },
  label: { fontSize: 13, fontWeight: "600", color: NAVY, marginBottom: 6, marginTop: 14 },
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
  
input: {
  flex: 1,
  fontSize: 15,
  color: NAVY,
  ...(Platform.OS === "web"
    ? ({
        outlineStyle: "none",
        outlineWidth: 0,
      } as any)
    : {}),
},

  loginButton: {
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
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  signupRow: { textAlign: "center", marginTop: 22, color: GRAY },
  signupLink: { color: NAVY, fontWeight: "700" },
});