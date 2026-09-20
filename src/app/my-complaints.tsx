import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { auth } from "../firebase/auth";
import { db } from "../firebase/firestore";

// Theme Colors
const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const ORANGE = "#F59E0B";
const BLUE = "#2563EB";
const RED = "#DC2626";

type Complaint = {
  id: string;
  complaintId: string;
  category: string;
  description: string;
  status: string;
  createdAt?: any;
};

export default function MyComplaintsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selected, setSelected] = useState<string>("All");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Fetch complaints submitted by the logged-in user sorted by date
    const q = query(
      collection(db, "complaints"),
      where("memberId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Complaint[];
      setComplaints(data);
    });

    return () => unsub();
  }, []);

  const filteredComplaints =
    selected === "All"
      ? complaints
      : complaints.filter((item) => item.status === selected);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return ORANGE;
      case "In Progress":
        return BLUE;
      case "Resolved":
        return GREEN;
      default:
        return RED;
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#ffffff", "#F5F9F6"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Complaints</Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {["All", "Pending", "In Progress", "Resolved"].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setSelected(item)}
            style={[
              styles.tab,
              selected === item && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                selected === item && { color: "#fff" },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Complaints List */}
      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/complaint-details",
                params: { id: item.id },
              })
            }
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardTitle}>{item.category}</Text>
                <Text style={styles.cardId}>{item.complaintId}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <Text numberOfLines={2} style={styles.description}>
              {item.description}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={70}
              color="#C7CBD4"
            />
            <Text style={styles.emptyTitle}>No Complaints Found</Text>
            <Text style={styles.emptySubtitle}>
              Raise your first complaint.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: NAVY,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#ECECEC",
  },
  activeTab: {
    backgroundColor: NAVY,
  },
  tabText: {
    color: NAVY,
    fontWeight: "600",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: NAVY,
  },
  cardId: {
    color: "#777",
    marginTop: 4,
  },
  description: {
    marginTop: 10,
    color: "#555",
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 120,
  },
  emptyTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "700",
    color: NAVY,
  },
  emptySubtitle: {
    marginTop: 6,
    color: "#777",
  },
});