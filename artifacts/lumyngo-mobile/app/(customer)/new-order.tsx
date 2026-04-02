import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { createOrder, getPriceEstimate, PriceEstimate } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const LOCATIONS = [
  { label: "CBD", lat: -1.2921, lng: 36.8219 },
  { label: "Westlands", lat: -1.2689, lng: 36.8073 },
  { label: "Karen", lat: -1.3173, lng: 36.7065 },
  { label: "Kilimani", lat: -1.2908, lng: 36.7889 },
  { label: "Ngong Rd", lat: -1.3031, lng: 36.7822 },
  { label: "Thika Rd", lat: -1.2195, lng: 36.8872 },
];

export default function NewOrderScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();

  const [step, setStep] = useState<"form" | "estimate">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);

  const [pickupLabel, setPickupLabel] = useState("");
  const [dropoffLabel, setDropoffLabel] = useState("");
  const [pickup, setPickup] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoff, setDropoff] = useState<{ lat: number; lng: number } | null>(null);
  const [notes, setNotes] = useState("");

  const handleEstimate = async () => {
    if (!pickup || !dropoff) {
      setError("Select pickup and dropoff from quick-select");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const est = await getPriceEstimate(user!.id, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
      setEstimate(est);
      setStep("estimate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to estimate");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!pickup || !dropoff) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const order = await createOrder(user!.id, {
        pickupAddress: pickupLabel,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffAddress: dropoffLabel,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        notes: notes.trim() || undefined,
      });
      router.push(`/track/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {step === "form" ? "New Delivery" : "Confirm Order"}
        </Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: "#ef444415", borderColor: "#ef444440" }]}>
            <Feather name="alert-circle" size={14} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {step === "form" && (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>PICKUP</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Pickup address"
              placeholderTextColor={colors.mutedForeground}
              value={pickupLabel}
              onChangeText={setPickupLabel}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {LOCATIONS.map((l) => (
                <Pressable
                  key={l.label}
                  onPress={() => { setPickupLabel(l.label); setPickup({ lat: l.lat, lng: l.lng }); }}
                  style={[
                    styles.chip,
                    { backgroundColor: pickupLabel === l.label ? "#172554" : colors.card, borderColor: pickupLabel === l.label ? colors.primary : colors.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: pickupLabel === l.label ? colors.primary : colors.mutedForeground }]}>{l.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>DROPOFF</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Dropoff address"
              placeholderTextColor={colors.mutedForeground}
              value={dropoffLabel}
              onChangeText={setDropoffLabel}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
              {LOCATIONS.map((l) => (
                <Pressable
                  key={l.label}
                  onPress={() => { setDropoffLabel(l.label); setDropoff({ lat: l.lat, lng: l.lng }); }}
                  style={[
                    styles.chip,
                    { backgroundColor: dropoffLabel === l.label ? "#172554" : colors.card, borderColor: dropoffLabel === l.label ? colors.primary : colors.border },
                  ]}
                >
                  <Text style={[styles.chipText, { color: dropoffLabel === l.label ? colors.primary : colors.mutedForeground }]}>{l.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Any special instructions..."
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <Pressable onPress={handleEstimate} disabled={loading} style={styles.ctaWrap}>
              <LinearGradient colors={["#2563eb", "#3b82f6"]} style={styles.cta}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Get Price</Text>}
              </LinearGradient>
            </Pressable>
          </>
        )}

        {step === "estimate" && estimate && (
          <>
            <View style={[styles.routeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: "#22c55e" }]} />
                <Text style={[styles.routeAddr, { color: colors.foreground }]}>{pickupLabel}</Text>
              </View>
              <View style={[styles.routeSep, { borderColor: colors.border }]} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, { backgroundColor: "#ef4444" }]} />
                <Text style={[styles.routeAddr, { color: colors.foreground }]}>{dropoffLabel}</Text>
              </View>
            </View>

            <View style={[styles.priceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>PRICE BREAKDOWN</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Base fare</Text>
                <Text style={[styles.priceVal, { color: colors.foreground }]}>KES {estimate.breakdown.baseFare}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Distance ({estimate.distance.toFixed(1)} km)</Text>
                <Text style={[styles.priceVal, { color: colors.foreground }]}>KES {estimate.breakdown.distanceCharge}</Text>
              </View>
              {estimate.breakdown.surgeMultiplier > 1 && (
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: "#f59e0b" }]}>Surge ×{estimate.breakdown.surgeMultiplier}</Text>
                  <Text style={[styles.priceVal, { color: "#f59e0b" }]}>Active</Text>
                </View>
              )}
              <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
                <Text style={[styles.totalVal, { color: colors.primary }]}>KES {estimate.price.toLocaleString()}</Text>
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: "#ef444415", borderColor: "#ef444440" }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.btnRow}>
              <Pressable onPress={() => setStep("form")} style={[styles.backBtn, { borderColor: colors.border }]}>
                <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>Back</Text>
              </Pressable>
              <Pressable onPress={handleCreate} disabled={loading} style={styles.ctaWrap2}>
                <LinearGradient colors={["#2563eb", "#3b82f6"]} style={styles.cta}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Place Order</Text>}
                </LinearGradient>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 0 },
  title: { fontSize: 26, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 20 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  errorText: { color: "#ef4444", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  label: { fontSize: 11, fontWeight: "600", letterSpacing: 1, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  textArea: { height: 80, textAlignVertical: "top" },
  chips: { marginTop: 10, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, marginRight: 8 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ctaWrap: { marginTop: 28, borderRadius: 16, overflow: "hidden" },
  cta: { height: 54, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  routeCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeAddr: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  routeSep: { borderLeftWidth: 2, borderStyle: "dashed", height: 16, marginLeft: 4, marginVertical: 4 },
  priceCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 10 },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  priceVal: { fontSize: 13, fontFamily: "Inter_500Medium" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1 },
  totalLabel: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  totalVal: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  backBtn: { flex: 1, borderWidth: 1.5, borderRadius: 16, height: 54, alignItems: "center", justifyContent: "center" },
  backBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  ctaWrap2: { flex: 2, borderRadius: 16, overflow: "hidden" },
});
