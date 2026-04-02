import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function AuthGate() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/onboarding");
    } else if (user.role === "RIDER") {
      router.replace("/(rider)/");
    } else {
      router.replace("/(customer)/");
    }
  }, [user, loading]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#3b82f6" size="large" />
    </View>
  );
}
