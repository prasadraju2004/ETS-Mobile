import React, { useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { client } from "../api/client";
import { AuthContext } from "../context/AuthContext";

export default function BookingScreen({ route, navigation }) {
  const { event, selectedSeats, totalPrice } = route.params;
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Helper to extract ID
  const getSafeId = (data) => {
    if (!data) return null;
    if (typeof data === "string") return data;
    if (data._id) return data._id;
    if (data.id) return data.id;
    return null;
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const seatIds = selectedSeats.map((s) => getSafeId(s) || s._id || s.key); // Ensure we get the ID used for locking
      // The SeatingScreen uses "key" or "_id" mostly. The backend expects the IDs we locked with.
      // In SeatingScreen, `selectedSeatIds` are passed. We should probably pass the full seat objects or just IDs.
      // Let's assume selectedSeats is an array of seat objects which have `_id` (virtual or real).

      const userId = getSafeId(user);

      // Simulate Payment Delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Confirm Purchase
      await client.post("/event-seats/confirm", {
        seatIds: seatIds,
        userId: userId,
      });

      setLoading(false);
      setShowSuccessModal(true);
    } catch (err) {
      setLoading(false);
      console.error("Payment Error:", err);
      Alert.alert("Payment Failed", err.response?.data?.message || err.message);
    }
  };

  const navigateToTickets = () => {
    setShowSuccessModal(false);
    // Navigate to the "Tickets" tab in the MainTabs logic
    // Usually "Main" stack -> "Tickets" tab
    navigation.reset({
      index: 0,
      routes: [{ name: "Main", state: { routes: [{ name: "Tickets" }] } }],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Event Card */}
        <View style={styles.card}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={16} color="#64748B" />
            <Text style={styles.eventDetail}>
              {new Date(event.date).toLocaleDateString()} •{" "}
              {new Date(event.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.eventDetail}>{event.venueName || "Venue"}</Text>
          </View>
        </View>

        {/* Seats List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Seats</Text>
          {selectedSeats.map((seat, index) => (
            <View key={index} style={styles.seatRow}>
              <View>
                <Text style={styles.seatLabel}>
                  Row {seat.row} • Seat {seat.seatNumber}
                </Text>
                <Text style={styles.seatType}>
                  {seat.sectionColor ? "Standard Zone" : "Standard"}
                </Text>
              </View>
              <Text style={styles.seatPrice}>₹{seat.price || 0}</Text>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={styles.divider} />
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Subtotal</Text>
          <Text style={styles.priceValue}>₹{totalPrice}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Booking Fee</Text>
          <Text style={styles.priceValue}>₹25</Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{totalPrice + 25}</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, loading && styles.disabledBtn]}
          onPress={handlePayment}
          disabled={loading}
        >
          <Text style={styles.payBtnText}>
            {loading ? "Processing..." : `Pay ₹${totalPrice + 25}`}
          </Text>
          {!loading && (
            <MaterialIcons
              name="lock"
              size={18}
              color="#FFF"
              style={{ marginLeft: 8 }}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color="#FFF" />
            </View>
            <Text style={styles.modalTitle}>Payment Successful!</Text>
            <Text style={styles.modalText}>
              Your booking has been confirmed. You can view your tickets in the
              My Tickets section.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={navigateToTickets}
            >
              <Text style={styles.modalBtnText}>View My Tickets</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  content: { padding: 20 },

  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  eventDetail: { marginLeft: 8, color: "#64748B", fontSize: 14 },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 12,
  },
  seatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  seatLabel: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  seatType: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  seatPrice: { fontSize: 16, fontWeight: "700", color: "#4F46E5" },

  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 10 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: { color: "#64748B", fontSize: 15 },
  priceValue: { color: "#1E293B", fontSize: 15, fontWeight: "600" },
  totalRow: { marginTop: 8 },
  totalLabel: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  totalValue: { fontSize: 20, fontWeight: "800", color: "#22C55E" },

  footer: {
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  payBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  disabledBtn: { opacity: 0.7 },
  payBtnText: { color: "#FFF", fontSize: 18, fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    width: "100%",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  modalBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
