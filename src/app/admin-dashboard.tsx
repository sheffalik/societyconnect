import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../firebase/firestore";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const RED = "#D93B3B";
const ORANGE = "#E19A3C";
const GRAY = "#6B7280";
const LIGHT = "#F6F8FB";

const WORKERS = [
  "Ramesh Kumar (Plumber)",
  "Suresh Yadav (Electrician)",
  "Amit Singh (Cleaner)",
  "Vikram Rathi (Security)",
  "Deepak Joshi (Lift Technician)",
  "General Maintenance Staff",
];

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];

const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

type Complaint = {
  id: string;
  complaintId: string;
  memberId: string;
  email: string;
  category: string;
  subCategory: string;
  location: string;
  description: string;
  status: string;
  assignedTo: string;
  scheduledDate?: string;
  createdAt?: any;
  timeline?: { title: string; time: string }[];
  photoUrls?: string[];
};

type MemberInfo = {
  name?: string;
  flatNumber?: string;
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return "Just now";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " • " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const statusColor = (status: string) => {
  if (status === "Pending") return RED;
  if (status === "In Progress") return ORANGE;
  if (status === "Resolved") return GREEN;
  return GRAY;
};

export default function AdminDashboardScreen() {
  const [totalMembers, setTotalMembers] = useState(0);
  const [maintenanceDueTotal, setMaintenanceDueTotal] = useState(0);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [loadingMember, setLoadingMember] = useState(false);
  const [statusValue, setStatusValue] = useState("Pending");
  const [workerValue, setWorkerValue] = useState<string | null>(null);
  const [scheduleValue, setScheduleValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [workerPickerVisible, setWorkerPickerVisible] = useState(false);

  // Notice states
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  // Poll states
  const [pollModalVisible, setPollModalVisible] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");

  // Today's Schedule state
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleIcon, setScheduleIcon] = useState("calendar-outline");

  // Real-time Members stats
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "members"), (snapshot) => {
      setTotalMembers(snapshot.size);
      let dueSum = 0;
      snapshot.forEach((docSnap) => {
        dueSum += Number(docSnap.data().maintenanceDue) || 0;
      });
      setMaintenanceDueTotal(dueSum);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Complaints
  useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setComplaints(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Complaint, "id">) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, []);

  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "Pending").length;
  const filteredComplaints = activeFilter === "All" ? complaints : complaints.filter((c) => c.status === activeFilter);

  const openComplaint = async (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setStatusValue(complaint.status || "Pending");
    setWorkerValue(complaint.assignedTo || null);
    setScheduleValue(complaint.scheduledDate || "");
    setMemberInfo(null);
    setWorkerPickerVisible(false);
    setLoadingMember(true);
    try {
      const memberSnap = await getDoc(doc(db, "members", complaint.memberId));
      if (memberSnap.exists()) setMemberInfo(memberSnap.data() as MemberInfo);
    } catch (error) {
      console.log("Failed to fetch member info:", error);
    } finally {
      setLoadingMember(false);
    }
  };

  const closeModal = () => {
    setSelectedComplaint(null);
    setMemberInfo(null);
    setWorkerPickerVisible(false);
  };

  const handleSave = async () => {
    if (!selectedComplaint) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "complaints", selectedComplaint.id), {
        status: statusValue,
        assignedTo: workerValue || "",
        scheduledDate: scheduleValue.trim(),
        updatedAt: serverTimestamp(),
        timeline: arrayUnion({
          title: `Status: ${statusValue}${workerValue ? ` • Assigned to ${workerValue}` : ""}`,
          time: new Date().toISOString(),
        }),
      });
      showAlert("Updated", "Complaint has been updated successfully.");
      closeModal();
    } catch (error: any) {
      showAlert("Error", error.message || "Could not update the complaint.");
    } finally {
      setSaving(false);
    }
  };

  // Publish Schedule Item to All Members
  const publishScheduleItem = async () => {
    if (!scheduleTitle.trim() || !scheduleTime.trim()) {
      showAlert("Missing Fields", "Please enter both Event Title and Time.");
      return;
    }
    try {
      await addDoc(collection(db, "schedules"), {
        title: scheduleTitle.trim(),
        time: scheduleTime.trim(),
        icon: scheduleIcon || "calendar-outline",
        color: NAVY,
        createdAt: serverTimestamp(),
      });
      showAlert("Published", "Schedule item added to members' dashboards.");
      setScheduleTitle("");
      setScheduleTime("");
      setScheduleModalVisible(false);
    } catch (error: any) {
      showAlert("Error", error.message || "Could not add schedule item.");
    }
  };

  // Send Notice
  const sendNotice = async () => {
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      showAlert("Missing Fields", "Please fill title and message.");
      return;
    }
    try {
      await addDoc(collection(db, "notices"), {
        title: noticeTitle.trim(),
        message: noticeMessage.trim(),
        createdAt: serverTimestamp(),
      });
      showAlert("Sent", "Notice sent to all members.");
      setNoticeTitle("");
      setNoticeMessage("");
      setNoticeModalVisible(false);
    } catch (error: any) {
      showAlert("Error", error.message || "Could not send notice.");
    }
  };

  // Send Poll
  const sendPoll = async () => {
    if (!pollQuestion.trim() || !option1.trim() || !option2.trim()) {
      showAlert("Missing Fields", "Please fill question and both options.");
      return;
    }
    try {
      await addDoc(collection(db, "polls"), {
        question: pollQuestion.trim(),
        options: [option1.trim(), option2.trim()],
        votes: {},
        createdAt: serverTimestamp(),
      });
      showAlert("Sent", "Poll sent to all members.");
      setPollQuestion("");
      setOption1("");
      setOption2("");
      setPollModalVisible(false);
    } catch (error: any) {
      showAlert("Error", error.message || "Could not send poll.");
    }
  };

  const renderComplaint = ({ item }: { item: Complaint }) => (
    <TouchableOpacity style={styles.card} onPress={() => openComplaint(item)}>
      <View style={styles.cardTopRow}>
        <Text style={styles.complaintId}>{item.complaintId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.cardCategory}>{item.category} • {item.subCategory}</Text>
      <Text style={styles.cardLocation}><Ionicons name="location-outline" size={13} color={GRAY} /> {item.location}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooterRow}>
        <Text style={styles.cardMeta}>{formatDate(item.createdAt)}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {!!item.photoUrls && item.photoUrls.length > 0 && (
            <Text style={styles.cardPhotoBadge}>
              <Ionicons name="camera-outline" size={12} color={NAVY} /> {item.photoUrls.length}
            </Text>
          )}
          {!!item.assignedTo && <Text style={styles.cardAssigned} numberOfLines={1}>👷 {item.assignedTo}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={GREEN} size="large" style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item.id}
          renderItem={renderComplaint}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListHeaderComponent={
            <>
              {/* Stats grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="people-outline" size={22} color={NAVY} />
                  <Text style={styles.statValue}>{totalMembers}</Text>
                  <Text style={styles.statLabel}>Total Members</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="document-text-outline" size={22} color={NAVY} />
                  <Text style={styles.statValue}>{totalComplaints}</Text>
                  <Text style={styles.statLabel}>Total Complaints</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="alert-circle-outline" size={22} color={RED} />
                  <Text style={styles.statValue}>{pendingCount}</Text>
                  <Text style={styles.statLabel}>Pending Requests</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="cash-outline" size={22} color={GREEN} />
                  <Text style={styles.statValue}>₹{maintenanceDueTotal}</Text>
                  <Text style={styles.statLabel}>Maintenance Due</Text>
                </View>
              </View>

              {/* Today's Schedule + Notice + Poll Action Buttons */}
              <TouchableOpacity style={styles.scheduleButton} onPress={() => setScheduleModalVisible(true)}>
                <Ionicons name="calendar-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Publish Today's Schedule</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.noticeButton} onPress={() => setNoticeModalVisible(true)}>
                <Ionicons name="megaphone-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Send Notice to Members</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pollButton} onPress={() => setPollModalVisible(true)}>
                <Ionicons name="stats-chart-outline" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Create Poll for Members</Text>
              </TouchableOpacity>

              {/* Filter tabs */}
              <Text style={styles.sectionTitle}>Complaints Management</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {["All", ...STATUS_OPTIONS].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={70} color={GREEN} />
              <Text style={styles.emptyTitle}>No complaints here</Text>
            </View>
          }
        />
      )}

      {/* Complaint Detail Modal */}
      <Modal visible={!!selectedComplaint} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedComplaint?.complaintId}</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={26} color={NAVY} />
                </TouchableOpacity>
              </View>

              {selectedComplaint && (
                <>
                  <Text style={styles.detailCategory}>{selectedComplaint.category} • {selectedComplaint.subCategory}</Text>
                  <Text style={styles.detailLocation}>📍 {selectedComplaint.location}</Text>
                  <Text style={styles.detailDescription}>{selectedComplaint.description}</Text>

                  {/* Attached Photos */}
                  {!!selectedComplaint.photoUrls && selectedComplaint.photoUrls.length > 0 && (
                    <>
                      <Text style={styles.modalLabel}>Attached Photos</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 6 }}
                      >
                        {selectedComplaint.photoUrls.map((uri, index) => (
                          <Image
                            key={index}
                            source={{ uri }}
                            style={styles.complaintPhoto}
                          />
                        ))}
                      </ScrollView>
                    </>
                  )}

                  <View style={styles.memberBox}>
                    {loadingMember ? (
                      <ActivityIndicator color={GREEN} />
                    ) : memberInfo ? (
                      <>
                        <Text style={styles.memberName}>{memberInfo.name || "Unknown Member"}</Text>
                        <Text style={styles.memberFlat}>Flat {memberInfo.flatNumber} • {selectedComplaint.email}</Text>
                      </>
                    ) : (
                      <Text style={styles.memberFlat}>Member details not found</Text>
                    )}
                  </View>

                  <Text style={styles.modalLabel}>Update Status</Text>
                  <View style={styles.statusRow}>
                    {STATUS_OPTIONS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.statusChip, statusValue === s && { backgroundColor: statusColor(s), borderColor: statusColor(s) }]}
                        onPress={() => setStatusValue(s)}
                      >
                        <Text style={[styles.statusChipText, statusValue === s && { color: "#fff" }]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Assign Worker — inline dropdown (NOT a nested Modal, avoids Expo Go freeze) */}
                  <Text style={styles.modalLabel}>Assign Worker</Text>
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => setWorkerPickerVisible((prev) => !prev)}
                  >
                    <Text style={[styles.selectText, !workerValue && { color: "#9CA3AF" }]}>
                      {workerValue || "Select a worker"}
                    </Text>
                    <Ionicons name={workerPickerVisible ? "chevron-up" : "chevron-down"} size={18} color={GRAY} />
                  </TouchableOpacity>

                  {workerPickerVisible && (
                    <View style={styles.workerDropdown}>
                      {WORKERS.map((w) => (
                        <TouchableOpacity
                          key={w}
                          style={styles.workerOption}
                          onPress={() => {
                            setWorkerValue(w);
                            setWorkerPickerVisible(false);
                          }}
                        >
                          <Text style={styles.workerOptionText}>{w}</Text>
                          {workerValue === w && <Ionicons name="checkmark" size={18} color={GREEN} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text style={styles.modalLabel}>Schedule Date & Time</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 25 July 2026, 10:00 AM"
                    placeholderTextColor="#9CA3AF"
                    value={scheduleValue}
                    onChangeText={setScheduleValue}
                  />

                  <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Schedule Item Modal */}
      <Modal visible={scheduleModalVisible} transparent animationType="slide" onRequestClose={() => setScheduleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Today's Schedule Item</Text>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                <Ionicons name="close" size={26} color={NAVY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Event Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Water Tank Cleaning"
              placeholderTextColor="#9CA3AF"
              value={scheduleTitle}
              onChangeText={setScheduleTitle}
            />

            <Text style={styles.modalLabel}>Time</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 10:00 AM"
              placeholderTextColor="#9CA3AF"
              value={scheduleTime}
              onChangeText={setScheduleTime}
            />

            <TouchableOpacity style={styles.saveButton} onPress={publishScheduleItem}>
              <Text style={styles.saveButtonText}>Publish Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Send Notice Modal */}
      <Modal visible={noticeModalVisible} transparent animationType="slide" onRequestClose={() => setNoticeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Notice</Text>
              <TouchableOpacity onPress={() => setNoticeModalVisible(false)}>
                <Ionicons name="close" size={26} color={NAVY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Water Supply Interruption"
              placeholderTextColor="#9CA3AF"
              value={noticeTitle}
              onChangeText={setNoticeTitle}
            />

            <Text style={styles.modalLabel}>Message</Text>
            <TextInput
              style={[styles.textInput, { height: 90, textAlignVertical: "top" }]}
              placeholder="Write the notice details..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={noticeMessage}
              onChangeText={setNoticeMessage}
            />

            <TouchableOpacity style={styles.saveButton} onPress={sendNotice}>
              <Text style={styles.saveButtonText}>Send to All Members</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Poll Modal */}
      <Modal visible={pollModalVisible} transparent animationType="slide" onRequestClose={() => setPollModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Poll</Text>
              <TouchableOpacity onPress={() => setPollModalVisible(false)}>
                <Ionicons name="close" size={26} color={NAVY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Question</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Should we install solar panels?"
              placeholderTextColor="#9CA3AF"
              value={pollQuestion}
              onChangeText={setPollQuestion}
            />

            <Text style={styles.modalLabel}>Option 1</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Yes"
              placeholderTextColor="#9CA3AF"
              value={option1}
              onChangeText={setOption1}
            />

            <Text style={styles.modalLabel}>Option 2</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. No"
              placeholderTextColor="#9CA3AF"
              value={option2}
              onChangeText={setOption2}
            />

            <TouchableOpacity style={styles.saveButton} onPress={sendPoll}>
              <Text style={styles.saveButtonText}>Send Poll to All Members</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT, paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 20 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: NAVY },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 },
  statCard: { width: "48%", backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: "700", color: NAVY, marginTop: 8 },
  statLabel: { fontSize: 12, color: GRAY, marginTop: 2 },

  scheduleButton: { flexDirection: "row", backgroundColor: "#2E6FD9", borderRadius: 12, padding: 14, justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 10 },
  noticeButton: { flexDirection: "row", backgroundColor: GREEN, borderRadius: 12, padding: 14, justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 10 },
  pollButton: { flexDirection: "row", backgroundColor: NAVY, borderRadius: 12, padding: 14, justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 20 },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  sectionTitle: { fontSize: 17, fontWeight: "700", color: NAVY, marginBottom: 10 },

  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  filterChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterChipText: { color: GRAY, fontWeight: "600", fontSize: 13 },
  filterChipTextActive: { color: "#fff" },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  complaintId: { fontWeight: "700", color: NAVY, fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: "700" },
  cardCategory: { marginTop: 8, fontWeight: "600", color: NAVY, fontSize: 15 },
  cardLocation: { marginTop: 4, color: GRAY, fontSize: 13 },
  cardDescription: { marginTop: 8, color: "#444", fontSize: 14 },
  cardFooterRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  cardMeta: { fontSize: 12, color: GRAY },
  cardAssigned: { fontSize: 12, color: GREEN, fontWeight: "600", maxWidth: "55%" },
  cardPhotoBadge: { fontSize: 12, color: NAVY, fontWeight: "600" },

  empty: { marginTop: 100, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: NAVY, marginTop: 10 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: NAVY },

  detailCategory: { fontSize: 16, fontWeight: "700", color: NAVY, marginTop: 6 },
  detailLocation: { color: GRAY, marginTop: 4 },
  detailDescription: { color: "#444", marginTop: 10, lineHeight: 20 },

  complaintPhoto: { width: 100, height: 100, borderRadius: 12, marginRight: 10 },

  memberBox: { backgroundColor: LIGHT, borderRadius: 12, padding: 14, marginTop: 16 },
  memberName: { fontWeight: "700", color: NAVY, fontSize: 15 },
  memberFlat: { color: GRAY, marginTop: 3, fontSize: 13 },

  modalLabel: { marginTop: 16, marginBottom: 8, fontWeight: "600", color: NAVY },

  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  statusChipText: { color: NAVY, fontWeight: "600", fontSize: 13 },

  selectBox: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 14, backgroundColor: "#FAFAFA", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectText: { color: NAVY, fontSize: 15 },

  workerDropdown: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginTop: 6, backgroundColor: "#FAFAFA", overflow: "hidden" },

  textInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 14, backgroundColor: "#FAFAFA", color: NAVY, marginBottom: 4 },

  saveButton: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 20, marginBottom: 10 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  workerOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: "#ECECEC" },
  workerOptionText: { color: NAVY, fontSize: 15 },
});