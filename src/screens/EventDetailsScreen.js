import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// Constants for layout
const IMG_HEIGHT = height * 0.45;

export default function EventDetailsScreen({ route, navigation }) {
  // Mock data matching backend Event schema structure
  // In production, this should come from route.params.event (fetched from backend)
  const event = route?.params?.event || {
    // Backend schema fields
    _id: "mock-event-123",
    name: "Movie Premiere Night",
    description:
      "Experience an unforgettable movie premiere filled with amazing entertainment, great atmosphere, and a chance to create lasting memories with fellow cinema enthusiasts.",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop",

    // Social metrics
    likes: 1247,
    dislikes: 12,

    // Scheduling
    startDateTime: "2026-02-15T19:00:00.000Z",
    endDateTime: "2026-02-15T22:00:00.000Z",

    // Venue - REQUIRED for seating!
    venueId: "mock-venue-456",
    venue: {
      _id: "mock-venue-456",
      name: "Grand Cinema Hall",
      city: "Mumbai",
      location: "Lower Parel, Mumbai",
    },

    // Seating - REQUIRED for seating screen!
    seatingType: "SEATED", // SEATED | GENERAL_ADMISSION | MIXED
    zonePricing: {
      premium: 350,
      standard: 250,
      balcony: 150,
    },
    currency: "R",
    seatHoldTimeout: 10,

    // Classification
    category: "THEATER", // MUSIC | SPORTS | THEATER | COMEDY | OTHER

    // Lifecycle
    status: "ON_SALE", // DRAFT | PUBLISHED | ON_SALE | SOLD_OUT | CANCELLED | COMPLETED

    // Display fields (for UI compatibility)
    date: "Feb 15, 7:00 PM",
    location: "Grand Cinema Hall, Mumbai",
    type: "Theater",
    tag: "SELLING FAST",
    price: "From R150",
    statusColor: "#10B981",
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* --- FIXED BACKGROUND IMAGE --- */}
      {/* This stays stable while content scrolls over it */}
      <View style={styles.fixedImageContainer}>
        <Image source={{ uri: event.image }} style={styles.heroImage} />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.gradient}
        />

        {/* FLOATING TAG - Inside image container so it scrolls with image */}
        <View style={styles.floatingBadge}>
          <Text style={styles.floatingBadgeText}>{event.tag}</Text>
        </View>
      </View>

      {/* --- FIXED HEADER BUTTONS --- */}
      {/* Z-Index ensures they stay clickable and on top of image */}
      <SafeAreaView style={styles.headerButtonsContainer} edges={["top"]}>
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.circleButton}>
          <Ionicons name="heart-outline" size={28} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* --- SCROLLABLE CONTENT --- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Transparent spacer equal to image height minus overlap */}
        <View style={{ height: IMG_HEIGHT - 40 }} />

        <View style={styles.detailsContainer}>
          {/* Handle bar for visual effect */}
          <View style={styles.handleBar} />

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{event.name}</Text>

            {/* Likes Count */}
            <View style={styles.likesContainer}>
              <Ionicons name="heart" size={16} color="#FF0055" />
              <Text style={styles.likesCount}>{event.likes} Likes</Text>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            {/* Date & Time Card */}
            <View style={styles.infoCard}>
              <View style={styles.iconBox}>
                <Ionicons name="calendar" size={24} color="#003580" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>{event.date}</Text>
              </View>
            </View>

            {/* Location Card */}
            <View style={styles.infoCard}>
              <View style={styles.iconBox}>
                <Ionicons name="location" size={24} color="#003580" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {event.location}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Event</Text>
            <Text style={styles.description}>
              {event.description ||
                "Experience an unforgettable event filled with amazing performances, " +
                  "great atmosphere, and a chance to create lasting memories. " +
                  "Join us for this spectacular occasion that brings together the best " +
                  "in entertainment and community spirit."}
            </Text>
          </View>

          {/* Event Type Badge */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryBadge}>
              <MaterialIcons
                name={
                  event.type === "Music"
                    ? "music-note"
                    : event.type === "Sports"
                      ? "sports-soccer"
                      : event.type === "Theater"
                        ? "theaters"
                        : "celebration"
                }
                size={20}
                color="#003580"
              />
              <Text style={styles.categoryText}>{event.type || "Event"}</Text>
            </View>
          </View>

          {/* Status Info */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: event.statusColor + "15" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: event.statusColor },
                ]}
              />
              <Text style={[styles.statusText, { color: event.statusColor }]}>
                {event.status}
              </Text>
            </View>
          </View>

          {/* Padding for Bottom Bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* --- BOTTOM ACTION BAR --- */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.price}>{event.price}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => {
            console.log("=== Book Tickets Pressed ===");
            console.log("Event data:", event);
            console.log("Event.id:", event?.id);
            console.log("Event.seatingType:", event?.seatingType);
            console.log("Event.venue:", event?.venue);

            const isSeatedEvent =
              event.seatingType === "SEATED" ||
              event.seatingType === "ALLOCATED";

            console.log("Is seated event:", isSeatedEvent);

            if (isSeatedEvent && event.venue) {
              console.log("Navigating to Seating screen with event:", event);
              navigation.navigate("Seating", { event });
            } else {
              console.log("Not navigating - showing alert");
              alert("General admission tickets - Coming soon!");
            }
          }}
        >
          <LinearGradient
            // Thick Blue Gradient
            colors={["#003580", "#0052CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bookButtonGradient}
          >
            <Text style={styles.bookButtonText}>Book Tickets</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Light cool grey background
  },
  // --- FIXED IMAGE STYLES ---
  fixedImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: IMG_HEIGHT,
    zIndex: 0,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  // --- HEADER BUTTONS ---
  headerButtonsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
    marginTop: Platform.OS === "android" ? 10 : 0,
    pointerEvents: "box-none", // Allows clicking through empty space
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  floatingBadge: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  floatingBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  // --- SCROLL CONTENT ---
  scrollContent: {
    flexGrow: 1,
  },
  detailsContainer: {
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    minHeight: height * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    lineHeight: 36,
  },
  likesContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  likesCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 5,
  },
  infoCards: {
    marginBottom: 25,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#F0F5FF", // Light Blue Background
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "700",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: "#003580", // Thick Blue Border
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#003580", // Thick Blue Text
    marginLeft: 8,
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
  },
  // --- BOTTOM BAR ---
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "android" ? 16 : 30,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  priceContainer: {
    marginRight: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "600",
  },
  price: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A", // Dark Navy
  },
  bookButton: {
    flex: 1,
  },
  bookButtonGradient: {
    flexDirection: "row",
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#003580",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  bookButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
});
