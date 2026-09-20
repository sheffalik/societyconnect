import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { auth } from "../firebase/auth";
import { db } from "../firebase/firebaseConfig";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const RED = "#D93B3B";
const GRAY = "#6B7280";

type VisitorRequest = {
  id: string;
  visitorName: string;
  phoneNumber: string;
  purpose: string;
  vehicleNumber: string | null;
  flatNumber: string;
  requestedAt: string;
  status: string;
};

export default function VisitorApprovalScreen() {
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [myFlatNumber, setMyFlatNumber] = useState<string | null>(null);

  useEffect(() => {
    console.log("Fetching my flat number");

    const fetchMyFlat = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          Alert.alert("Not Logged In", "Please login again.");
          setLoading(false);
          return;
        }

        const memberDocRef = doc(db, "members", currentUser.uid);
        const memberSnap = await getDoc(memberDocRef);

        if (!memberSnap.exists()) {
          Alert.alert("Error", "No member record found for this account.");
          setLoading(false);
          return;
        }

        const memberData = memberSnap.data();
        setMyFlatNumber(memberData.flatNumber);
      } catch (error) {
        console.log("Failed to fetch member flat:", error);
        Alert.alert("Error", "Could not load your flat details.");
        setLoading(false);
      }
    };

    fetchMyFlat();
  }, []);

  // Step 2: Jaise hi myFlatNumber mil jaye, uss flat ke pending visitor requests real-time suno
  useEffect(() => {
    if (!myFlatNumber) return;

    console.log("Listening for visitor requests on flat:", myFlatNumber);

    const requestsQuery = query(
      collection(db, "visitorRequests"),
      where("flatNumber", "==", myFlatNumber),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const list: VisitorRequest[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<VisitorRequest, "id">),
        }));
        setVisitors(list);
        setLoading(false);
      },
      (error) => {
        console.log("Failed to listen to visitor requests:", error);
        setLoading(false);
      }
    );

    // cleanup - stop listening when screen unmounts
    return () => unsubscribe();
  }, [myFlatNumber]);

  const acceptVisitor = async (id: string) => {
    try {
      await updateDoc(doc(db, "visitorRequests", id), {
        status: "approved",
      });
      Alert.alert("Approved", "Visitor has been approved.");
    } catch (error) {
      console.log("Failed to approve visitor:", error);
      Alert.alert("Error", "Could not approve the request.");
    }
  };

  const declineVisitor = async (id: string) => {
    try {
      await updateDoc(doc(db, "visitorRequests", id), {
        status: "declined",
      });
      Alert.alert("Declined", "Visitor request has been declined.");
    } catch (error) {
      console.log("Failed to decline visitor:", error);
      Alert.alert("Error", "Could not decline the request.");
    }
  };

  const renderVisitor = ({ item }: { item: VisitorRequest }) => (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="person-outline" size={28} color={NAVY} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.visitorName}</Text>
          <Text style={styles.purpose}>{item.purpose}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={18} color={GREEN} />
        <Text style={styles.info}>{item.phoneNumber}</Text>
      </View>

      {!!item.vehicleNumber && (
        <View style={styles.infoRow}>
          <Ionicons name="car-outline" size={18} color={GREEN} />
          <Text style={styles.info}>{item.vehicleNumber}</Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={18} color={GREEN} />
        <Text style={styles.info}>{item.requestedAt}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => declineVisitor(item.id)}
        >
          <Ionicons name="close-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptVisitor(item.id)}
        >
          <Ionicons name="checkmark-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Visitor Approval</Text>

        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator
          color={GREEN}
          size="large"
          style={{ marginTop: 100 }}
        />
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => item.id}
          renderItem={renderVisitor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="checkmark-circle-outline"
                size={80}
                color={GREEN}
              />
              <Text style={styles.emptyTitle}>No Pending Requests</Text>
              <Text style={styles.emptySubtitle}>
                New visitor requests will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: NAVY,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EAF7EF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: NAVY,
  },

  purpose: {
    marginTop: 4,
    color: GREEN,
    fontWeight: "600",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  info: {
    marginLeft: 10,
    color: "#444",
    fontSize: 15,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
  },

  declineButton: {
    flex: 1,
    backgroundColor: RED,
    padding: 14,
    borderRadius: 12,
    marginRight: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  acceptButton: {
    flex: 1,
    backgroundColor: GREEN,
    padding: 14,
    borderRadius: 12,
    marginLeft: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 15,
  },

  empty: {
    marginTop: 120,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 15,
    color: NAVY,
  },
  emptySubtitle: {
    marginTop: 8,
    color: GRAY,
    fontSize: 15,
    textAlign: "center",
  },
});