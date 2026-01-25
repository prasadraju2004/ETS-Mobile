import React, { useState, useContext, useEffect, useCallback } from "react";
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
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { client } from "../api/client";

const { width } = Dimensions.get("window");

const CATEGORIES = ["All", "Music", "Sports", "Theater", "Comedy"];

export default function HomeScreen({ navigation }) {
  const { logout } = useContext(AuthContext);

  // State
  const [activeCategory, setActiveCategory] = useState("All");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ---------------------------------------------------------
  // 1. DATA TRANSFORMATION (Schema -> UI)
  // ---------------------------------------------------------
  const transformEventData = (backendData) => {
    return backendData.map((item) => {
      // 1. Handle ID (MongoDB sometimes returns _id as string or object)
      const id = item._id?.$oid || item._id || Math.random().toString();

      // 2. Handle Date
      // Expecting standard ISO string or MongoDB $date object
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

      // 3. Handle Image (Base64 vs URL)
      let imageUri = "https://via.placeholder.com/300"; // Fallback
      if (item.image) {
        if (typeof item.image === "string" && item.image.startsWith("http")) {
          imageUri = item.image;
        } else if (item.image?.$binary?.base64) {
          // Handle Mongo Extended JSON binary
          imageUri = `data:image/jpeg;base64,${item.image.$binary.base64}`;
        } else if (typeof item.image === "string") {
          // Assume raw base64 string
          imageUri = `data:image/jpeg;base64,${item.image}`;
        }
      }

      // 4. Handle Price (Schema doesn't have price, generating mockup or checking field)
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
        type: item.type || "Other", // For filtering
        description: item.description,
        likes: item.likes || 0,
      };
    });
  };

  // ---------------------------------------------------------
  // 2. API CALLS
  // ---------------------------------------------------------
  const fetchEvents = useCallback(async () => {
    try {
      const response = await client.get("/events");
      const rawData = response.data;
      const uiData = transformEventData(rawData);
      // Sort by likes (descending) and take top 5
      const topEvents = uiData.sort((a, b) => b.likes - a.likes).slice(0, 5);
      setEvents(topEvents);
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
  // 3. FILTERING LOGIC
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

  // Logic to split 'Featured' vs 'Upcoming'
  // (In a real app, you might have a dedicated boolean in DB for 'isFeatured')
  const featuredList = displayEvents.slice(0, 3);
  const upcomingList = displayEvents.slice(3);

  // ---------------------------------------------------------
  // 4. RENDER ITEMS
  // ---------------------------------------------------------

  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.featuredCard}
      onPress={() => navigation.navigate("EventDetails", { event: item })}
    >
      <View style={styles.featuredImageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.featuredImage}
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
      <View style={styles.featuredContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
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

  const renderRecommendedItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.recCard}>
      <Image source={{ uri: item.image }} style={styles.recImage} />
      <View style={styles.recContent}>
        <Text style={styles.recTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.recDate}>
          <Ionicons name="calendar-outline" size={12} /> {item.date}
        </Text>
        <View style={styles.recFooter}>
          <Text style={styles.priceText}>{item.price}</Text>
          <MaterialIcons name="chevron-right" size={20} color="#AAA" />
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <MaterialIcons name="confirmation-number" size={20} color="#FFF" />
          </View>
          <Text style={styles.brandName}>PM</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=12" }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search events..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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

        {displayEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events found.</Text>
          </View>
        ) : (
          <>
            {/* Featured Events */}
            {featuredList.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Events</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={featuredList}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderFeaturedItem}
                  contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: 20,
                  }}
                  snapToInterval={width * 0.75 + 20}
                  decelerationRate="fast"
                />
              </>
            )}

            {/* Upcoming Events (Vertical List) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.verticalList}>
              {upcomingList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.upcomingCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate("EventDetails", { event: item })
                  }
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.upcomingImage}
                  />
                  <View style={styles.upcomingContent}>
                    <Text style={styles.upcomingTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.upcomingMetaRow}>
                      <Text style={styles.upcomingDate}>{item.date}</Text>
                      <View style={styles.upcomingLikes}>
                        <Ionicons name="heart" size={12} color="#FF0055" />
                        <Text style={styles.upcomingLikesText}>
                          {item.likes}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.upcomingLocation} numberOfLines={1}>
                      {item.location}
                    </Text>

                    <View style={styles.upcomingFooter}>
                      <Text style={styles.upcomingPrice}>{item.price}</Text>
                      <TouchableOpacity style={styles.getTicketBtn}>
                        <Text style={styles.getTicketText}>Get Tickets</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {upcomingList.length === 0 && (
                <Text style={{ marginLeft: 20, color: "#999" }}>
                  No additional upcoming events.
                </Text>
              )}
            </View>
          </>
        )}

        {/* Recommended Section (Reusing events for demo, or fetch separate endpoint) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
        </View>

        <FlatList
          data={events.slice(0, 4).reverse()} // Just showing some data reversed
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => "rec-" + item.id}
          renderItem={renderRecommendedItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 90 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButton: {
    padding: 8,
    marginRight: 8,
  },
  avatarContainer: {
    backgroundColor: "#F1F5F9",
    padding: 2,
    borderRadius: 20,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginBottom: 20,
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
    marginBottom: 25,
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
  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  seeAllText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 14,
  },
  // Featured Cards
  featuredCard: {
    width: width * 0.75,
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginRight: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 10,
  },
  featuredImageContainer: {
    position: "relative",
  },
  featuredImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  hotTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hotTagText: {
    color: "#FFF",
    fontSize: 10,
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
  featuredContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 5,
  },
  cardDate: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardLocation: {
    fontSize: 12,
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563EB",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  // Upcoming Vertical List
  verticalList: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  upcomingCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  upcomingImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  upcomingContent: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "space-around",
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
  },
  upcomingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upcomingDate: {
    fontSize: 12,
    color: "#64748B",
  },
  upcomingLikes: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F3",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  upcomingLikesText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF0055",
    marginLeft: 3,
  },
  upcomingLocation: {
    fontSize: 12,
    color: "#94A3B8",
  },
  upcomingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  upcomingPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2563EB",
  },
  getTicketBtn: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  getTicketText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  // Recommended Grid
  recCard: {
    width: width * 0.42,
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginRight: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  recImage: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  recContent: {
    padding: 12,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 5,
  },
  recDate: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 8,
  },
  recFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
