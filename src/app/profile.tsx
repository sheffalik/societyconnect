import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebase/auth";
import { db } from "../firebase/firestore";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const RED = "#D93B3B";
const GRAY = "#6B7280";

export default function ProfileScreen() {
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [flatNumber, setFlatNumber] = useState("");

  const [familyList, setFamilyList] = useState<string[]>([]);
  const [familyName, setFamilyName] = useState("");

  const [vehicleList, setVehicleList] = useState<string[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setTimeout(() => {
          router.replace("/login");
        }, 0);
        return;
      }
      setUid(user.uid);
      loadProfile(user.uid);
    });

    return () => unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const snap = await getDoc(doc(db, "members", userId));
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name ? data.name : "");
        setFlatNumber(data.flatNumber ? data.flatNumber : "");
        setFamilyList(data.familyMembers ? data.familyMembers : []);
        setVehicleList(data.vehicles ? data.vehicles : []);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const addFamilyMember = async () => {
    if (familyName.trim() === "") return;
    const updatedList = [...familyList, familyName.trim()];
    setFamilyList(updatedList);
    setFamilyName("");
    await setDoc(doc(db, "members", uid), { familyMembers: updatedList }, { merge: true });
  };

  const removeFamilyMember = async (index: number) => {
    const updatedList = familyList.filter((_, i) => i !== index);
    setFamilyList(updatedList);
    await setDoc(doc(db, "members", uid), { familyMembers: updatedList }, { merge: true });
  };

  const addVehicle = async () => {
    if (vehicleNumber.trim() === "") return;
    const updatedList = [...vehicleList, vehicleNumber.trim()];
    setVehicleList(updatedList);
    setVehicleNumber("");
    await setDoc(doc(db, "members", uid), { vehicles: updatedList }, { merge: true });
  };

  const removeVehicle = async (index: number) => {
    const updatedList = vehicleList.filter((_, i) => i !== index);
    setVehicleList(updatedList);
    await setDoc(doc(db, "members", uid), { vehicles: updatedList }, { merge: true });
  };

  const logout = async () => {
    console.log("=== LOGOUT BUTTON CLICKED ===");
    try {
      await signOut(auth);
      console.log("=== SIGN OUT SUCCESSFUL ===");
    } catch (error: any) {
      console.error("=== SIGN OUT ERROR ===", error);
      Alert.alert("Logout Error", error?.message || "Failed to log out");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NAVY} />
      </View>
    );
  }

  const initial = name.trim() === "" ? "U" : name.trim()[0].toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBlock}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.flat}>{flatNumber}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={18} color={GREEN} />
            <Text style={styles.sectionTitle}>Family Members</Text>
          </View>

          <View style={styles.chipWrap}>
            {familyList.map((item, index) => (
              <View style={styles.chip} key={index}>
                <Text style={styles.chipText}>{item}</Text>
                <TouchableOpacity onPress={() => removeFamilyMember(index)}>
                  <Ionicons name="close" size={14} color={RED} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Add family member"
              value={familyName}
              onChangeText={setFamilyName}
            />
            <TouchableOpacity style={styles.addButton} onPress={addFamilyMember}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car-outline" size={18} color={NAVY} />
            <Text style={styles.sectionTitle}>Vehicles</Text>
          </View>

          <View style={styles.chipWrap}>
            {vehicleList.map((item, index) => (
              <View style={styles.chip} key={index}>
                <Text style={styles.chipText}>{item}</Text>
                <TouchableOpacity onPress={() => removeVehicle(index)}>
                  <Ionicons name="close" size={14} color={RED} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Add vehicle number"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
            />
            <TouchableOpacity style={styles.addButton} onPress={addVehicle}>
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={18} color={GREEN} />
            <Text style={styles.sectionTitle}>Help & Support</Text>
          </View>

          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => Linking.openURL("tel:+911234567890")}
          >
            <Ionicons name="call-outline" size={18} color={NAVY} />
            <Text style={styles.supportText}>Call Support: +91 12345 67890</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => Linking.openURL("mailto:support@yoursociety.com")}
          >
            <Ionicons name="mail-outline" size={18} color={NAVY} />
            <Text style={styles.supportText}>Email: support@yoursociety.com</Text>
          </TouchableOpacity>
        </View>

        {/* Outer wrapper to ensure click events reach touchable component */}
        <View style={{ zIndex: 999, elevation: 5, marginTop: 12 }}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
            activeOpacity={0.6}
          >
            <Ionicons name="log-out-outline" size={18} color={RED} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  page: { padding: 20, paddingBottom: 120 },

  headerBlock: { alignItems: "center", marginBottom: 24 },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: NAVY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 30 },
  name: { fontSize: 20, fontWeight: "700", color: "#111827" },
  flat: { fontSize: 13, color: GRAY, marginTop: 2 },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F2F4",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: { fontSize: 13, color: "#111827" },

  addRow: { flexDirection: "row", gap: 8 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#F7F8FA",
  },
  addButton: {
    backgroundColor: NAVY,
    borderRadius: 8,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  supportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  supportText: { fontSize: 14, color: "#111827" },

  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FDEEEE",
    borderRadius: 12,
    padding: 16,
  },
  logoutText: { color: RED, fontWeight: "bold" },
});