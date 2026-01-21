import React, { useState } from "react";
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
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// --- MOCK DATA TO MATCH YOUR SCREENSHOT ---
const CATEGORIES = ["All", "Music", "Sports", "Theater", "Comedy"];

const FEATURED_EVENTS = [
  {
    id: "1",
    title: "Summer Music Festival",
    date: "Jul 15, 2024 • 7:00 PM",
    location: "Central Arena",
    price: "From $45",
    image:
      "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=1000&auto=format&fit=crop",
    tag: "HOT",
    status: "Available",
    statusColor: "#10B981", // Green
  },
  {
    id: "2",
    title: "Championship Final",
    date: "Jul 20, 2024 • 6:00 PM",
    location: "Sports Complex",
    price: "From $90",
    image:
      "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1000&auto=format&fit=crop",
    tag: "SELLING FAST",
    status: "Few Left",
    statusColor: "#F59E0B", // Orange
  },
];

const UPCOMING_EVENTS = [
  {
    id: "3",
    title: "Comedy Night Live",
    date: "Aug 5, 2024 • 9:00 PM",
    location: "Laugh Factory",
    price: "$30",
    image:
      "https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Broadway Musical",
    date: "Aug 12, 2024 • 7:30 PM",
    location: "Grand Theater",
    price: "$55",
    image:
      "https://images.unsplash.com/photo-1503095392269-236fa5900699?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "Rock Legends Tour",
    date: "Aug 18, 2024 • 8:00 PM",
    location: "Stadium Arena",
    price: "$75",
    image:
      "https://images.unsplash.com/photo-1459749411177-8c29142af60e?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "6",
    title: "Jazz & Blues Evening",
    date: "Aug 25, 2024 • 9:30 PM",
    location: "Blue Note Club",
    price: "$40",
    image:
      "https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=1000&auto=format&fit=crop",
  },
];

const RECOMMENDED = [
  {
    id: "7",
    title: "EDM Night",
    date: "Sep 1",
    price: "$50",
    image:
      "https://images.unsplash.com/photo-1571266028243-371602c3327a?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "8",
    title: "Opera Gala",
    date: "Sep 8",
    price: "$85",
    image:
      "https://images.unsplash.com/photo-1550950346-6309859f77f9?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState("All");

  // Renders the horizontal "Featured" cards
  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.featuredCard}>
      <View style={styles.featuredImageContainer}>
        <Image source={{ uri: item.image }} style={styles.featuredImage} />
        <View style={styles.hotTag}>
          <Text style={styles.hotTagText}>{item.tag}</Text>
        </View>
      </View>
      <View style={styles.featuredContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDate}>{item.date}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.cardLocation}>{item.location}</Text>
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

  // Renders the "Recommended" square cards
  const renderRecommendedItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.recCard}>
      <Image source={{ uri: item.image }} style={styles.recImage} />
      <View style={styles.recContent}>
        <Text style={styles.recTitle}>{item.title}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <MaterialIcons name="confirmation-number" size={20} color="#FFF" />
          </View>
          <Text style={styles.brandName}>PM</Text>
        </View>
        <TouchableOpacity style={styles.avatarContainer}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=12" }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 2. Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search events, artists, venues..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
        </View>

        {/* 3. Categories */}
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

        {/* 4. Featured Events */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Events</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={FEATURED_EVENTS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={renderFeaturedItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          snapToInterval={width * 0.75 + 20}
          decelerationRate="fast"
        />

        {/* 5. Upcoming Events (Vertical List) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.verticalList}>
          {UPCOMING_EVENTS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.upcomingCard}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.upcomingImage}
              />
              <View style={styles.upcomingContent}>
                <Text style={styles.upcomingTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.upcomingDate}>{item.date}</Text>
                <Text style={styles.upcomingLocation}>{item.location}</Text>

                <View style={styles.upcomingFooter}>
                  <Text style={styles.upcomingPrice}>{item.price}</Text>
                  <TouchableOpacity style={styles.getTicketBtn}>
                    <Text style={styles.getTicketText}>Get Tickets</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 6. Recommended Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
        </View>

        <FlatList
          data={RECOMMENDED}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={renderRecommendedItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 90 }} // Extra padding for bottom bar
        />
      </ScrollView>

      {/* 7. Fake Bottom Navigation (Visual Only) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomItem}>
          <Ionicons name="home" size={24} color="#0F172A" />
          <Text
            style={[
              styles.bottomText,
              { color: "#0F172A", fontWeight: "bold" },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomItem}>
          <Ionicons name="compass-outline" size={24} color="#94A3B8" />
          <Text style={styles.bottomText}>Explore</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomItem}>
          <Ionicons name="ticket-outline" size={24} color="#94A3B8" />
          <Text style={styles.bottomText}>My Tickets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomItem}>
          <Ionicons name="heart-outline" size={24} color="#94A3B8" />
          <Text style={styles.bottomText}>Favorites</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  scrollContent: {
    paddingBottom: 20,
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
    color: "#EF4444", // Reddish tint like screenshot
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
    marginBottom: 10, // space for shadow
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
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563EB", // Blue
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
  upcomingDate: {
    fontSize: 12,
    color: "#64748B",
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
  // Bottom Bar (Fake)
  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 80,
    backgroundColor: "#FFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 20, // For iPhone home indicator
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  bottomItem: {
    alignItems: "center",
  },
  bottomText: {
    fontSize: 10,
    marginTop: 4,
    color: "#94A3B8",
  },
});
