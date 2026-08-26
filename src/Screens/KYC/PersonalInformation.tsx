import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { fetchCurrentUserStatus, updateCurrentUserProfile } from "../../services/userApi";
import { getAccessTokenAsync, getSessionUser } from "../../services/session";
import { getManualKycDraft, updateManualKycDraft } from "../../services/manualKycDraft";
import Fonts from "../../constants/Fonts";
import AppText from "../../Components/Common/AppText";
import AppTextInput from "../../Components/Common/AppTextInput";

interface Props {
  navigation: any;
}

const PersonalInformation = ({ navigation }: Props) => {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");

  const [gender, setGender] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [date, setDate] = useState<Date | undefined>();
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const genderOptions = ["Male", "Female", "Other"];

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isFormValid =
    first.trim().length > 0 &&
    last.trim().length > 0 &&
    isValidEmail &&
    Boolean(gender) &&
    Boolean(date);

  const parseDate = (value?: string) => {
    if (!value) return undefined;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const formatDate = (value?: Date) => {
    if (!value) return "DD/MM/YYYY";

    const day = value.getDate().toString().padStart(2, "0");
    const month = (value.getMonth() + 1).toString().padStart(2, "0");
    const year = value.getFullYear().toString();

    return `${day}/${month}/${year}`;
  };

  const toIsoDate = (value: Date) => {
    const year = value.getFullYear();
    const month = (value.getMonth() + 1).toString().padStart(2, "0");
    const day = value.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const loadPrefilledData = useCallback(async () => {
    try {
      setErrorMessage("");
      setIsLoading(true);

      const draft = await getManualKycDraft();
      const draftInfo = draft.personalInfo ?? {};

      const sessionUser = getSessionUser();
      const accessToken = await getAccessTokenAsync();

      let nextFirst = draftInfo.firstName ?? "";
      let nextLast = draftInfo.lastName ?? "";
      let nextEmail = draftInfo.email ?? "";
      let nextGender = draftInfo.gender ?? "";
      let nextDate = parseDate(draftInfo.dateOfBirth);

      if (sessionUser) {
        if (!nextFirst && sessionUser.firstName) nextFirst = sessionUser.firstName;
        if (!nextLast && sessionUser.lastName) nextLast = sessionUser.lastName;
        if (!nextEmail && sessionUser.email) nextEmail = sessionUser.email;
      }

      if (accessToken) {
        const me = await fetchCurrentUserStatus(accessToken);

        if (me.firstName) nextFirst = me.firstName;
        if (me.lastName) nextLast = me.lastName;
        if (me.email) nextEmail = me.email;
        if (me.gender) nextGender = me.gender;

        const parsedApiDate = parseDate(me.dateOfBirth);
        if (parsedApiDate) nextDate = parsedApiDate;
      }

      setFirst(nextFirst);
      setLast(nextLast);
      setEmail(nextEmail);
      setGender(nextGender);
      setDate(nextDate);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load your saved personal details.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrefilledData();
  }, [loadPrefilledData]);

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const formattedDate = formatDate(date);

  const handleNext = () => {
    void (async () => {
      if (isSaving) return;

      if (!isFormValid || !date) {
        setErrorMessage("Please complete all required personal details.");
        return;
      }

      try {
        setIsSaving(true);
        setErrorMessage("");

        const normalizedPayload = {
          firstName: first.trim(),
          lastName: last.trim(),
          email: email.trim().toLowerCase(),
          dateOfBirth: toIsoDate(date),
          gender: gender as "Male" | "Female" | "Other",
        };

        await updateManualKycDraft({
          personalInfo: normalizedPayload,
        });

        const accessToken = await getAccessTokenAsync();

        if (accessToken) {
          await updateCurrentUserProfile(accessToken, {
            firstName: normalizedPayload.firstName,
            lastName: normalizedPayload.lastName,
            dateOfBirth: normalizedPayload.dateOfBirth,
            gender: normalizedPayload.gender,
          });
        }

        navigation.navigate("BackgroundInformation");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to save your personal information.";

        setErrorMessage(message);
      } finally {
        setIsSaving(false);
      }
    })();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* TopBar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={moderateScale(22)} />
          </TouchableOpacity>

          <AppText
            style={{
              fontSize: responsiveFontSize(2.4),
              fontFamily: Fonts.semiBold,
            }}
          >
            Personal Information
          </AppText>

          <TouchableOpacity style={{ position: "absolute", right: 0 }}>
            <Ionicons name="notifications" size={moderateScale(22)} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#0B3963" />
            <AppText style={styles.loadingText}>Loading your signup details...</AppText>
          </View>
        ) : null}

        <Input
          label="First Name"
          placeholder="e.g. Mathew"
          value={first}
          setValue={setFirst}
        />
        <Input
          label="Last Name"
          placeholder="e.g. Excel"
          value={last}
          setValue={setLast}
        />
        <Input
          label="Email Address"
          placeholder="e.g. matexc@email.com"
          value={email}
          setValue={setEmail}
        />

        {/* DOB */}
        <AppText style={styles.label}>DOB</AppText>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setShowPicker(true)}
        >
          <AppText style={{ flex: 1 }}>{formattedDate}</AppText>
          <Ionicons name="calendar-clear" size={20} color="black" />
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* Gender */}
        <View style={{ zIndex: 10 }}>
          <AppText style={styles.label}>Gender</AppText>

          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <AppText style={{ flex: 1 }}>{gender || "e.g. Male"}</AppText>
            <Feather name="chevron-down" size={20} />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownAbsolute}>
              {genderOptions.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setGender(g);
                    setShowDropdown(false);
                  }}
                >
                  <AppText>{g}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#0B3963" }]}
          onPress={handleNext}
          disabled={isSaving}
        >
          <AppText style={[styles.buttonText, { color: "#FFFFFF" }]}>
            {isSaving ? "Saving..." : "Next"}
          </AppText>
        </TouchableOpacity>

        {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PersonalInformation;

/* INPUT */
const Input = ({ label, placeholder, value, setValue }: any) => (
  <>
    <AppText style={styles.label}>{label}</AppText>
    <View style={styles.inputContainer}>
      <AppTextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={setValue}
      />
    </View>
  </>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(5),
    backgroundColor: "#fff",
  },

  topBar: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },

  backBtn: {
    position: "absolute",
    left: 0,
  },

  label: {
    marginTop: responsiveHeight(2),
    marginBottom: 3,
    fontSize: responsiveFontSize(1.4),
    fontFamily: Fonts.semiBold,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: responsiveHeight(6.3),
    backgroundColor: "#1e1e1e16",
  },

  input: {
    flex: 1,
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
  },

  dropdownAbsolute: {
    position: "absolute",
    top: responsiveHeight(11),
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 6,
    paddingVertical: 5,
  },

  dropdownItem: {
    padding: 12,
  },

  button: {
    marginTop: responsiveHeight(19),
    width: responsiveWidth(88),
    height: responsiveHeight(6.6),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: responsiveHeight(6),
  },

  buttonText: {
    fontSize: responsiveFontSize(2),
    fontFamily: Fonts.bold,
  },

  loadingWrap: {
    marginTop: responsiveHeight(1),
    alignItems: "center",
  },

  loadingText: {
    marginTop: responsiveHeight(0.6),
    color: "#0B3963",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.45),
  },

  errorText: {
    marginTop: responsiveHeight(1.2),
    marginBottom: responsiveHeight(1),
    color: "#FB002E",
    textAlign: "center",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.4),
    paddingHorizontal: responsiveWidth(2),
  },
});
