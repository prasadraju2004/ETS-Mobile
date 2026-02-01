import React, { useState, useCallback, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { client } from "../api/client";
import { AuthContext } from "../context/AuthContext";

export default function TicketsScreen() {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    if (!user) return;
    try {
      // Handle both _id and id (user object consistency)
      const userId = user._id || user.id;
      // Fetch Tickets
      const res = await client.get(`/tickets/customer/${userId}`);

      // We might want to enrich this with Event Details if the backend doesn't populate it
      // For now assume basic ticket info, we can fetch event if needed or if ticket populates it.
      // NOTE: Standard NestJS populate?
      // If the backend `findByCustomerId` populates `eventId`, we are good.
      // If not, we might need to fetch event details for each.
      // Let's assume standard populate or basic info for now.

      // Let's manually fetch event details if missing or not populated properly
      const enrichedTickets = await Promise.all(
        res.data.map(async (ticket) => {
          if (ticket.eventId && typeof ticket.eventId === "string") {
            try {
              const eventRes = await client.get(`/events/${ticket.eventId}`);
              return { ...ticket, eventDetails: eventRes.data };
            } catch (e) {
              return ticket;
            }
          }
          return ticket;
        }),
      );

      setTickets(enrichedTickets.reverse()); // Newest first
    } catch (err) {
      console.error("Fetch Tickets Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTickets();
    }, [user]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const renderTicket = ({ item }) => {
    const event = item.eventDetails || item.eventId || {};
    // Handle populated eventId or manual fetch
    const eventName = event.name || "Unknown Event";
    const eventDate = event.date
      ? new Date(event.date).toLocaleDateString()
      : "";
    const eventTime = event.date
      ? new Date(event.date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const venueName = event.venueName || "Venue";

    return (
      <View style={styles.ticketCard}>
        {/* Left Side: Event Info */}
        <View style={styles.ticketLeft}>
          <Text style={styles.eventName}>{eventName}</Text>
          <Text style={styles.eventInfo}>
            {eventDate} • {eventTime}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={styles.venueName}>{venueName}</Text>
          </View>
          <View style={styles.seatBadge}>
            <Text style={styles.seatText}>{item.title || "Ticket"}</Text>
          </View>
        </View>

        {/* Right Side: QR Placeholder */}
        <View style={styles.ticketRight}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={40} color="#334155" />
          </View>
          <Text style={styles.status}>{item.status}</Text>
        </View>

        {/* Tear Line visual */}
        <View style={styles.tearLine}>
          <View style={styles.halfCircleTop} />
          <View style={styles.dashLine} />
          <View style={styles.halfCircleBottom} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tickets</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicket}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4F46E5"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="ticket-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptySub}>
                Book your next experience now!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  list: { padding: 20, paddingBottom: 100 },

  ticketCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    flexDirection: "row",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: "hidden",
    minHeight: 140,
  },
  ticketLeft: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  eventName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  eventInfo: { fontSize: 13, color: "#64748B", marginBottom: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  venueName: { fontSize: 13, color: "#64748B", marginLeft: 4 },
  seatBadge: {
    backgroundColor: "#F1F5F9",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  seatText: { fontSize: 12, fontWeight: "600", color: "#334155" },

  ticketRight: {
    width: 90,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0", // Fallback if dash doesn't work well
  },
  qrPlaceholder: { opacity: 0.8, marginBottom: 8 },
  status: {
    fontSize: 10,
    fontWeight: "700",
    color: "#22C55E",
    letterSpacing: 1,
  },

  // Tear Line Visuals
  tearLine: {
    position: "absolute",
    right: 86, // Adjust based on ticketRight width
    top: 0,
    bottom: 0,
    width: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  dashLine: {
    width: 1,
    height: "100%",
    backgroundColor: "#CBD5E1",
    borderStyle: "dashed", // React native logic for dashed is tricky, solid line for now or SVG
    opacity: 0.5,
  },
  halfCircleTop: {
    position: "absolute",
    top: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F8FAFC", // Match background
  },
  halfCircleBottom: {
    position: "absolute",
    bottom: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },

  emptyState: { alignItems: "center", marginTop: 60 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
    marginTop: 16,
  },
  emptySub: { fontSize: 14, color: "#94A3B8", marginTop: 4 },
});
