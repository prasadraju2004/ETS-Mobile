import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { client } from "../api/client";

const { width } = Dimensions.get("window");

const CATEGORIES = ["All", "Music", "Sports", "Theater", "Comedy"];

export default function ExploreScreen({ navigation }) {
  // State
  const [activeCategory, setActiveCategory] = useState("All");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ---------------------------------------------------------
  // DATA TRANSFORMATION
  // ---------------------------------------------------------
  const transformEventData = (backendData) => {
    return backendData.map((item) => {
      const id = item._id?.$oid || item._id || Math.random().toString();

      const rawDate = item.startDateTime?.$date || item.startDateTime;
      const dateObj = new Date(rawDate);
      const formattedDate = isNaN(dateObj)
        ? "TBA"
        : dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });

      let imageUri = "https://via.placeholder.com/300";
      if (item.image) {
        if (typeof item.image === "string" && item.image.startsWith("http")) {
          imageUri = item.image;
        } else if (item.image?.$binary?.base64) {
          imageUri = `data:image/jpeg;base64,${item.image.$binary.base64}`;
        } else if (typeof item.image === "string") {
          imageUri = `data:image/jpeg;base64,${item.image}`;
        }
      }

      const price = item.price ? `$${item.price}` : "From $45";

      return {
        id: id,
        title: item.name || "Untitled Event",
        date: formattedDate,
        location: item.venue
          ? `${item.venue.name}, ${item.venue.city}`
          : "Unknown Location",
        price: price,
        image: imageUri,
        tag: item.status === "ACTIVE" ? "SELLING FAST" : "SOLD OUT",
        status: item.status === "ACTIVE" ? "Available" : "Full",
        statusColor: item.status === "ACTIVE" ? "#10B981" : "#EF4444",
        type: item.type || "Other",
        description: item.description,
        likes: item.likes || 0,
      };
    });
  };

  // ---------------------------------------------------------
  // API CALLS
  // ---------------------------------------------------------
  const fetchEvents = useCallback(async () => {
    try {
      const response = await client.get("/events");
      const rawData = response.data;
      const uiData = transformEventData(rawData);
      setEvents(uiData);
    } catch (error) {
      Alert.alert(
        "Error",
        "Could not load events. Check your connection and backend server.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // ---------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------
  const getFilteredEvents = () => {
    let filtered = events;

    // Filter by Category
    if (activeCategory !== "All") {
      filtered = filtered.filter(
        (e) => e.type?.toLowerCase() === activeCategory.toLowerCase(),
      );
    }

    // Filter by Search
    if (searchQuery) {
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.location.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  };

  const displayEvents = getFilteredEvents();

  // ---------------------------------------------------------
  // RENDER ITEMS
  // ---------------------------------------------------------
  const renderEventCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.eventCard}
      onPress={() => navigation.navigate("EventDetails", { event: item })}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.eventImage}
          resizeMode="cover"
        />
        <View style={styles.hotTag}>
          <Text style={styles.hotTagText}>{item.tag}</Text>
        </View>

        {/* Likes Badge */}
        <View style={styles.likesBadge}>
          <Ionicons name="heart" size={14} color="#FF0055" />
          <Text style={styles.likesText}>{item.likes}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardDate}>{item.date}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.cardLocation} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{item.price}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.statusColor + "20" },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: item.statusColor }]}
            />
            <Text style={[styles.statusText, { color: item.statusColor }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ---------------------------------------------------------
  // MAIN RETURN
  // ---------------------------------------------------------
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require("../../assets/EP Logo nobg.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => navigation.navigate("Profile")}
        >
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=12" }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search events, venues, artists..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {CATEGORIES.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryChip,
                activeCategory === cat && styles.activeCategoryChip,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.activeCategoryText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {displayEvents.length}{" "}
          {displayEvents.length === 1 ? "event" : "events"} found
        </Text>
      </View>

      {/* Events Grid */}
      <FlatList
        data={displayEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#DDD" />
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubText}>
              Try adjusting your search or filters
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
    backgroundColor: "#FAFAFA",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 0,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#FAFAFA",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoImage: {
    height: 48,
    width: 170,
  },
  avatarContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: "#FFF",
  },
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginTop: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#334155",
  },
  // Categories
  categoryContainer: {
    marginBottom: 15,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
  },
  activeCategoryChip: {
    backgroundColor: "#1E293B",
    borderColor: "#1E293B",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  activeCategoryText: {
    color: "#FFF",
  },
  // Results
  resultsContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  // Grid
  gridContainer: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  // Event Card
  eventCard: {
    width: (width - 50) / 2,
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  imageContainer: {
    position: "relative",
  },
  eventImage: {
    width: "100%",
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  hotTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hotTagText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  likesBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  likesText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardLocation: {
    fontSize: 11,
    color: "#64748B",
    marginLeft: 4,
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563EB",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
  },
});
