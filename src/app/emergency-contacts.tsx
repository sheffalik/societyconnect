import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Linking,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const GRAY = "#6B7280";
const RED = "#D93B3B";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "emergency", label: "Emergency" },
  { key: "society", label: "Society" },
  { key: "utility", label: "Utility" },
] as const;

type Contact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  category: "society" | "emergency" | "utility";
};

const CONTACTS: Contact[] = [
  { id: "1", name: "Police Control Room", role: "Emergency", phone: "100", icon: "shield-outline", color: RED, category: "emergency" },
  { id: "2", name: "Fire Brigade", role: "Emergency", phone: "101", icon: "flame-outline", color: RED, category: "emergency" },
  { id: "3", name: "Ambulance", role: "Emergency", phone: "102", icon: "medkit-outline", color: RED, category: "emergency" },
  { id: "4", name: "National Emergency Number", role: "Emergency", phone: "112", icon: "alert-circle-outline", color: RED, category: "emergency" },
  { id: "5", name: "Women Helpline", role: "Emergency", phone: "1091", icon: "person-outline", color: RED, category: "emergency" },
  { id: "6", name: "Security Guard (Gate 1)", role: "Society Staff", phone: "9876500001", icon: "shield-checkmark-outline", color: NAVY, category: "society" },
  { id: "7", name: "Society Manager", role: "Society Staff", phone: "9876500002", icon: "person-circle-outline", color: NAVY, category: "society" },
  { id: "8", name: "Watchman (Night Shift)", role: "Society Staff", phone: "9876500003", icon: "moon-outline", color: NAVY, category: "society" },
  { id: "9", name: "Housekeeping Head", role: "Society Staff", phone: "9876500004", icon: "sparkles-outline", color: NAVY, category: "society" },
  { id: "10", name: "Electrician", role: "Utility", phone: "9058899721", icon: "flash-outline", color: "#E07A1F", category: "utility" },
  { id: "11", name: "Plumber", role: "Utility", phone: "9876500012", icon: "water-outline", color: "#2E6FD9", category: "utility" },
  { id: "12", name: "Carpenter", role: "Utility", phone: "9876500013", icon: "hammer-outline", color: "#8B5E3C", category: "utility" },
  { id: "13", name: "Lift Technician", role: "Utility", phone: "9876500014", icon: "arrow-up-circle-outline", color: "#5B4FCF", category: "utility" },
  { id: "14", name: "Pest Control", role: "Utility", phone: "9876500015", icon: "bug-outline", color: GREEN, category: "utility" },
  { id: "15", name: "Gardener", role: "Utility", phone: "9876500016", icon: "leaf-outline", color: GREEN, category: "utility" },
  { id: "16", name: "Generator / Power Backup", role: "Utility", phone: "9876500017", icon: "battery-charging-outline", color: "#E07A1F", category: "utility" },
  { id: "17", name: "Gas Agency", role: "Utility", phone: "9876500018", icon: "flame-outline", color: "#E07A1F", category: "utility" },
  { id: "18", name: "Internet / Cable Provider", role: "Utility", phone: "9876500019", icon: "wifi-outline", color: "#2E6FD9", category: "utility" },
];

export default function EmergencyContacts() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [modalContact, setModalContact] = useState<Contact | null>(null);
  const [copied, setCopied] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const horizontalPad = Math.max(16, Math.min(width * 0.035, 56));

  const filteredContacts = CONTACTS.filter((contact) => {
    const matchesFilter = filter === "all" ? true : contact.category === filter;
    const matchesSearch =
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.role.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCallPress = (contact: Contact) => {
    if (Platform.OS === "web") {
      setCopied(false);
      setModalContact(contact);
    } else {
      Linking.openURL(`tel:${contact.phone}`).catch(() => {
        setCopied(false);
        setModalContact(contact);
      });
    }
  };

  const handleCopyNumber = async () => {
    if (!modalContact) return;
    await Clipboard.setStringAsync(modalContact.phone);
    setCopied(true);
  };

  const handleTryCallFromModal = () => {
    if (!modalContact) return;
    Linking.openURL(`tel:${modalContact.phone}`).catch(() => {});
  };

  const closeModal = () => {
    setModalContact(null);
    setCopied(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: horizontalPad, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity hitSlop={8} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={NAVY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={GRAY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contact or service..."
            placeholderTextColor={GRAY}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={GRAY} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.sosBanner}
          onPress={() =>
            handleCallPress({
              id: "sos",
              name: "National Emergency Number",
              role: "Emergency",
              phone: "112",
              icon: "call",
              color: RED,
              category: "emergency",
            })
          }
          activeOpacity={0.85}
        >
          <View style={styles.sosIconCircle}>
            <Ionicons name="call" size={22} color="#fff" />
          </View>
          <View style={styles.sosTextContainer}>
            <Text style={styles.sosTitle}>SOS - Tap to Call</Text>
            <Text style={styles.sosSubtitle}>National Emergency Number · 112</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.contactsGrid}>
          {filteredContacts.map((item) => (
            <View
              key={item.id}
              style={[styles.contactCard, isDesktop && styles.contactCardHalf]}
            >
              <View style={[styles.contactIconCircle, { backgroundColor: `${item.color}1A` }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>

              <View style={styles.contactDetails}>
                <Text style={styles.contactName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.contactRole}>
                  {item.role} · {item.phone}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCallPress(item)}
                hitSlop={8}
              >
                <Ionicons name="call" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}

          {filteredContacts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="call-outline" size={40} color={GRAY} />
              <Text style={styles.emptyText}>No contacts found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!modalContact}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconCircle,
                { backgroundColor: `${modalContact?.color ?? NAVY}1A` },
              ]}
            >
              <Ionicons
                name={modalContact?.icon ?? "call"}
                size={26}
                color={modalContact?.color ?? NAVY}
              />
            </View>
            <Text style={styles.modalName}>{modalContact?.name}</Text>
            <Text style={styles.modalPhone}>{modalContact?.phone}</Text>

            <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleTryCallFromModal}>
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.modalPrimaryButtonText}>Call from mobile phone</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalSecondaryButton} onPress={handleCopyNumber}>
              <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color={NAVY} />
              <Text style={styles.modalSecondaryButtonText}>
                {copied ? "Copied!" : "Copy Number"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelButton} onPress={closeModal}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: NAVY,
  },
  headerSpacer: {
    width: 24,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 14,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: GRAY,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  sosBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: RED,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 4,
  },
  sosIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sosTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  sosTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  sosSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  contactsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  contactCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    elevation: 1,
  },
  contactCardHalf: {
    width: "48%",
  },
  contactIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  contactDetails: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  contactRole: {
    fontSize: 12,
    color: GRAY,
    marginTop: 2,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: GRAY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  modalPhone: {
    fontSize: 14,
    color: GRAY,
    marginTop: 4,
    marginBottom: 20,
  },
  modalPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 10,
  },
  modalPrimaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  modalSecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F1F2F4",
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 10,
  },
  modalSecondaryButtonText: {
    color: NAVY,
    fontWeight: "700",
    fontSize: 14,
  },
  modalCancelButton: {
    paddingVertical: 8,
  },
  modalCancelButtonText: {
    color: GRAY,
    fontWeight: "600",
    fontSize: 13,
  },
});