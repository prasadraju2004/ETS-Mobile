import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function HomeScreen() {
  const { logout } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Event!</Text>
      <TouchableOpacity onPress={logout} style={styles.btn}>
        <Text style={styles.btnText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121220",
  },
  text: { color: "#FFF", fontSize: 24, marginBottom: 20 },
  btn: { backgroundColor: "#FF0055", padding: 15, borderRadius: 10 },
  btnText: { color: "#FFF", fontWeight: "bold" },
});
