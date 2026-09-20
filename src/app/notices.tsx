import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

const NAVY = "#14213D";
type Notice = {
  id: string;
  title: string;
  message: string;
  createdAt: any; // Firestore Timestamp
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return "Just now";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return (
      date.toLocaleDateString() +
      " • " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "";
  }
};

export default function NoticeScreen() {
  // State to hold notices fetched from Firestore
  const [notices, setNotices] = useState<Notice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // useEffect runs once when the screen loads (side effect: listening to Firestore)
  useEffect(() => {
    console.log("Notice Listener Started");

    // field must match what admin actually saves - "createdAt", not "date"
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Notice, "id">),
        }));
        setNotices(data);
        setLoading(false);
      },
      (error) => {
        console.log("Notices listener error:", error);
        setLoading(false);
      }
    );

    // cleanup function - stop listening when screen unmounts
    return () => unsub();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#fff", "#F5F9F6"]} style={StyleSheet.absoluteFill} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#fff", "#F5F9F6"]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={NAVY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Society Notices</Text>

        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.icon}>
              <Ionicons name="notifications" size={22} color="#fff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>

              <Text numberOfLines={2} style={styles.desc}>
                {item.message}
              </Text>

              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="notifications-off" size={70} color="#C5CBD5" />
            <Text style={styles.emptyText}>No Notices Available</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },

  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: NAVY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: NAVY,
  },

  desc: {
    marginTop: 6,
    color: "#666",
    lineHeight: 21,
  },

  date: {
    marginTop: 10,
    fontSize: 12,
    color: "#999",
  },

  empty: {
    marginTop: 140,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "600",
    color: "#777",
  },
});