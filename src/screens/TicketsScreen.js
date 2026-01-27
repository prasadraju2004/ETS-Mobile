import React from "react";
import { StyleSheet, Text, View, StatusBar, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function TicketsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require("../../assets/EP Logo nobg.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Placeholder Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="ticket-outline" size={80} color="#CBD5E1" />
        </View>
        <Text style={styles.title}>My Tickets</Text>
        <Text style={styles.subtitle}>
          Your purchased tickets will appear here
        </Text>
        <Text style={styles.comingSoon}>Coming Soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },
  comingSoon: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF0055",
    backgroundColor: "#FFF0F3",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
