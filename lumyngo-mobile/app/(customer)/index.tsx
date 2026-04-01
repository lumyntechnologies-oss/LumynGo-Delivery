import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getMyOrders, Order } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b",
  ACCEPTED: "#3b82f6",
  PICKED: "#8b5cf6",
  IN_TRANSIT: "#06b6d4",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  PICKED: "Picked Up",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function CustomerHome() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMyOrders(user.id);
      setOrders(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const onRefresh = () => { setRefreshing(true); fetch(); };

  const active = orders.filter((o) => ["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT"].includes(o.status));
  const past = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));

  const renderOrder = ({ item }: { item: Order }) => (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/track/${item.id}`);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + "20" }]}>
          <View style={[styles.dot, { backgroundColor: STATUS_COLOR[item.status] }]} />
          <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>
            {STATUS_LABEL[item.status] ?? item.status}
          </Text>
        </View>
        <Text style={[styles.price, { color: colors.foreground }]}>KES {item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.route}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: "#22c55e" }]} />
          <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>{item.pickupAddress}</Text>
        </View>
        <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: "#ef4444" }]} />
          <Text style={[styles.routeText, { color: colors.foreground }]} numberOfLines={1}>{item.dropoffAddress}</Text>
        </View>
      </View>
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.distance.toFixed(1)} km</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={renderOrder}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingBottom: insets.bottom + 100 },
        ]}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
                <Text style={[styles.name, { color: colors.foreground }]}>{user?.name}</Text>
              </View>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/new-order"); }}
                style={[styles.newBtn, { backgroundColor: colors.primary }]}
              >
                <Feather name="plus" size={20} color="#fff" />
              </Pressable>
            </View>
            {active.length > 0 && (
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Active</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="package" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No orders yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Tap + to send your first package</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        scrollEnabled={orders.length > 0}
      />
    </View>
  );
}

import { Platform } from "react-native";

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, gap: 0 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  newBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 11, fontWeight: "600", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  price: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  route: { gap: 4, marginBottom: 12 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  routeLine: { width: 2, height: 12, marginLeft: 3 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1 },
  meta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
