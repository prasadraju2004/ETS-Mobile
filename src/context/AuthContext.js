import React, { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = async (token, userData) => {
    setIsLoading(true);
    setUserToken(token);
    setUser(userData);
    await SecureStore.setItemAsync("userToken", token);
    if (userData) {
      await SecureStore.setItemAsync("userData", JSON.stringify(userData));
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userData");
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await SecureStore.getItemAsync("userToken");
      let userData = await SecureStore.getItemAsync("userData");
      setUserToken(token);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, user }}>
      {children}
    </AuthContext.Provider>
  );
};
