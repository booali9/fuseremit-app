import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Fonts from "../../../constants/Fonts";
import { Transaction, repeatTransfer, getTransactionById } from "../../../services/paymentApi";

const STATUS_STEPS = [
  { key: "initiated", label: "Transfer Initiated" },
  { key: "processing", label: "Processing" },
  { key: "sent", label: "Sent to Bank" },
  { key: "delivered", label: "Delivered" },
];

const FAILED_STEP = { key: "failed", label: "Failed" };

const stepIndex = (status: string): number => {
  if (status === "failed") return -1;
  return STATUS_STEPS.findIndex((s) => s.key === status);
};

const deliveryMethodLabel = (method?: string) => {
  if (method === "cash_pickup") return "Cash Pickup";
  if (method === "mobile_wallet") return "Mobile Wallet";
  return "Bank Transfer";
};

interface Props {
  navigation: any;
  route: { params: { transaction: Transaction } };
}

const HistoryDetail: React.FC<Props> = ({ navigation, route }) => {
  const { transaction: initial } = route.params;
  const [tx, setTx] = useState<Transaction>(initial);
  const [repeating, setRepeating] = useState(false);
  const [polling, setPolling] = useState(false);

  // Poll for status updates if not terminal
  useEffect(() => {
    if (tx.status === "delivered" || tx.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const updated = await getTransactionById(tx._id);
        setTx(updated);
        if (updated.status === "delivered" || updated.status === "failed") {
          clearInterval(interval);
        }
      } catch {
        // Non-fatal
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [tx._id, tx.status]);

  const handleRepeat = useCallback(async () => {
    Alert.alert(
      "Repeat Transfer",
      `Send $${tx.amount.toFixed(2)} to ${tx.recipientName ?? "recipient"} again?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setRepeating(true);
              const newTx = await repeatTransfer(tx._id);
              Alert.alert("Success", "Transfer initiated!", [
                { text: "View", onPress: () => setTx(newTx) },
                { text: "OK" },
              ]);
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Failed to repeat transfer");
            } finally {
              setRepeating(false);
            }
          },
        },
      ],
    );
  }, [tx]);

  const currentStep = stepIndex(tx.status);
  const isFailed = tx.status === "failed";

  const timelineEvents = tx.statusTimeline?.length
    ? tx.statusTimeline
    : STATUS_STEPS.slice(0, Math.max(currentStep + 1, 1)).map((s) => ({ status: s.key, label: s.label, timestamp: tx.createdAt }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Transfer Details</Text>
        <View style={{ width: moderateScale(22) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: responsiveHeight(6) }}>
        {/* Amount card */}
        <View style={styles.amountCard}>
          <View style={[styles.statusBadge, isFailed ? styles.failedBadge : styles.activeBadge]}>
            <Text style={styles.statusBadgeText}>
              {isFailed ? "Failed" : tx.status === "delivered" ? "Delivered" : "In Progress"}
            </Text>
          </View>
          <Text style={styles.amountLabel}>You sent</Text>
          <Text style={styles.amountValue}>${tx.amount.toFixed(2)} {tx.currency}</Text>
          {tx.amountReceived ? (
            <Text style={styles.receivedLabel}>
              Recipient gets {tx.amountReceived.toFixed(2)} {tx.receivedCurrency}
            </Text>
          ) : null}
        </View>

        {/* Progress tracker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transfer Progress</Text>

          {isFailed ? (
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, styles.stepDotFailed]}>
                <Ionicons name="close" size={moderateScale(12)} color="#fff" />
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepLabel, { color: "#FB002E" }]}>Transfer Failed</Text>
                <Text style={styles.stepTime}>{new Date(tx.updatedAt).toLocaleString()}</Text>
              </View>
            </View>
          ) : (
            STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const isActive = i === currentStep;
              const event = timelineEvents.find((e) => e.status === step.key);
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepTrack}>
                    <View style={[styles.stepDot, done ? styles.stepDotDone : styles.stepDotPending, isActive && styles.stepDotActive]}>
                      {done ? (
                        <Ionicons name="checkmark" size={moderateScale(10)} color="#fff" />
                      ) : (
                        <View style={styles.stepDotInner} />
                      )}
                    </View>
                    {i < STATUS_STEPS.length - 1 ? (
                      <View style={[styles.stepLine, done && i < currentStep ? styles.stepLineDone : styles.stepLinePending]} />
                    ) : null}
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={[styles.stepLabel, done ? styles.stepLabelDone : styles.stepLabelPending]}>{step.label}</Text>
                    {event?.timestamp ? (
                      <Text style={styles.stepTime}>{new Date(event.timestamp).toLocaleString()}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Transfer details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transfer Details</Text>
          {tx.recipientName ? renderRow("Recipient", tx.recipientName) : null}
          {tx.recipientBank ? renderRow("Bank", tx.recipientBank) : null}
          {tx.recipientAccount ? renderRow("Account", `****${tx.recipientAccount.slice(-4)}`) : null}
          {tx.recipientCountry ? renderRow("Country", tx.recipientCountry) : null}
          {renderRow("Delivery Method", deliveryMethodLabel(tx.deliveryMethod))}
          {renderRow("Amount Sent", `$${tx.amount.toFixed(2)} ${tx.currency}`)}
          {tx.amountReceived ? renderRow("Amount Received", `${tx.amountReceived.toFixed(2)} ${tx.receivedCurrency}`) : null}
          {tx.exchangeRate ? renderRow("Exchange Rate", `1 ${tx.currency} = ${tx.exchangeRate} ${tx.receivedCurrency ?? ""}`) : null}
          {renderRow("Fee", `$${(tx.fee ?? 0).toFixed(2)}`)}
          {renderRow("Date", new Date(tx.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }))}
          {renderRow("Reference", tx._id.slice(-8).toUpperCase())}
        </View>

        {/* Action buttons */}
        {tx.type === "transfer" && (tx.status === "delivered" || tx.status === "failed") ? (
          <TouchableOpacity
            style={[styles.repeatButton, repeating && styles.buttonDisabled]}
            onPress={handleRepeat}
            disabled={repeating}
          >
            {repeating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="repeat" size={moderateScale(18)} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.repeatButtonText}>Repeat Transfer</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const renderRow = (label: string, value: string) => (
  <View style={styles.row} key={label}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

export default HistoryDetail;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F7FB" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(2),
    backgroundColor: "#F6F7FB",
  },
  topTitle: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
    color: "#000",
  },
  amountCard: {
    backgroundColor: "#0B3963",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(16),
    padding: responsiveWidth(5),
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  statusBadge: {
    paddingHorizontal: responsiveWidth(3),
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: responsiveHeight(1.5),
  },
  activeBadge: { backgroundColor: "#1E5E9E" },
  failedBadge: { backgroundColor: "#7A1818" },
  statusBadgeText: { color: "#fff", fontSize: responsiveFontSize(1.3), fontFamily: Fonts.semiBold },
  amountLabel: { color: "#A8C4DE", fontSize: responsiveFontSize(1.5), fontFamily: Fonts.medium },
  amountValue: { color: "#fff", fontSize: responsiveFontSize(4), fontFamily: Fonts.bold, marginTop: 4 },
  receivedLabel: { color: "#A8C4DE", fontSize: responsiveFontSize(1.5), marginTop: 4, fontFamily: Fonts.medium },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: responsiveWidth(5),
    borderRadius: moderateScale(12),
    padding: responsiveWidth(4),
    marginBottom: responsiveHeight(2),
  },
  cardTitle: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.bold,
    color: "#111",
    marginBottom: responsiveHeight(2),
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  stepTrack: {
    alignItems: "center",
    width: moderateScale(28),
    marginRight: responsiveWidth(3),
  },
  stepDot: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotDone: { backgroundColor: "#0B3963" },
  stepDotActive: { backgroundColor: "#1568B8" },
  stepDotPending: { backgroundColor: "#E0E0E0" },
  stepDotFailed: { backgroundColor: "#FB002E" },
  stepDotInner: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: 4,
    backgroundColor: "#B0B0B0",
  },
  stepLine: {
    width: 2,
    height: responsiveHeight(4),
    marginTop: 2,
  },
  stepLineDone: { backgroundColor: "#0B3963" },
  stepLinePending: { backgroundColor: "#E0E0E0" },
  stepInfo: { flex: 1, paddingBottom: responsiveHeight(2) },
  stepLabel: { fontSize: responsiveFontSize(1.6), fontFamily: Fonts.semiBold },
  stepLabelDone: { color: "#111" },
  stepLabelPending: { color: "#B0B0B0" },
  stepTime: { fontSize: responsiveFontSize(1.3), color: "#888", marginTop: 2, fontFamily: Fonts.regular },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: responsiveHeight(1.2),
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  rowLabel: { fontSize: responsiveFontSize(1.5), color: "#666", fontFamily: Fonts.medium },
  rowValue: { fontSize: responsiveFontSize(1.5), fontFamily: Fonts.semiBold, color: "#111", maxWidth: "55%", textAlign: "right" },
  repeatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B3963",
    marginHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
    borderRadius: moderateScale(12),
    marginBottom: responsiveHeight(2),
  },
  buttonDisabled: { opacity: 0.6 },
  repeatButtonText: { color: "#fff", fontSize: responsiveFontSize(1.8), fontFamily: Fonts.semiBold },
});
