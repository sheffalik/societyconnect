import { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const GRAY = "#6B7280";

const GUARD_ACCOUNTS = [
  { guardId: "GUARD1", password: "guard123" },
  { guardId: "GUARD2", password: "guard456" },
];

export default function GuardLoginScreen() {
  const [guardId, setGuardId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    setError("");

    if (guardId.trim() === "" || password.trim() === "") {
      setError("Please enter Guard ID and Password.");
      return;
    }

    const matchedGuard = GUARD_ACCOUNTS.find(
      (account) =>
        account.guardId.toLowerCase() === guardId.trim().toLowerCase() &&
        account.password === password
    );

    if (!matchedGuard) {
      setError("Wrong Guard ID or Password.");
      return;
    }

    alert("Login Successful!");
    router.replace("/add-visitor");
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FFFFFF", "#F3F8F4"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons
            name="shield-checkmark-outline"
            size={35}
            color={NAVY}
          />
        </View>

        <Text style={styles.title}>Security Guard</Text>
        <Text style={styles.subtitle}>
          Login to continue
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Guard ID</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Guard ID"
          autoCapitalize="none"
          value={guardId}
          onChangeText={(text) => {
            setGuardId(text);
            setError("");
          }}
        />

        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Password"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError("");
          }}
        />

        {error !== "" && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  header: {
    alignItems: "center",
    marginBottom: 40,
  },

  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EAF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: NAVY,
  },

  subtitle: {
    color: GRAY,
    marginTop: 6,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    elevation: 5,
  },

  label: {
    fontWeight: "600",
    marginBottom: 8,
    color: NAVY,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    backgroundColor: "#FAFAFA",
  },

  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 14,
    fontWeight: "600",
  },

  button: {
    backgroundColor: GREEN,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});