import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebase/auth";
import { db } from "../firebase/firestore";

// Theme Colors
const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const GRAY = "#6B7280";
const RED = "#D93B3B";
const ORANGE = "#E07A1F";

type PaymentMethod = "UPI" | "Card" | "Net Banking" | "Wallet";

type PaymentRecord = {
  id: string;
  amount: number;
  month: string;
  status: "paid" | "failed";
  date: string;
  time: string;
  method: PaymentMethod;
  transactionId: string;
};

type MemberData = {
  name: string;
  flatNumber: string;
  societyName: string;
  maintenanceDue: number;
  dueDate: string;
};

const PAYMENT_METHODS: { key: PaymentMethod; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "UPI", icon: "phone-portrait-outline", color: GREEN },
  { key: "Card", icon: "card-outline", color: "#2E6FD9" },
  { key: "Net Banking", icon: "business-outline", color: "#5B4FCF" },
  { key: "Wallet", icon: "wallet-outline", color: ORANGE },
];

export default function Maintenance() {
  const [member, setMember] = useState<MemberData | null>(null);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [payModalVisible, setPayModalVisible] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);
  const [processing, setProcessing] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      fetchData(user.uid);
    });
    return unsubscribe;
  }, []);

  const fetchData = async (uid: string) => {
    try {
      const memberRef = doc(db, "members", uid);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        setMember(memberSnap.data() as MemberData);
      }

      const paymentsRef = collection(db, "members", uid, "payments");
      const q = query(paymentsRef, orderBy("date", "desc"));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const records = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
        setHistory(records);
      } else {
        setHistory(DEMO_HISTORY);
      }
    } catch (error) {
      console.log("Maintenance fetch error:", error);
      setHistory(DEMO_HISTORY);
    } finally {
      setLoading(false);
    }
  };

  const openPayModal = () => setPayModalVisible(true);
  const closePayModal = () => {
    setPayModalVisible(false);
    setProcessing(null);
  };

  const handlePay = async (method: PaymentMethod) => {
    setProcessing(method);
    try {
      if (method === "UPI") {
        const amount = member?.maintenanceDue ?? 0;
        const upiUrl = `upi://pay?pa=society@upi&pn=SocietyMaintenance&am=${amount}&cu=INR`;
        const supported = await Linking.canOpenURL(upiUrl);
        if (supported) {
          await Linking.openURL(upiUrl);
        } else {
          alert("No UPI app found. Please install Google Pay / PhonePe / Paytm.");
        }
      } else {
        alert(`Redirecting to ${method} payment gateway...`);
      }
    } finally {
      setProcessing(null);
      closePayModal();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={NAVY} />
        <Text style={styles.loadingText}>Loading Maintenance Details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Maintenance</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            {/* Current Due Section */}
            <View style={styles.dueCard}>
              <View style={styles.dueIconCircle}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.dueLabel}>Current Due</Text>
                <Text style={styles.dueAmount}>
                  ₹{(member?.maintenanceDue ?? 0).toLocaleString("en-IN")}
                </Text>
                <Text style={styles.dueDate}>Due {member?.dueDate ?? "—"}</Text>
              </View>
            </View>

            {/* Pay Now Button */}
            <TouchableOpacity style={styles.payNowButton} onPress={openPayModal} activeOpacity={0.85}>
              <Ionicons name="card" size={18} color="#fff" />
              <Text style={styles.payNowButtonText}>Pay Now</Text>
            </TouchableOpacity>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Payment History</Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.historyRow,
              index !== history.length - 1 && styles.historyRowDivider,
            ]}
            onPress={() => setSelectedRecord(item)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.historyIconCircle,
                { backgroundColor: item.status === "paid" ? `${GREEN}1A` : `${RED}1A` },
              ]}
            >
              <Ionicons
                name={item.status === "paid" ? "checkmark-circle-outline" : "close-circle-outline"}
                size={20}
                color={item.status === "paid" ? GREEN : RED}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.historyMonth}>{item.month}</Text>
              <Text style={styles.historySubtitle}>
                {item.date} · {item.method}
              </Text>
            </View>
            <Text
              style={[
                styles.historyAmount,
                { color: item.status === "paid" ? "#111827" : RED },
              ]}
            >
              ₹{item.amount.toLocaleString("en-IN")}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={GRAY} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={36} color={GRAY} />
            <Text style={styles.emptyText}>No payment history yet</Text>
          </View>
        }
      />

      <Modal visible={payModalVisible} transparent animationType="slide" onRequestClose={closePayModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Choose Payment Method</Text>
            <Text style={styles.sheetAmount}>
              ₹{(member?.maintenanceDue ?? 0).toLocaleString("en-IN")}
            </Text>

            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={styles.methodRow}
                onPress={() => handlePay(m.key)}
                disabled={processing !== null}
              >
                <View style={[styles.methodIconCircle, { backgroundColor: `${m.color}1A` }]}>
                  <Ionicons name={m.icon} size={20} color={m.color} />
                </View>
                <Text style={styles.methodLabel}>{m.key}</Text>
                {processing === m.key ? (
                  <ActivityIndicator size="small" color={NAVY} style={{ marginLeft: "auto" }} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={GRAY} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.sheetCancel} onPress={closePayModal}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedRecord}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailCard}>
            <View
              style={[
                styles.detailIconCircle,
                { backgroundColor: selectedRecord?.status === "paid" ? `${GREEN}1A` : `${RED}1A` },
              ]}
            >
              <Ionicons
                name={selectedRecord?.status === "paid" ? "checkmark-circle" : "close-circle"}
                size={30}
                color={selectedRecord?.status === "paid" ? GREEN : RED}
              />
            </View>
            <Text style={styles.detailAmount}>
              ₹{selectedRecord?.amount.toLocaleString("en-IN")}
            </Text>
            <Text
              style={[
                styles.detailStatus,
                { color: selectedRecord?.status === "paid" ? GREEN : RED },
              ]}
            >
              {selectedRecord?.status === "paid" ? "Payment Successful" : "Payment Failed"}
            </Text>

            <View style={styles.detailDivider} />

            <DetailRow label="Month" value={selectedRecord?.month ?? "—"} />
            <DetailRow label="Date" value={selectedRecord?.date ?? "—"} />
            <DetailRow label="Time" value={selectedRecord?.time ?? "—"} />
            <DetailRow label="Payment Method" value={selectedRecord?.method ?? "—"} />
            <DetailRow label="Transaction ID" value={selectedRecord?.transactionId ?? "—"} />

            <TouchableOpacity
              style={styles.detailCloseButton}
              onPress={() => setSelectedRecord(null)}
            >
              <Text style={styles.detailCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// Demo fallback data
const DEMO_HISTORY: PaymentRecord[] = [
  {
    id: "1",
    amount: 3500,
    month: "June 2026",
    status: "paid",
    date: "05 Jun 2026",
    time: "10:42 AM",
    method: "UPI",
    transactionId: "TXN20260605A1B2C3",
  },
  {
    id: "2",
    amount: 3500,
    month: "May 2026",
    status: "paid",
    date: "04 May 2026",
    time: "06:15 PM",
    method: "Card",
    transactionId: "TXN20260504X9Y8Z7",
  },
  {
    id: "3",
    amount: 3500,
    month: "April 2026",
    status: "paid",
    date: "03 Apr 2026",
    time: "02:30 PM",
    method: "Net Banking",
    transactionId: "TXN20260403M4N5O6",
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14, color: GRAY },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: NAVY },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

  dueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: NAVY,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    elevation: 4,
  },
  dueIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  dueLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  dueAmount: { fontWeight: "800", color: "#fff", marginTop: 2, fontSize: 28 },
  dueDate: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  payNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 8,
  },
  payNowButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  sectionHeaderRow: { marginTop: 24, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },

  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  historyRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F3",
  },
  historyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  historyMonth: { fontSize: 14, fontWeight: "700", color: "#111827" },
  historySubtitle: { fontSize: 12, color: GRAY, marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: "700" },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 14, color: GRAY },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#111827", textAlign: "center" },
  sheetAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: NAVY,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F3",
  },
  methodIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  methodLabel: { fontSize: 14, fontWeight: "600", color: "#111827", marginLeft: 12 },
  sheetCancel: { paddingVertical: 14, alignItems: "center", marginTop: 6 },
  sheetCancelText: { color: GRAY, fontWeight: "600", fontSize: 14 },

  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    marginHorizontal: 24,
    alignItems: "center",
  },
  detailIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  detailAmount: { fontSize: 26, fontWeight: "800", color: "#111827" },
  detailStatus: { fontSize: 13, fontWeight: "700", marginTop: 4, marginBottom: 16 },
  detailDivider: {
    height: 1,
    backgroundColor: "#F0F1F3",
    width: "100%",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 6,
  },
  detailLabel: { fontSize: 13, color: GRAY },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#111827" },
  detailCloseButton: {
    marginTop: 16,
    backgroundColor: "#F1F2F4",
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  detailCloseButtonText: { color: NAVY, fontWeight: "700", fontSize: 14 },
});