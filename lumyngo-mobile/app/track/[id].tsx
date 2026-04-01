import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getOrder, Order } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const STEPS = ["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT", "DELIVERED"];
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b", ACCEPTED: "#3b82f6", PICKED: "#8b5cf6",
  IN_TRANSIT: "#06b6d4", DELIVERED: "#22c55e", CANCELLED: "#ef4444",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", ACCEPTED: "Accepted", PICKED: "Picked Up",
  IN_TRANSIT: "In Transit", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    if (!user || !id) return;
    try {
      const data = await getOrder(user.id, id);
      setOrder(data);
    } catch {}
    setLoading(false);
  }, [user, id]);

  useEffect(() => {
    fetchOrder();
    const t = setInterval(fetchOrder, 8000);
    return () => clearInterval(t);
  }, [fetchOrder]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Order not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const stepIdx = STEPS.indexOf(order.status);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.nav, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 8), borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>Track Order</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}>
        {/* Status Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardTop}>
            <View style={[styles.badge, { backgroundColor: STATUS_COLOR[order.status] + "20" }]}>
              <View style={[styles.dot, { backgroundColor: STATUS_COLOR[order.status] }]} />
              <Text style={[styles.badgeText, { color: STATUS_COLOR[order.status] }]}>
                {STATUS_LABEL[order.status] ?? order.status}
              </Text>
            </View>
            <Text style={[styles.price, { color: colors.foreground }]}>KES {order.price.toLocaleString()}</Text>
          </View>

          {order.status !== "CANCELLED" && (
            <View style={styles.stepsWrap}>
              <View style={[styles.stepsTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.stepsProgress, {
                  backgroundColor: colors.primary,
                  width: `${Math.max(0, (stepIdx / (STEPS.length - 1)) * 100)}%`,
                }]} />
              </View>
              <View style={styles.stepsRow}>
                {STEPS.map((s, i) => (
                  <View key={s} style={styles.stepItem}>
                    <View style={[
                      styles.stepCircle,
                      i <= stepIdx
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.background, borderColor: colors.border },
                    ]}>
                      {i < stepIdx && <Feather name="check" size={10} color="#fff" />}
                      {i === stepIdx && <View style={styles.stepActive} />}
                    </View>
                    <Text style={[styles.stepLabel, { color: i <= stepIdx ? colors.primary : colors.mutedForeground }]}>
                      {STATUS_LABEL[s]?.split(" ")[0]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Route */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ROUTE</Text>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: "#22c55e" }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.routeMeta, { color: colors.mutedForeground }]}>Pickup</Text>
              <Text style={[styles.routeAddr, { color: colors.foreground }]}>{order.pickupAddress}</Text>
            </View>
          </View>
          <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: "#ef4444" }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.routeMeta, { color: colors.mutedForeground }]}>Dropoff</Text>
              <Text style={[styles.routeAddr, { color: colors.foreground }]}>{order.dropoffAddress}</Text>
            </View>
          </View>
          {order.notes && (
            <View style={[styles.notesRow, { borderTopColor: colors.border }]}>
              <Feather name="message-square" size={13} color={colors.mutedForeground} />
              <Text style={[styles.notesText, { color: colors.mutedForeground }]}>{order.notes}</Text>
            </View>
          )}
        </View>

        {/* Rider */}
        {order.rider && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>YOUR RIDER</Text>
            <View style={styles.riderRow}>
              <View style={[styles.riderAvatar, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.riderAvatarText, { color: colors.primary }]}>
                  {order.rider.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.riderName, { color: colors.foreground }]}>{order.rider.name}</Text>
              {order.rider.phone && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(`tel:${order.rider!.phone}`);
                  }}
                  style={[styles.callBtn, { backgroundColor: "#22c55e20", borderColor: "#22c55e40" }]}
                >
                  <Feather name="phone" size={16} color="#22c55e" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        <Text style={[styles.footerMeta, { color: colors.mutedForeground }]}>
          {order.distance.toFixed(1)} km · Auto-refreshing every 8s
        </Text>
      </ScrollView>
    </View>
  );
}

import { Platform } from "react-native";

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  backLink: { marginTop: 8 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 17, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  price: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  stepsWrap: { gap: 8 },
  stepsTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  stepsProgress: { height: "100%", borderRadius: 2 },
  stepsRow: { flexDirection: "row", justifyContent: "space-between" },
  stepItem: { alignItems: "center", gap: 4 },
  stepCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  stepActive: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  stepLabel: { fontSize: 9, fontFamily: "Inter_500Medium" },
  sectionLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  routeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  routeMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  routeAddr: { fontSize: 14, fontFamily: "Inter_500Medium" },
  routeLine: { width: 2, height: 16, marginLeft: 4, marginVertical: 4 },
  notesRow: { flexDirection: "row", gap: 8, paddingTop: 12, borderTopWidth: 1, marginTop: 8 },
  notesText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  riderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  riderAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  riderAvatarText: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  riderName: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  callBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  footerMeta: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular" },
});
