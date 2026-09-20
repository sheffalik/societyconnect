import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
} from "react-native";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firestore";

const NAVY = "#14213D";
const GREEN = "#2E9E5B";
const GRAY = "#6B7280";
const LIGHT_BG = "#EEF2FF";

type Poll = {
  id: string;
  question: string;
  options: string[];
  votes: { [userId: string]: string };
  createdAt?: any;
};

export default function Community() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const currentUserId = getAuth().currentUser?.uid;

  useEffect(() => {
    const q = query(collection(db, "polls"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Poll, "id">),
        }));
        setPolls(data);
        setLoading(false);
      },
      (error) => {
        console.error("Polls listener error:", error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsub();
  }, []);

  const totalVotes = (poll: Poll) => Object.keys(poll.votes || {}).length;

  const votesForOption = (poll: Poll, option: string) =>
    Object.values(poll.votes || {}).filter((v) => v === option).length;

  const hasVoted = (poll: Poll) =>
    !!(currentUserId && poll.votes && poll.votes[currentUserId]);

  const myVote = (poll: Poll) =>
    currentUserId ? poll.votes?.[currentUserId] : undefined;

  const castVote = async (poll: Poll, option: string) => {
    if (!currentUserId) {
      Alert.alert("Not logged in", "Please log in to vote.");
      return;
    }
    if (hasVoted(poll)) {
      Alert.alert("Already voted", "You've already cast your vote on this poll.");
      return;
    }

    try {
      const pollRef = doc(db, "polls", poll.id);
      await updateDoc(pollRef, {
        [`votes.${currentUserId}`]: option,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not submit your vote.");
    }
  };

  const renderPollCard = ({ item: poll }: { item: Poll }) => {
    const total = totalVotes(poll);
    const voted = hasVoted(poll);
    const currentUserChoice = myVote(poll);

    return (
      <View style={styles.pollCard}>
        <View style={styles.pollTopRow}>
          <View style={styles.pollIconCircle}>
            <Ionicons name="bar-chart-outline" size={20} color={NAVY} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.pollQuestion}>{poll.question}</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: "#E7F7EE" }]}>
            <Text style={[styles.statusChipText, { color: GREEN }]}>Open</Text>
          </View>
        </View>

        <View style={styles.optionsBlock}>
          {poll.options.map((option) => {
            const optionVotes = votesForOption(poll, option);
            const pct = total > 0 ? Math.round((optionVotes / total) * 100) : 0;
            const isMyChoice = currentUserChoice === option;

            return (
              <TouchableOpacity
                key={option}
                disabled={voted}
                onPress={() => castVote(poll, option)}
                style={styles.optionRow}
                activeOpacity={0.8}
              >
                {voted ? (
                  <View style={styles.resultTrack}>
                    <View style={[styles.resultFill, { width: `${pct}%` }]} />
                    <View style={styles.resultLabelRow}>
                      <Text style={styles.resultLabelText}>
                        {option} {isMyChoice ? " ✓" : ""}
                      </Text>
                      <Text style={styles.resultPctText}>{pct}%</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.voteOptionButton}>
                    <View style={styles.radioCircle} />
                    <Text style={styles.voteOptionText}>{option}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.pollFooter}>
          <Ionicons name="people-outline" size={13} color={GRAY} />
          <Text style={styles.pollFooterText}>
            {total} vote{total !== 1 ? "s" : ""}
          </Text>
          {voted && (
            <View style={styles.votedTag}>
              <Ionicons name="checkmark-circle" size={13} color={GREEN} />
              <Text style={styles.votedTagText}>Voted</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerBlock}>
      <Text style={styles.sectionLabel}>Society Polls</Text>
      <Text style={styles.sectionSubLabel}>
        Have your say on decisions that affect your society
      </Text>
    </View>
  );

  const ListEmpty = () =>
    loading ? (
      <ActivityIndicator color={GREEN} style={{ marginTop: 40 }} />
    ) : (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={48} color={GRAY} />
        <Text style={styles.emptyTitle}>No active polls</Text>
        <Text style={styles.emptySubtitle}>
          When the management committee creates a poll, it'll show up here.
        </Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={NAVY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={polls}
        keyExtractor={(item) => item.id}
        renderItem={renderPollCard}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.scrollContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: NAVY },

  scrollContent: { padding: 16, paddingBottom: 32 },
  headerBlock: { marginBottom: 16 },

  sectionLabel: { fontSize: 18, fontWeight: "700", color: "#111827" },
  sectionSubLabel: { fontSize: 13, color: GRAY, marginTop: 4 },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 12 },
  emptySubtitle: {
    fontSize: 13,
    color: GRAY,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },

  pollCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  pollTopRow: { flexDirection: "row", alignItems: "flex-start" },
  pollIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: LIGHT_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  pollQuestion: { fontSize: 15, fontWeight: "700", color: "#111827", lineHeight: 20 },
  statusChip: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  statusChipText: { fontSize: 11, fontWeight: "700" },

  optionsBlock: { marginTop: 14, gap: 10 },
  optionRow: { width: "100%" },

  voteOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: NAVY,
  },
  voteOptionText: { fontSize: 14, fontWeight: "600", color: "#111827" },

  resultTrack: {
    position: "relative",
    borderRadius: 10,
    backgroundColor: "#F1F2F4",
    overflow: "hidden",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  resultFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: LIGHT_BG,
  },
  resultLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultLabelText: { fontSize: 14, fontWeight: "600", color: "#111827" },
  resultPctText: { fontSize: 13, fontWeight: "700", color: NAVY },

  pollFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F1F3",
  },
  pollFooterText: { fontSize: 12, color: GRAY },
  votedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    backgroundColor: "#E7F7EE",
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  votedTagText: { fontSize: 11, fontWeight: "700", color: GREEN },
});