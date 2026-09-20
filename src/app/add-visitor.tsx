import { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firestore";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const GRAY = "#6B7280";

export default function AddVisitorScreen() {
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [flat, setFlat] = useState("");
  const [sending, setSending] = useState(false);


  const [flatModalVisible, setFlatModalVisible] = useState(false);
  const [allFlats, setAllFlats] = useState<string[]>([]); //
  const [flatSearch, setFlatSearch] = useState("");
  const [loadingFlats, setLoadingFlats] = useState(false);

  useEffect(() => {
    const fetchFlats = async () => {
      setLoadingFlats(true);
      try {
        const snapshot = await getDocs(collection(db, "members"));
        const flatSet = new Set<string>(); // ✅ typed Set
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.flatNumber) {
            flatSet.add(data.flatNumber.trim());
          }
        });
     
        const sortedFlats = Array.from(flatSet).sort();
        setAllFlats(sortedFlats);
      } catch (error) {
        console.log("Failed to fetch flats:", error);
      } finally {
        setLoadingFlats(false);
      }
    };

    fetchFlats();
  }, []);

  const filteredFlats = allFlats.filter((f) =>
    f.toLowerCase().includes(flatSearch.toLowerCase())
  );

  const handleSelectFlat = (selectedFlat: string) => { // ✅ typed parameter
    setFlat(selectedFlat);
    setFlatSearch("");
    setFlatModalVisible(false);
  };

  const handleSend = async () => {
    if (
      visitorName === "" ||
      phone === "" ||
      purpose === "" ||
      flat === ""
    ) {
      Alert.alert("Missing Details", "Please fill all required fields.");
      return;
    }

    setSending(true);
    try {
      
      const membersQuery = query(
        collection(db, "members"),
        where("flatNumber", "==", flat.trim())
      );
      const membersSnapshot = await getDocs(membersQuery);

      if (membersSnapshot.empty) {
        Alert.alert(
          "Invalid Flat Number",
          `No member found for Flat ${flat.trim()}. Please select a valid flat.`
        );
        setSending(false);
        return;
      }

      await addDoc(collection(db, "visitorRequests"), {
        visitorName: visitorName.trim(),
        phoneNumber: phone.trim(),
        purpose: purpose.trim(),
        vehicleNumber: vehicle.trim() || null,
        flatNumber: flat.trim(),
        requestedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "pending",
      });

      Alert.alert(
        "Success",
        `Visitor request sent to Flat ${flat.trim()}.`
      );

      setVisitorName("");
      setPhone("");
      setPurpose("");
      setVehicle("");
      setFlat("");
    } catch (error) {
      console.log("Failed to send visitor request:", error);
      Alert.alert("Something went wrong", "Could not send the request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FFFFFF", "#F3F8F4"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="person-add-outline"
              size={34}
              color={NAVY}
            />
          </View>

          <Text style={styles.title}>Add Visitor</Text>

          <Text style={styles.subtitle}>
            Enter visitor details below
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Visitor Name *</Text>
          <TextInput
            placeholder="Enter visitor name"
            style={styles.input}
            value={visitorName}
            onChangeText={setVisitorName}
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Purpose *</Text>
          <TextInput
            placeholder="Friend / Delivery / Guest"
            style={styles.input}
            value={purpose}
            onChangeText={setPurpose}
          />

          <Text style={styles.label}>Vehicle Number</Text>
          <TextInput
            placeholder="Optional"
            style={styles.input}
            value={vehicle}
            onChangeText={setVehicle}
          />

          <Text style={styles.label}>Flat Number *</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setFlatModalVisible(true)}
          >
            <Text style={{ color: flat ? "#000" : "#999" }}>
              {flat || "Select flat number"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="send"
                  color="#fff"
                  size={20}
                />

                <Text style={styles.buttonText}>
                  Send Request
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Flat Picker Modal */}
      <Modal
        visible={flatModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFlatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Flat Number</Text>
              <TouchableOpacity onPress={() => setFlatModalVisible(false)}>
                <Ionicons name="close" size={26} color={NAVY} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Search flat number..."
              style={styles.searchInput}
              value={flatSearch}
              onChangeText={setFlatSearch}
              autoFocus
            />

            {loadingFlats ? (
              <ActivityIndicator color={GREEN} style={{ marginTop: 20 }} />
            ) : filteredFlats.length === 0 ? (
              <Text style={styles.noResultText}>No matching flats found</Text>
            ) : (
              <FlatList
                data={filteredFlats}
                keyExtractor={(item) => item}
                style={{ marginTop: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.flatItem}
                    onPress={() => handleSelectFlat(item)}
                  >
                    <Ionicons name="home-outline" size={18} color={NAVY} />
                    <Text style={styles.flatItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },

  header: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 25,
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
    fontSize: 26,
    fontWeight: "700",
    color: NAVY,
  },

  subtitle: {
    color: GRAY,
    marginTop: 5,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 5,
  },

  label: {
    fontWeight: "600",
    color: NAVY,
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
  },

  button: {
    marginTop: 30,
    backgroundColor: GREEN,
    borderRadius: 12,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "75%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: NAVY,
  },

  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FAFAFA",
  },

  noResultText: {
    textAlign: "center",
    color: GRAY,
    marginTop: 20,
  },

  flatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  flatItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: NAVY,
  },
});