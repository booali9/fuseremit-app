import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Alert, ActivityIndicator, Modal } from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Fonts from "../../../constants/Fonts";
import { Transaction, repeatTransfer, getTransactionById } from "../../../services/paymentApi";
import AppText from "../../../Components/Common/AppText";

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
  const [repeatedTx, setRepeatedTx] = useState<Transaction | null>(null);

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
              setRepeatedTx(newTx);
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
        <AppText style={styles.topTitle}>Transfer Details</AppText>
        <View style={{ width: moderateScale(22) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: responsiveHeight(6) }}>
        {/* Amount card */}
        <View style={styles.amountCard}>
          <View style={[styles.statusBadge, isFailed ? styles.failedBadge : styles.activeBadge]}>
            <AppText style={styles.statusBadgeText}>
              {isFailed ? "Failed" : tx.status === "delivered" ? "Delivered" : "In Progress"}
            </AppText>
          </View>
          <AppText style={styles.amountLabel}>You sent</AppText>
          <AppText style={styles.amountValue}>${tx.amount.toFixed(2)} {tx.currency}</AppText>
          {tx.amountReceived ? (
            <AppText style={styles.receivedLabel}>
              Recipient gets {tx.amountReceived.toFixed(2)} {tx.receivedCurrency}
            </AppText>
          ) : null}
        </View>

        {/* Progress tracker */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Transfer Progress</AppText>

          {isFailed ? (
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, styles.stepDotFailed]}>
                <Ionicons name="close" size={moderateScale(12)} color="#fff" />
              </View>
              <View style={styles.stepInfo}>
                <AppText style={[styles.stepLabel, { color: "#FB002E" }]}>Transfer Failed</AppText>
                <AppText style={styles.stepTime}>{new Date(tx.updatedAt).toLocaleString()}</AppText>
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
                    <AppText style={[styles.stepLabel, done ? styles.stepLabelDone : styles.stepLabelPending]}>{step.label}</AppText>
                    {event?.timestamp ? (
                      <AppText style={styles.stepTime}>{new Date(event.timestamp).toLocaleString()}</AppText>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Transfer details */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Transfer Details</AppText>
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
                <AppText style={styles.repeatButtonText}>Repeat Transfer</AppText>
              </>
            )}
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Modal visible={!!repeatedTx} transparent animationType="fade" onRequestClose={() => setRepeatedTx(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCheckCircle}>
              <Ionicons name="checkmark" size={moderateScale(28)} color="#fff" />
            </View>
            <AppText style={styles.modalTitle}>Transfer Repeated</AppText>
            <AppText style={styles.modalMessage}>
              ${repeatedTx?.amount.toFixed(2)} sent to {repeatedTx?.recipientName ?? "recipient"} again.
            </AppText>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setRepeatedTx(null)}
              >
                <AppText style={styles.modalSecondaryButtonText}>OK</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={() => {
                  if (repeatedTx) setTx(repeatedTx);
                  setRepeatedTx(null);
                }}
              >
                <AppText style={styles.modalPrimaryButtonText}>View</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const renderRow = (label: string, value: string) => (
  <View style={styles.row} key={label}>
    <AppText style={styles.rowLabel}>{label}</AppText>
    <AppText style={styles.rowValue}>{value}</AppText>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(8),
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: moderateScale(20),
    padding: responsiveWidth(6),
    alignItems: "center",
  },
  modalCheckCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: "#34A853",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  modalTitle: { fontSize: responsiveFontSize(2.2), fontFamily: Fonts.bold, color: "#111" },
  modalMessage: {
    fontSize: responsiveFontSize(1.5),
    color: "#666",
    fontFamily: Fonts.regular,
    textAlign: "center",
    marginTop: responsiveHeight(1),
    lineHeight: 20,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: responsiveWidth(3),
    marginTop: responsiveHeight(3),
    width: "100%",
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: responsiveHeight(1.6),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: "#0B3963",
    alignItems: "center",
  },
  modalSecondaryButtonText: { color: "#0B3963", fontSize: responsiveFontSize(1.6), fontFamily: Fonts.semiBold },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: responsiveHeight(1.6),
    borderRadius: moderateScale(12),
    backgroundColor: "#0B3963",
    alignItems: "center",
  },
  modalPrimaryButtonText: { color: "#fff", fontSize: responsiveFontSize(1.6), fontFamily: Fonts.semiBold },
});
