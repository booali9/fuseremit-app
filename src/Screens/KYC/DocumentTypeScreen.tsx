import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from "react-native";
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";
import { moderateScale } from "react-native-size-matters";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";
import {
  ManualKycDocumentType,
  getManualKycDraft,
  updateManualKycDraft,
} from "../../services/manualKycDraft";

const documentOptions: Array<{ label: string; value: ManualKycDocumentType }> = [
  { label: "Passport", value: "passport" },
  { label: "ID card", value: "id_card" },
  { label: "Driver’s license", value: "drivers_license" },
];

const DocumentTypeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [country, setCountry] = useState("Detecting country...");
  const [isLocating, setIsLocating] = useState(true);
  const [selectedType, setSelectedType] =
    useState<ManualKycDocumentType | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const resolveCountryAndDraft = async () => {
      try {
        setIsLocating(true);
        setErrorMessage("");

        const draft = await getManualKycDraft();

        if (draft.documentType) {
          setSelectedType(draft.documentType);
        }

        if (draft.country) {
          setCountry(draft.country);
        }

        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          if (!draft.country) {
            setCountry("Country unavailable");
          }

          setErrorMessage("Location permission denied. Turn it on for auto country detection.");
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const reverse = await Location.reverseGeocodeAsync(position.coords);
        const detectedCountry = reverse[0]?.country?.trim();

        if (detectedCountry) {
          setCountry(detectedCountry);
          await updateManualKycDraft({ country: detectedCountry });
        } else if (!draft.country) {
          setCountry("Country unavailable");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to detect your country right now.";

        setErrorMessage(message);
      } finally {
        setIsLocating(false);
      }
    };

    void resolveCountryAndDraft();
  }, []);

  const canContinue = useMemo(() => Boolean(selectedType), [selectedType]);

  const handleVerify = () => {
    void (async () => {
      if (!selectedType) {
        setErrorMessage("Please select your document type.");
        return;
      }

      await updateManualKycDraft({
        documentType: selectedType,
        country: country === "Detecting country..." ? undefined : country,
      });

      navigation.navigate("SelectDocument");
    })();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={moderateScale(22)} />
        </TouchableOpacity>

        <AppText style={styles.headerTitle}>Select Document Type</AppText>

        <TouchableOpacity>
          <Ionicons
            name="notifications"
            size={moderateScale(22)}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.countryRow}>
        {isLocating ? <ActivityIndicator size="small" color="#0B3963" /> : null}
        <AppText style={styles.description}>{country}</AppText>
      </View>

      {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}

      {documentOptions.map((option) => {
        const isSelected = selectedType === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => setSelectedType(option.value)}
          >
            <AppText style={styles.cardText}>{option.label}</AppText>

            {isSelected ? (
              <Ionicons
                name="checkmark-circle"
                size={moderateScale(22)}
                color="#1BD96A"
              />
            ) : null}
          </TouchableOpacity>
        );
      })}

      <View style={{ flex: 1 }} />

      <TouchableOpacity
        style={[styles.verifyButton, !canContinue && styles.verifyButtonDisabled]}
        onPress={handleVerify}
        disabled={!canContinue}
      >
        <AppText style={styles.verifyText}>Verify</AppText>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default DocumentTypeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: responsiveWidth(5),
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: responsiveHeight(5),
  },

  headerTitle: {
    fontSize: responsiveFontSize(2.4),
    fontFamily: Fonts.bold,
    color: "#000",
  },

  description: {
    marginTop: 0,
    fontSize: responsiveFontSize(1.8),
    color: "#1E1E1E",
    lineHeight: moderateScale(22),
    fontFamily: Fonts.medium,
    marginBottom: 0,
    marginLeft: responsiveWidth(2),
  },

  countryRow: {
    marginTop: responsiveHeight(4),
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(1.2),
  },

  errorText: {
    color: "#FB002E",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.35),
    marginBottom: responsiveHeight(1),
  },

  card: {
    marginTop: responsiveHeight(2),
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(8),
    paddingVertical: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardSelected: {
    borderWidth: 1.5,
    borderColor: "#1BD96A",
  },

  cardText: {
    color: "#fff",
    fontSize: responsiveFontSize(1.9),
    fontFamily: Fonts.semiBold,
    textAlign: "left",
    flex: 1,
  },

  verifyButton: {
    backgroundColor: "#0B3963",
    borderRadius: moderateScale(10),
    paddingVertical: responsiveHeight(2),
    alignItems: "center",
    marginBottom: responsiveHeight(8),
  },

  verifyButtonDisabled: {
    backgroundColor: "#A7B6C8",
  },

  verifyText: {
    color: "#fff",
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
  },
});
