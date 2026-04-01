import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getAvailableOrders, Order } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const STATUS_COLOR: Record<string, string> = {
  ACCEPTED: "#3b82f6", PICKED: "#8b5cf6", IN_TRANSIT: "#06b6d4", DELIVERED: "#22c55e",
};

export default function RiderDeliveries() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAvailableOrders(user.id);
      const all = data.activeOrder ? [data.activeOrder] : [];
      setOrders(all);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color="#22c55e" size="large" /></View>;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingBottom: insets.bottom + 100 }]}
        ListHeaderComponent={
          <Text style={[styles.title, { color: colors.foreground }]}>My Deliveries</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
              <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] ?? "#64748b") + "20" }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] ?? "#64748b" }]}>{item.status}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.price, { color: colors.foreground }]}>KES {item.price.toLocaleString()}</Text>
                <Text style={[styles.earning, { color: "#22c55e" }]}>+{Math.round(item.price * 0.8).toLocaleString()} earned</Text>
              </View>
            </View>
            <Text style={[styles.addr, { color: colors.foreground }]} numberOfLines={1}>
              <Text style={{ color: "#22c55e" }}>▲ </Text>{item.pickupAddress}
            </Text>
            <Text style={[styles.addr, { color: colors.foreground }]} numberOfLines={1}>
              <Text style={{ color: "#ef4444" }}>▼ </Text>{item.dropoffAddress}
            </Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {item.distance.toFixed(1)} km · {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="package" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No deliveries</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Accept orders to see them here</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#22c55e" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16 },
  title: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  price: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  earning: { fontSize: 12, fontFamily: "Inter_500Medium" },
  addr: { fontSize: 13, fontFamily: "Inter_400Regular" },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
