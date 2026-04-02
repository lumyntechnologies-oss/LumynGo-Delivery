import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { acceptOrder, getAvailableOrders, Order, updateOrderStatus } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

export default function RiderHome() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const [pending, setPending] = useState<Order[]>([]);
  const [active, setActive] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAvailableOrders(user.id);
      setPending(data.pendingOrders);
      setActive(data.activeOrder);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { fetch(); const t = setInterval(fetch, 12000); return () => clearInterval(t); }, [fetch]);

  const handleAccept = async (orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAccepting(orderId);
    try {
      const order = await acceptOrder(user!.id, orderId);
      setActive(order);
      setPending((p) => p.filter((o) => o.id !== orderId));
    } catch {}
    setAccepting(null);
  };

  const nextStatus: Record<string, string> = { ACCEPTED: "PICKED", PICKED: "IN_TRANSIT", IN_TRANSIT: "DELIVERED" };
  const nextLabel: Record<string, string> = { ACCEPTED: "Mark Picked Up", PICKED: "Start Transit", IN_TRANSIT: "Mark Delivered" };

  const handleUpdateStatus = async () => {
    if (!active || !nextStatus[active.status]) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setUpdatingStatus(true);
    try {
      const updated = await updateOrderStatus(user!.id, active.id, nextStatus[active.status]);
      if (nextStatus[active.status] === "DELIVERED") { setActive(null); fetch(); }
      else setActive(updated);
    } catch {}
    setUpdatingStatus(false);
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color="#22c55e" size="large" /></View>;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={isOnline ? pending : []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingBottom: insets.bottom + 100 }]}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome</Text>
                <Text style={[styles.name, { color: colors.foreground }]}>{user?.name}</Text>
              </View>
              <View style={styles.onlineRow}>
                <Text style={[styles.onlineLabel, { color: isOnline ? "#22c55e" : colors.mutedForeground }]}>
                  {isOnline ? "Online" : "Offline"}
                </Text>
                <Switch
                  value={isOnline}
                  onValueChange={(v) => { setIsOnline(v); Haptics.selectionAsync(); }}
                  trackColor={{ false: colors.border, true: "#22c55e40" }}
                  thumbColor={isOnline ? "#22c55e" : colors.mutedForeground}
                />
              </View>
            </View>

            {/* Active delivery */}
            {active && (
              <View style={[styles.activeCard, { backgroundColor: "#172554", borderColor: "#3b82f660" }]}>
                <View style={styles.activeHeader}>
                  <View style={[styles.activeDot]} />
                  <Text style={[styles.activeTitle, { color: "#60a5fa" }]}>Active Delivery</Text>
                  <Text style={[styles.activePrice, { color: colors.foreground }]}>KES {active.price.toLocaleString()}</Text>
                </View>
                <Text style={[styles.activeAddr, { color: colors.foreground }]} numberOfLines={1}>
                  <Text style={{ color: "#22c55e" }}>▲ </Text>{active.pickupAddress}
                </Text>
                <Text style={[styles.activeAddr, { color: colors.foreground }]} numberOfLines={1}>
                  <Text style={{ color: "#ef4444" }}>▼ </Text>{active.dropoffAddress}
                </Text>
                {active.customer && (
                  <Text style={[styles.activeCustomer, { color: colors.mutedForeground }]}>
                    Customer: {active.customer.name}
                  </Text>
                )}
                {nextStatus[active.status] && (
                  <Pressable onPress={handleUpdateStatus} disabled={updatingStatus} style={[styles.statusBtn, { backgroundColor: "#22c55e" }]}>
                    {updatingStatus
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.statusBtnText}>{nextLabel[active.status]}</Text>}
                  </Pressable>
                )}
              </View>
            )}

            {!active && (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {isOnline ? `Available Orders (${pending.length})` : "Go online to receive orders"}
              </Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.orderHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.orderAddr, { color: colors.foreground }]} numberOfLines={1}>
                  <Text style={{ color: "#22c55e" }}>▲ </Text>{item.pickupAddress}
                </Text>
                <Text style={[styles.orderAddr, { color: colors.foreground }]} numberOfLines={1}>
                  <Text style={{ color: "#ef4444" }}>▼ </Text>{item.dropoffAddress}
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={[styles.orderPrice, { color: colors.foreground }]}>KES {item.price.toLocaleString()}</Text>
                <Text style={[styles.orderEarning, { color: "#22c55e" }]}>+{Math.round(item.price * 0.8).toLocaleString()}</Text>
                <Text style={[styles.orderDist, { color: colors.mutedForeground }]}>{item.distance.toFixed(1)} km</Text>
              </View>
            </View>
            <Pressable
              onPress={() => handleAccept(item.id)}
              disabled={!!accepting || !!active}
              style={({ pressed }) => [styles.acceptBtn, { backgroundColor: "#22c55e", opacity: (accepting || active) ? 0.5 : pressed ? 0.85 : 1 }]}
            >
              {accepting === item.id
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Feather name="truck" size={16} color="#fff" /><Text style={styles.acceptBtnText}>Accept</Text></>}
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          !active ? (
            <View style={styles.empty}>
              <Feather name="truck" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {isOnline ? "No orders available" : "You're offline"}
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                {isOnline ? "New orders will appear here" : "Toggle online to start receiving orders"}
              </Text>
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#22c55e" />}
        scrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, gap: 0 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  onlineLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  sectionLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  activeCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 16, gap: 8 },
  activeHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
  activeTitle: { flex: 1, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  activePrice: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  activeAddr: { fontSize: 13, fontFamily: "Inter_400Regular" },
  activeCustomer: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusBtn: { height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 4 },
  statusBtnText: { color: "#fff", fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  orderCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  orderHeader: { flexDirection: "row", gap: 12, marginBottom: 12 },
  orderAddr: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  orderRight: { alignItems: "flex-end" },
  orderPrice: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  orderEarning: { fontSize: 12, fontFamily: "Inter_500Medium" },
  orderDist: { fontSize: 11, fontFamily: "Inter_400Regular" },
  acceptBtn: { height: 42, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  acceptBtnText: { color: "#fff", fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 24 },
});
