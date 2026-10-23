import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

const API ="http://10.0.2.2:5000/api";

type Loan = {
  id: string;
  friendName: string;
  amount: string;
  dueDate: string;
  status: "PENDING" | "REPAID";
  repaidAt: string | null;
};

type Summary = {
  totalLent: string;
  totalRepaid: string;
  overdueAmount: string;
};

const zero: Summary = {
  totalLent: "0.00",
  totalRepaid: "0.00",
  overdueAmount: "0.00",
};

async function call(path: string, token?: string, method = "GET", body?: unknown) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

const money = (value: string | number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const overdue = (loan: Loan) =>
  loan.status === "PENDING" && loan.dueDate < new Date().toISOString().slice(0, 10);

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary>(zero);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<"home" | "add">("home");
  const [friend, setFriend] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("miniledger_token")
      .then((savedToken) => {
        if (savedToken) setToken(savedToken);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (token) void refresh();
  }, [token]);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [loanData, summaryData] = await Promise.all([
        call("/loans", token),
        call("/summary", token),
      ]);
      setLoans(loanData.loans || []);
      setSummary(summaryData.summary || zero);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load");
    } finally {
      setLoading(false);
    }
  }

  async function requestOtp() {
    setError("");
    if (phone.trim().length < 7) {
      setError("Enter a valid phone number.");
      return;
    }
    setLoading(true);
    try {
      await call("/auth/send-otp", undefined, "POST", { phone: phone.trim() });
      setSent(true);
      Alert.alert("OTP generated", "Check the backend terminal for the six-digit OTP.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not request OTP");
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit OTP shown in the backend terminal.");
      return;
    }
    setLoading(true);
    try {
      const data = await call("/auth/verify-otp", undefined, "POST", {
        phone: phone.trim(),
        otp,
      });
      await AsyncStorage.setItem("miniledger_token", data.token);
      setToken(data.token);
      setOtp("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await AsyncStorage.removeItem("miniledger_token").catch(() => {});
    setToken(null);
    setLoans([]);
    setSummary(zero);
    setSent(false);
    setOtp("");
    setScreen("home");
  }

  async function addLoan() {
    setError("");
    if (!friend.trim()) {
      setError("Enter your friend's name.");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      setError("Enter a positive amount with up to two decimal places.");
      return;
    }
    const parsedDate = new Date(`${due}T00:00:00Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(due) ||
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== due
    ) {
      setError("Use a valid date in YYYY-MM-DD format.");
      return;
    }

    setLoading(true);
    try {
      await call("/loans", token || undefined, "POST", {
        friendName: friend.trim(),
        amount,
        dueDate: due,
      });
      setFriend("");
      setAmount("");
      setScreen("home");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add loan");
    } finally {
      setLoading(false);
    }
  }

  async function repay(loan: Loan) {
    try {
      await call(`/loans/${loan.id}/repay`, token || undefined, "PATCH");
      await refresh();
    } catch (e) {
      Alert.alert("Could not repay", e instanceof Error ? e.message : "Please try again.");
    }
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.safe}>
        <ExpoStatusBar style="dark" />
        <KeyboardAvoidingView
          style={styles.center}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.loginCard}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>₹</Text>
            </View>
            <Text style={styles.title}>MiniLedger</Text>
            <Text style={styles.sub}>Keep track of money lent to friends.</Text>
            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            {sent && (
              <>
                <Text style={styles.label}>Six-digit OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="OTP from backend terminal"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </>
            )}
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable
              style={styles.button}
              disabled={loading}
              onPress={() => void (sent ? login() : requestOtp())}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{sent ? "Verify and sign in" : "Send OTP"}</Text>
              )}
            </Pressable>
            {sent && (
              <Pressable
                onPress={() => {
                  setSent(false);
                  setOtp("");
                }}
              >
                <Text style={styles.link}>Change phone number</Text>
              </Pressable>
            )}
            <Text style={styles.helper}>Mock OTP appears in the backend terminal. No SMS is sent.</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>MiniLedger</Text>
          <Text style={styles.subSmall}>Your lending overview</Text>
        </View>
        <Pressable onPress={() => void logout()}>
          <Text style={styles.link}>Log out</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total lent</Text>
        <Text style={styles.total}>{money(summary.totalLent)}</Text>
        <View style={styles.summaryRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Repaid</Text>
            <Text style={styles.summaryValue}>{money(summary.totalRepaid)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Overdue</Text>
            <Text style={styles.overdueValue}>{money(summary.overdueAmount)}</Text>
          </View>
        </View>
      </View>

      {screen === "add" ? (
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Add a loan</Text>
          <Text style={styles.label}>Friend's name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rahul"
            value={friend}
            onChangeText={setFriend}
          />
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="1500.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={styles.label}>Due date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-10-30"
            value={due}
            onChangeText={setDue}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.button} disabled={loading} onPress={() => void addLoan()}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save loan</Text>}
          </Pressable>
          <Pressable
            style={styles.cancel}
            onPress={() => {
              setScreen("home");
              setError("");
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.listArea}>
          <View style={styles.sectionRow}>
            <Text style={styles.heading}>Your loans</Text>
            <Pressable
              style={styles.addBtn}
              onPress={() => {
                setError("");
                setScreen("add");
              }}
            >
              <Text style={styles.addText}>+ Add loan</Text>
            </Pressable>
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {loading && loans.length === 0 ? (
            <ActivityIndicator style={{ marginTop: 24 }} size="large" color="#23675a" />
          ) : (
            <FlatList
              data={loans}
              keyExtractor={(item) => item.id}
              refreshing={loading}
              onRefresh={() => void refresh()}
              contentContainerStyle={loans.length ? styles.loanList : styles.emptyList}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No loans yet</Text>
                  <Text style={styles.sub}>Add your first loan to get started.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isLate = overdue(item);
                return (
                  <View style={[styles.loanCard, isLate && styles.lateCard]}>
                    <View style={styles.loanRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.friend}>{item.friendName}</Text>
                        <Text style={styles.due}>Due {item.dueDate}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.loanAmount}>{money(item.amount)}</Text>
                        <View
                          style={[
                            styles.badge,
                            isLate ? styles.red : item.status === "REPAID" ? styles.green : styles.amber,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              isLate
                                ? styles.redText
                                : item.status === "REPAID"
                                  ? styles.greenText
                                  : styles.amberText,
                            ]}
                          >
                            {isLate ? "OVERDUE" : item.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {item.status === "PENDING" && (
                      <Pressable style={styles.repay} onPress={() => void repay(item)}>
                        <Text style={styles.repayText}>Mark as repaid ✓</Text>
                      </Pressable>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  center: { flex: 1, justifyContent: "center", padding: 22 },
  loginCard: { backgroundColor: "white", borderRadius: 24, padding: 24, elevation: 3 },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#dcefe9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoText: { color: "#1c6657", fontSize: 30, fontWeight: "800" },
  title: { fontSize: 30, fontWeight: "800", color: "#18352f" },
  sub: { fontSize: 14, color: "#6b7b83", lineHeight: 21, marginTop: 5, marginBottom: 18 },
  label: { color: "#334e58", fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#d9e1e8",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#18352f",
    fontSize: 15,
  },
  button: {
    marginTop: 18,
    backgroundColor: "#23675a",
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  buttonText: { color: "white", fontWeight: "800", fontSize: 15 },
  link: { color: "#23675a", fontWeight: "700", paddingVertical: 12 },
  helper: { color: "#87939a", fontSize: 12, lineHeight: 17, marginTop: 12, textAlign: "center" },
  error: { color: "#b42318", marginTop: 10, lineHeight: 19 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontSize: 25, fontWeight: "800", color: "#18352f" },
  subSmall: { fontSize: 13, color: "#718096", marginTop: 3 },
  summary: { backgroundColor: "#173f36", marginHorizontal: 18, borderRadius: 22, padding: 20 },
  summaryLabel: { color: "#c8ded7", fontSize: 13 },
  total: { color: "white", fontSize: 32, fontWeight: "800", marginTop: 4, marginBottom: 18 },
  summaryRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#41675e", paddingTop: 14 },
  summaryValue: { color: "white", fontSize: 17, fontWeight: "700", marginTop: 4 },
  overdueValue: { color: "#ffb4ab", fontSize: 17, fontWeight: "800", marginTop: 4 },
  listArea: { flex: 1, paddingHorizontal: 18, paddingTop: 22 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heading: { fontSize: 20, fontWeight: "800", color: "#1b3832" },
  addBtn: { backgroundColor: "#dcefe9", borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  addText: { color: "#1c6657", fontWeight: "800" },
  loanList: { paddingBottom: 28, gap: 11 },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  empty: { alignItems: "center", padding: 24 },
  emptyTitle: { color: "#18352f", fontSize: 18, fontWeight: "800" },
  loanCard: { backgroundColor: "white", borderRadius: 16, padding: 15, borderWidth: 1, borderColor: "#e5ebef" },
  lateCard: { borderColor: "#f2a7a0", backgroundColor: "#fff8f7" },
  loanRow: { flexDirection: "row", alignItems: "center" },
  friend: { fontSize: 16, fontWeight: "800", color: "#18352f" },
  due: { color: "#718096", fontSize: 12, marginTop: 5 },
  loanAmount: { fontSize: 17, fontWeight: "800", color: "#18352f" },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 20, marginTop: 6 },
  red: { backgroundColor: "#fee4e2" },
  green: { backgroundColor: "#dcfae6" },
  amber: { backgroundColor: "#fff0c2" },
  badgeText: { fontSize: 10, fontWeight: "900" },
  redText: { color: "#b42318" },
  greenText: { color: "#067647" },
  amberText: { color: "#854a0e" },
  repay: { marginTop: 13, borderTopWidth: 1, borderTopColor: "#edf0f2", paddingTop: 11 },
  repayText: { color: "#23675a", fontWeight: "800", fontSize: 13 },
  form: { padding: 20, paddingBottom: 40 },
  cancel: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#d9e1e8",
    borderRadius: 12,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: "#334e58", fontWeight: "700" },
});
