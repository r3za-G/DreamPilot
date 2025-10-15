import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { format } from "date-fns";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useData } from "../contexts/DataContext";
import Card from "../components/Card";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from "../theme/design";
import { hapticFeedback } from "../utils/haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../contexts/ToastContext";
import EmptyState from "../components/EmptyState";
import { SkeletonDreamCard } from "../components/SkeletonLoader";

type JournalScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type Dream = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isLucid: boolean;
  tags: string[];
};

export default function JournalScreen({ navigation }: JournalScreenProps) {
  const { dreams, refreshDreams, loading } = useData(); // ✅ Added loading from context
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "lucid" | "recent">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const toast = useToast();

  const onRefresh = async () => {
    hapticFeedback.light();
    setRefreshing(true);
    await refreshDreams();
    setRefreshing(false);
  };

  const getFilteredDreams = () => {
    let filtered = dreams;

    switch (filter) {
      case "lucid":
        filtered = filtered.filter((d) => d.isLucid);
        break;
      case "recent":
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter((d) => new Date(d.createdAt) > sevenDaysAgo);
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((dream) => {
        if (dream.title.toLowerCase().includes(query)) return true;
        if (dream.content.toLowerCase().includes(query)) return true;
        if (dream.tags.some((tag) => tag.toLowerCase().includes(query)))
          return true;
        return false;
      });
    }

    return filtered;
  };

  const filteredDreams = getFilteredDreams();
  const lucidCount = dreams.filter((d) => d.isLucid).length;

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <Text key={index} style={styles.highlight}>
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  const handleDeleteDream = async (dreamId: string) => {
    hapticFeedback.warning();
    Alert.alert("Delete Dream", "Are you sure you want to delete this dream?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "dreams", dreamId), {
              isDeleted: true,
              deletedAt: new Date().toISOString(),
            });
            await refreshDreams();
            hapticFeedback.success();
            toast.success("Dream deleted");
          } catch (error) {
            console.error("Error deleting dream:", error);
            hapticFeedback.error();
            toast.error("Failed to delete dream");
          }
        },
      },
    ]);
  };

  const renderDream = ({ item }: { item: Dream }) => {
    const date = new Date(item.createdAt);
    const formattedDate = format(date, "MMM d, yyyy");

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          hapticFeedback.light();
          navigation.navigate("DreamDetail", { dreamId: item.id });
        }}
        onLongPress={() => handleDeleteDream(item.id)}
        style={styles.dreamCardWrapper}
      >
        <Card>
          <View style={styles.dreamHeader}>
            <Text style={styles.dreamTitle}>
              {item.isLucid && "✨ "}
              {searchQuery
                ? highlightText(item.title, searchQuery)
                : item.title}
            </Text>
            <View style={styles.dreamHeaderRight}>
              <Text style={styles.dreamDate}>{formattedDate}</Text>
              <TouchableOpacity
                style={styles.deleteIcon}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteDream(item.id);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.dreamContent} numberOfLines={3}>
            {searchQuery
              ? highlightText(item.content, searchQuery)
              : item.content}
          </Text>
          {item.tags.length > 0 && (
            <View style={styles.dreamTags}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <View
                  key={index}
                  style={[
                    styles.dreamTag,
                    searchQuery &&
                      tag.toLowerCase().includes(searchQuery.toLowerCase()) &&
                      styles.dreamTagHighlighted,
                  ]}
                >
                  <Text
                    style={[
                      styles.dreamTagText,
                      searchQuery &&
                        tag.toLowerCase().includes(searchQuery.toLowerCase()) &&
                        styles.dreamTagTextHighlighted,
                    ]}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
              )}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  // ✅ SKELETON LOADER - While loading initial data
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Dream Journal</Text>
            </View>
          </View>
          <View style={styles.listContent}>
            <SkeletonDreamCard />
            <SkeletonDreamCard />
            <SkeletonDreamCard />
            <SkeletonDreamCard />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ EMPTY STATE - No dreams match search
  if (searchQuery.trim() && filteredDreams.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Dream Journal</Text>
              <TouchableOpacity
                style={styles.searchToggle}
                onPress={() => {
                  hapticFeedback.light();
                  setIsSearching(!isSearching);
                  setSearchQuery("");
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={COLORS.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search dreams, tags..."
                placeholderTextColor={COLORS.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={COLORS.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <EmptyState
            icon="search"
            title="No matches found"
            description={`No dreams match "${searchQuery}". Try different keywords or browse all dreams.`}
            actionLabel="Clear Search"
            onAction={() => setSearchQuery("")}
            secondaryActionLabel="View All Dreams"
            onSecondaryAction={() => {
              setSearchQuery("");
              setFilter("all");
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ✅ EMPTY STATE - No lucid dreams
  if (filter === "lucid" && filteredDreams.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Dream Journal</Text>
            </View>
            <View style={styles.statsRow}>
              <Card style={styles.statChip}>
                <Text style={styles.statNumber}>{dreams.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </Card>
              <Card
                style={StyleSheet.flatten([
                  styles.statChip,
                  styles.statChipLucid,
                ])}
              >
                <Text style={styles.statNumber}>{lucidCount}</Text>
                <Text style={styles.statLabel}>Lucid</Text>
              </Card>
            </View>
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab]}
              onPress={() => {
                hapticFeedback.light();
                setFilter("all");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.filterText}>All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, styles.filterTabActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, styles.filterTextActive]}>
                Lucid
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab]}
              onPress={() => {
                hapticFeedback.light();
                setFilter("recent");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.filterText}>Recent</Text>
            </TouchableOpacity>
          </View>

          <EmptyState
            emoji="✨"
            title="No lucid dreams yet"
            description="Keep practicing! Complete lessons to learn techniques for becoming lucid in your dreams."
            actionLabel="Browse Lessons"
            onAction={() =>
              navigation.navigate("MainTabs", { screen: "Learn" })
            }
            secondaryActionLabel="Log a Dream"
            onSecondaryAction={() => navigation.navigate("DreamJournal")}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ✅ EMPTY STATE - No recent dreams
  if (filter === "recent" && filteredDreams.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Dream Journal</Text>
            </View>
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterTab]}
              onPress={() => {
                hapticFeedback.light();
                setFilter("all");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.filterText}>All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab]}
              onPress={() => {
                hapticFeedback.light();
                setFilter("lucid");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.filterText}>Lucid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterTab, styles.filterTabActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, styles.filterTextActive]}>
                Recent
              </Text>
            </TouchableOpacity>
          </View>

          <EmptyState
            emoji="📅"
            title="No recent dreams"
            description="You haven't logged any dreams in the past 7 days. Keep your streak going!"
            actionLabel="Log Today's Dream"
            onAction={() => navigation.navigate("DreamJournal")}
            secondaryActionLabel="View All Dreams"
            onSecondaryAction={() => setFilter("all")}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ✅ EMPTY STATE - No dreams at all
  if (dreams.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.container}>
          <EmptyState
            emoji="📖"
            title="No dreams yet"
            description="Start your lucid dreaming journey by logging your first dream! Dreams are the gateway to understanding your subconscious."
            actionLabel="Log Your First Dream"
            onAction={() => navigation.navigate("DreamJournal")}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Normal content with dreams
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Dream Journal</Text>
            <TouchableOpacity
              style={styles.searchToggle}
              onPress={() => {
                hapticFeedback.light();
                setIsSearching(!isSearching);
                if (isSearching) setSearchQuery("");
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSearching ? "close" : "search"}
                size={22}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {isSearching && (
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={COLORS.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search dreams, tags..."
                placeholderTextColor={COLORS.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={COLORS.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.statsRow}>
            <Card style={styles.statChip}>
              <Text style={styles.statNumber}>{dreams.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </Card>
            <Card
              style={StyleSheet.flatten([
                styles.statChip,
                styles.statChipLucid,
              ])}
            >
              <Text style={styles.statNumber}>{lucidCount}</Text>
              <Text style={styles.statLabel}>Lucid</Text>
            </Card>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "all" && styles.filterTabActive,
            ]}
            onPress={() => {
              hapticFeedback.light();
              setFilter("all");
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                filter === "all" && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "lucid" && styles.filterTabActive,
            ]}
            onPress={() => {
              hapticFeedback.light();
              setFilter("lucid");
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                filter === "lucid" && styles.filterTextActive,
              ]}
            >
              Lucid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "recent" && styles.filterTabActive,
            ]}
            onPress={() => {
              hapticFeedback.light();
              setFilter("recent");
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                filter === "recent" && styles.filterTextActive,
              ]}
            >
              Recent
            </Text>
          </TouchableOpacity>
        </View>

        {searchQuery.trim() && (
          <View style={styles.searchResultsBar}>
            <Text style={styles.searchResultsText}>
              {filteredDreams.length}{" "}
              {filteredDreams.length === 1 ? "result" : "results"} found
            </Text>
          </View>
        )}

        <FlatList
          data={filteredDreams}
          renderItem={renderDream}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            hapticFeedback.medium();
            navigation.navigate("DreamJournal");
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl - 4,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  searchToggle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  searchResultsBar: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  searchResultsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statChipLucid: {
    borderColor: COLORS.secondary,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },
  dreamCardWrapper: {
    marginBottom: SPACING.md,
  },
  dreamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  dreamTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  dreamHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  dreamDate: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  deleteIcon: {
    padding: SPACING.xs,
  },
  dreamContent: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  highlight: {
    backgroundColor: COLORS.primary,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  dreamTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  dreamTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dreamTagHighlighted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dreamTagText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
  dreamTagTextHighlighted: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  moreTagsText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    alignSelf: "center",
  },
  fab: {
    position: "absolute",
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.large,
  },
});
