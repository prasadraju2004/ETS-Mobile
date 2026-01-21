// frontend/src/screens/AuthScreen.js
import React, { useState, useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, FontAwesome } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { client } from "../api/client"; // Import the axios client we made

const { width, height } = Dimensions.get("window");

export default function AuthScreen() {
  const { login } = useContext(AuthContext);

  // UI State
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // Clear errors or fields if needed
  };

  const handleAuth = async () => {
    // 1. Basic Validation
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    if (!isLogin && !name) {
      Alert.alert("Missing Fields", "Please enter your full name.");
      return;
    }

    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      // 2. Determine Endpoint (Login vs Signup)
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";

      // 3. Construct Payload
      // Note: Adjust 'name' key based on what your User DTO expects (e.g., 'username', 'fullName', 'name')
      const payload = isLogin ? { email, password } : { email, password, name };

      // 4. Make API Call
      const response = await client.post(endpoint, payload);

      // 5. Handle Success
      // Your NestJS returns: { access_token: "...", user: { ... } }
      const { access_token, user } = response.data;

      if (access_token) {
        login(access_token, user); // Call Context Login
      } else {
        Alert.alert("Error", "No access token received.");
      }
    } catch (error) {
      // 6. Handle Errors
      console.log(error);
      const message =
        error.response?.data?.message ||
        "Something went wrong. Check connection.";
      Alert.alert(
        "Authentication Failed",
        Array.isArray(message) ? message[0] : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <ImageBackground
          source={{
            uri: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop",
          }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(10, 10, 30, 0.6)", "rgba(20, 0, 40, 0.95)"]}
            style={styles.gradientOverlay}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.headerContainer}>
                <Text style={styles.brandTitle}>PM</Text>
                <Text style={styles.subTitle}>
                  {isLogin ? "Welcome Back, Legend." : "Join the Experience."}
                </Text>
              </View>

              <View style={styles.card}>
                {/* NAME INPUT (Signup Only) */}
                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons
                      name="account-outline"
                      size={24}
                      color="#A0A0A0"
                      style={styles.icon}
                    />
                    <TextInput
                      placeholder="Full Name"
                      placeholderTextColor="#666"
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                {/* EMAIL INPUT */}
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={24}
                    color="#A0A0A0"
                    style={styles.icon}
                  />
                  <TextInput
                    placeholder="Email Address"
                    placeholderTextColor="#666"
                    keyboardType="email-address"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>

                {/* PASSWORD INPUT */}
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={24}
                    color="#A0A0A0"
                    style={styles.icon}
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#666"
                    secureTextEntry
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                {isLogin && (
                  <TouchableOpacity style={styles.forgotPass}>
                    <Text style={styles.forgotPassText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}

                {/* ACTION BUTTON */}
                <TouchableOpacity
                  style={styles.buttonShadow}
                  onPress={handleAuth}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={["#FF0055", "#FF0099"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>
                          {isLogin ? "LOG IN" : "GET TICKETS"}
                        </Text>
                        <MaterialCommunityIcons
                          name="arrow-right"
                          size={24}
                          color="#FFF"
                        />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Social Login UI (Visual Only) */}
                <View style={styles.socialContainer}>
                  <Text style={styles.orText}>Or connect with</Text>
                  <View style={styles.socialIcons}>
                    <TouchableOpacity style={styles.socialButton}>
                      <FontAwesome name="google" size={24} color="#DB4437" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialButton}>
                      <FontAwesome name="apple" size={24} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have a ticket? "}
                </Text>
                <TouchableOpacity onPress={toggleMode}>
                  <Text style={styles.footerLink}>
                    {isLogin ? "Sign Up" : "Log In"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: width, height: height },
  gradientOverlay: { ...StyleSheet.absoluteFillObject },
  keyboardView: { flex: 1, justifyContent: "center" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
  headerContainer: { marginBottom: 30, marginTop: 50 },
  brandTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 2,
    textShadowColor: "rgba(255, 0, 153, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subTitle: {
    fontSize: 18,
    color: "#DDD",
    marginTop: 5,
    fontWeight: "500",
    opacity: 0.8,
  },
  card: {
    backgroundColor: "#1A1A2E",
    borderRadius: 25,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121220",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 60,
    borderWidth: 1,
    borderColor: "#333",
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: "#FFF", fontSize: 16, height: "100%" },
  forgotPass: { alignSelf: "flex-end", marginBottom: 20 },
  forgotPassText: { color: "#FF0099", fontSize: 14, fontWeight: "600" },
  buttonShadow: {
    shadowColor: "#FF0055",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  primaryButton: {
    flexDirection: "row",
    height: 60,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
    letterSpacing: 1,
  },
  socialContainer: { marginTop: 30, alignItems: "center" },
  orText: { color: "#666", marginBottom: 20 },
  socialIcons: { flexDirection: "row", justifyContent: "center", gap: 20 },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#252540",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: { color: "#AAA", fontSize: 15 },
  footerLink: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
