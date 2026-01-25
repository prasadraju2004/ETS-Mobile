import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.image }} style={styles.heroImage} />

          {/* Gradient Overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradient}
          />

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Like Button */}
          <TouchableOpacity style={styles.likeButton}>
            <Ionicons name="heart-outline" size={28} color="#FFF" />
          </TouchableOpacity>

          {/* Floating Status Badge */}
          <View style={styles.floatingBadge}>
            <Text style={styles.floatingBadgeText}>{event.tag}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{event.title}</Text>

            {/* Likes Count */}
            <View style={styles.likesContainer}>
              <Ionicons name="heart" size={20} color="#FF0055" />
              <Text style={styles.likesCount}>{event.likes} Likes</Text>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            {/* Date & Time Card */}
            <View style={styles.infoCard}>
              <View style={styles.iconBox}>
                <Ionicons name="calendar" size={24} color="#FF0055" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Date & Time</Text>
                <Text style={styles.infoValue}>{event.date}</Text>
              </View>
            </View>

            {/* Location Card */}
            <View style={styles.infoCard}>
              <View style={styles.iconBox}>
                <Ionicons name="location" size={24} color="#FF0055" />
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
                color="#FF0055"
              />
              <Text style={styles.categoryText}>{event.type || "Event"}</Text>
            </View>
          </View>

          {/* Status Info */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: event.statusColor + "20" },
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

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.price}>{event.price}</Text>
        </View>
        <TouchableOpacity style={styles.bookButton}>
          <LinearGradient
            colors={["#FF0055", "#FF0099"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bookButtonGradient}
          >
            <Text style={styles.bookButtonText}>Book Tickets</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  heroContainer: {
    position: "relative",
    height: height * 0.45,
  },
  heroImage: {
    width: width,
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  likeButton: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  floatingBadge: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  floatingBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  contentContainer: {
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingTop: 25,
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
    backgroundColor: "#FFF0F3",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  likesCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF0055",
    marginLeft: 6,
  },
  infoCards: {
    marginBottom: 25,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#FFF0F3",
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
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "600",
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
    color: "#64748B",
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
    borderWidth: 1,
    borderColor: "#FF0055",
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF0055",
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
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === "android" ? 15 : 25,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  priceContainer: {
    marginRight: 15,
  },
  priceLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2563EB",
  },
  bookButton: {
    flex: 1,
  },
  bookButtonGradient: {
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  bookButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
});
