import React, { createContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);

  const login = async (token) => {
    setIsLoading(true);
    setUserToken(token);
    await SecureStore.setItemAsync("userToken", token);
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    await SecureStore.deleteItemAsync("userToken");
    setIsLoading(false);
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await SecureStore.getItemAsync("userToken");
      setUserToken(token);
    } catch (e) {
      console.log(`Login Status Error: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken }}>
      {children}
    </AuthContext.Provider>
  );
};
