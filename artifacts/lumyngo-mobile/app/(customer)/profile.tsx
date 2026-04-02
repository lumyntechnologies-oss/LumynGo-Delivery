import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function CustomerProfile() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/onboarding");
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20) }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={[styles.name, { color: colors.foreground }]}>{user?.name}</Text>
          <Text style={[styles.phone, { color: colors.mutedForeground }]}>{user?.phone}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: "#172554" }]}>
          <Text style={[styles.roleText, { color: colors.primary }]}>Customer</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable style={styles.menuItem} onPress={() => router.push("/(customer)/")}>
          <View style={styles.menuLeft}>
            <Feather name="package" size={18} color={colors.mutedForeground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>My Orders</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable style={styles.menuItem} onPress={handleLogout}>
          <View style={styles.menuLeft}>
            <Feather name="log-out" size={18} color="#ef4444" />
            <Text style={[styles.menuLabel, { color: "#ef4444" }]}>Sign Out</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 24 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  name: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  phone: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  roleBadge: { marginLeft: "auto", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  section: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginHorizontal: 16 },
});
