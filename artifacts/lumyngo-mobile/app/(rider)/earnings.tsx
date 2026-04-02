import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getRiderEarnings } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

interface EarningsData {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  deliveries: number;
}

export default function RiderEarnings() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getRiderEarnings(user.id)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color="#22c55e" size="large" /></View>;
  }

  const stats = [
    { label: "Today", value: data?.today ?? 0, icon: "sun" as const, color: "#f59e0b" },
    { label: "This Week", value: data?.thisWeek ?? 0, icon: "trending-up" as const, color: "#22c55e" },
    { label: "This Month", value: data?.thisMonth ?? 0, icon: "calendar" as const, color: "#3b82f6" },
    { label: "Total", value: data?.total ?? 0, icon: "dollar-sign" as const, color: "#8b5cf6" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 100 }]}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Earnings</Text>

      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: s.color + "20" }]}>
              <Feather name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              KES {s.value.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="info" size={14} color={colors.mutedForeground} />
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          You earn 80% of each delivery fare. Payments are processed after delivery confirmation.
        </Text>
      </View>

      <View style={[styles.deliveriesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.deliveriesLabel, { color: colors.mutedForeground }]}>TOTAL DELIVERIES</Text>
        <Text style={[styles.deliveriesCount, { color: colors.foreground }]}>{data?.deliveries ?? 0}</Text>
        <Text style={[styles.deliveriesSub, { color: colors.mutedForeground }]}>completed trips</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  statCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 20, fontWeight: "700", fontFamily: "Inter_700Bold" },
  infoCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  deliveriesCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 4 },
  deliveriesLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 1, fontFamily: "Inter_600SemiBold" },
  deliveriesCount: { fontSize: 48, fontWeight: "700", fontFamily: "Inter_700Bold" },
  deliveriesSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
