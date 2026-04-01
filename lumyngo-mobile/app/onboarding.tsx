import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, UserRole } from "@/context/AuthContext";
import { registerUser } from "@/lib/api";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!name.trim() || !phone.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (phone.trim().length < 9) {
      setError("Enter a valid phone number");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError("");
    try {
      const user = await registerUser({ name: name.trim(), phone: phone.trim(), role });
      await login({ id: user.id, name: user.name, phone: user.phone, role: user.role as UserRole });
      router.replace(role === "RIDER" ? "/(rider)/" : "/(customer)/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <LinearGradient
            colors={["#2563eb", "#3b82f6"]}
            style={styles.logoBox}
          >
            <Feather name="zap" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.logoText}>LumynGo</Text>
        </View>

        <Text style={styles.heading}>Get started</Text>
        <Text style={styles.sub}>Create your account to continue</Text>

        {/* Role Selector */}
        <View style={styles.roleRow}>
          {(["CUSTOMER", "RIDER"] as UserRole[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => { setRole(r); Haptics.selectionAsync(); }}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
            >
              <Feather
                name={r === "CUSTOMER" ? "package" : "truck"}
                size={20}
                color={role === r ? "#3b82f6" : "#64748b"}
              />
              <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                {r === "CUSTOMER" ? "Send Packages" : "Deliver"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrap}>
            <Feather name="user" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Jane Mwangi"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrap}>
            <Feather name="phone" size={16} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+254 7XX XXX XXX"
              placeholderTextColor="#475569"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={handleStart}
          disabled={loading}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient colors={["#2563eb", "#3b82f6"]} style={styles.ctaGradient}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Continue</Text>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 48 },
  logoBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 24, fontWeight: "700", color: "#f8fafc", fontFamily: "Inter_700Bold" },
  heading: { fontSize: 32, fontWeight: "700", color: "#f8fafc", fontFamily: "Inter_700Bold", marginBottom: 8 },
  sub: { fontSize: 15, color: "#64748b", marginBottom: 32, fontFamily: "Inter_400Regular" },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 28 },
  roleBtn: {
    flex: 1, borderRadius: 14, padding: 16, backgroundColor: "#1e293b",
    borderWidth: 1.5, borderColor: "#334155",
    alignItems: "center", gap: 8,
  },
  roleBtnActive: { borderColor: "#3b82f6", backgroundColor: "#172554" },
  roleBtnText: { fontSize: 13, fontWeight: "600", color: "#64748b", fontFamily: "Inter_600SemiBold" },
  roleBtnTextActive: { color: "#3b82f6" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", color: "#94a3b8", marginBottom: 8, letterSpacing: 0.5, fontFamily: "Inter_600SemiBold" },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1e293b", borderWidth: 1.5, borderColor: "#334155",
    borderRadius: 14, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 48, color: "#f8fafc", fontSize: 15, fontFamily: "Inter_400Regular" },
  error: { color: "#ef4444", fontSize: 13, marginBottom: 12, fontFamily: "Inter_400Regular" },
  cta: { marginTop: 24, borderRadius: 16, overflow: "hidden" },
  ctaGradient: { height: 54, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
