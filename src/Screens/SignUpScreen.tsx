import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from "react-native-responsive-dimensions";

import { moderateScale } from "react-native-size-matters";
import { Feather, Ionicons } from "@expo/vector-icons";
import { DatePickerModal, en, registerTranslation } from "react-native-paper-dates";
import { registerAccount, requestEmailLoginOtp } from "../services/authApi";
import { setSession } from "../services/session";
import { Calendar } from "react-native-calendars";
import Fonts from "../constants/Fonts";

interface Props {
  navigation: any;
}

registerTranslation("en", en);

const SignUpScreen = ({ navigation }: Props) => {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [secureEntry, setSecureEntry] = useState(true);

  const [gender, setGender] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [dateInput, setDateInput] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const [checked, setChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const genderOptions = ["Male", "Female", "Other"];

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPassword = password.trim().length >= 8;

  const isValid =
    first.trim() &&
    last.trim() &&
    isValidEmail &&
    phoneNumber.trim().length >= 10 &&
    isValidPassword &&
    gender &&
    date &&
    checked;

  const borderColor = (value: unknown) =>
    submitted && !value ? "#FB002E" : "#ccc";

  const handleDateTyping = (text: string) => {
    const numbers = text.replace(/\D/g, "");

    let formatted = numbers;

    if (numbers.length > 2 && numbers.length <= 4) {
      formatted = numbers.slice(0, 2) + "/" + numbers.slice(2);
    } else if (numbers.length > 4) {
      formatted =
        numbers.slice(0, 2) +
        "/" +
        numbers.slice(2, 4) +
        "/" +
        numbers.slice(4, 8);
    }

    setDateInput(formatted);

    if (numbers.length === 8) {
      const day = numbers.slice(0, 2);
      const month = numbers.slice(2, 4);
      const year = numbers.slice(4, 8);

      const isoDate = `${year}-${month}-${day}`;
      setDate(new Date(isoDate));
    }
  };

  const formatDate = (value: Date | undefined) => {
    if (!value) return "DD/MM/YYYY";

    const day = value.getDate().toString().padStart(2, "0");
    const month = (value.getMonth() + 1).toString().padStart(2, "0");
    const year = value.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const onConfirmDatePicker = (params: { date: Date | undefined }) => {
    setShowCalendar(false);
    setDate(params.date);
    if (params.date) {
      setDateInput(formatDate(params.date));
    }
  };

  const handleContinue = () => {
    void (async () => {
      setSubmitted(true);

      if (!isValid || !date || isSubmitting) {
        return;
      }

      try {
        setErrorMessage("");
        setIsSubmitting(true);

        const normalizedEmail = email.trim().toLowerCase();
        const dateOfBirth = date.toISOString().split("T")[0];

        const registration = await registerAccount({
          firstName: first.trim(),
          lastName: last.trim(),
          email: normalizedEmail,
          phoneNumber: phoneNumber.trim(),
          password,
          gender: gender as "Male" | "Female" | "Other",
          dateOfBirth,
        });

        if (registration.unverifiedExisting && registration.challengeId) {
          if (__DEV__) {
            console.log(
              `[SIGNUP] Unverified existing account found. redirectId=${registration.challengeId}`,
            );
          }
          navigation.navigate("PhoneNumberVerify", {
            challengeId: registration.challengeId,
            identifier: phoneNumber.trim() || normalizedEmail,
          });
          return;
        }

        if (registration.challengeId) {
          // Navigate to OTP verification using the challengeId from registration
          navigation.navigate("PhoneNumberVerify", {
            challengeId: registration.challengeId,
            identifier: phoneNumber.trim() || normalizedEmail,
          });
          return;
        }

        // Fallback (should not happen with updated backend)
        const otp = await requestEmailLoginOtp({
          email: normalizedEmail,
          password,
        });

        if (otp.accessToken && otp.user) {
          // 2FA disabled → logged in directly after registration
          await setSession({
            accessToken: otp.accessToken,
            user: otp.user as any,
          });
          navigation.navigate("CreatePin");
        } else {
          // 2FA enabled → navigate to OTP verification
          navigation.navigate("PhoneNumberVerify", {
            challengeId: otp.challengeId,
            identifier: normalizedEmail,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to create account right now.";

        if (message.toLowerCase().includes("already exists")) {
          try {
            const normalizedEmail = email.trim().toLowerCase();

            const otp = await requestEmailLoginOtp({
              email: normalizedEmail,
              password,
            });

            if (otp.accessToken && otp.user) {
              await setSession({
                accessToken: otp.accessToken,
                user: otp.user as any,
              });
              navigation.navigate("CreatePin");
            } else {
              navigation.navigate("PhoneNumberVerify", {
                challengeId: otp.challengeId,
                email: normalizedEmail,
              });
            }

            return;
          } catch {
            // Fall through to show the original registration error.
          }
        }

        setErrorMessage(message);
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={moderateScale(22)} />
          </TouchableOpacity>

          <Image
            source={require("../../assets/login.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>
          Please enter your personal details below
        </Text>

        <Input
          label="First Name"
          placeholder="e.g. Mathew"
          value={first}
          setValue={setFirst}
          borderColor={borderColor(first)}
          icon="user"
        />
        <Input
          label="Last Name"
          placeholder="e.g. Excel"
          value={last}
          setValue={setLast}
          borderColor={borderColor(last)}
          icon="user"
        />
        <Input
          label="Email Address"
          placeholder="e.g. matexc@email.com"
          value={email}
          setValue={setEmail}
          borderColor={borderColor(email)}
          icon="mail"
        />
        <Input
          label="Phone Number"
          placeholder="e.g. +1234567890"
          value={phoneNumber}
          setValue={setPhoneNumber}
          borderColor={borderColor(phoneNumber)}
          icon="phone"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Password</Text>
        <View
          style={[
            styles.inputContainer,
            { borderColor: borderColor(password) },
          ]}
        >
          <Feather name="lock" size={20} color="#777" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="*********"
            secureTextEntry={secureEntry}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)}>
            <Feather
              name={secureEntry ? "eye-off" : "eye"}
              size={20}
              color="#777"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
          {password.length > 0 && (
            <Feather name="check" size={20} color="#1DB954" style={{ marginLeft: moderateScale(5) }} />
          )}
        </View>

        <Text style={styles.label}>Date Of Birth</Text>

        <View style={{ position: "relative" }}>
          <TouchableOpacity
            style={[styles.inputContainer, { borderColor: borderColor(date) }]}
            onPress={() => setShowCalendar(true)}
          >
            <Text style={styles.dateValue}>{formatDate(date)}</Text>

            <TouchableOpacity onPress={() => setShowCalendar(true)}>
              <Ionicons name="calendar-clear" size={20} color="black" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <DatePickerModal
          locale="en"
          mode="single"
          visible={showCalendar}
          onDismiss={() => setShowCalendar(false)}
          date={date}
          onConfirm={onConfirmDatePicker}
          validRange={{ endDate: new Date() }}
          label="Select Date of Birth"
          saveLabel="Select"
        />

        <Text style={styles.label}>Gender</Text>
        <View style={{ position: "relative" }}>
          <TouchableOpacity
            style={[
              styles.inputContainer,
              { borderColor: borderColor(gender) },
            ]}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={{ flex: 1 }}>{gender || "e.g. Male"}</Text>
            <Feather name="chevron-down" size={20} />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownOverlay}>
              {genderOptions.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setGender(g);
                    setShowDropdown(false);
                  }}
                >
                  <Text>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our{" "}
          <Text style={styles.link}>Terms of Service</Text> and acknowledge our{" "}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setChecked(!checked)}
        >
          <View style={[styles.checkbox, checked && styles.checkboxActive]}>
            {checked && <Feather name="check" size={14} color="#fff" />}
          </View>

          <Text style={styles.checkboxText}>
            Please send me updates, newsletters, special offers, and other
            information via email.
          </Text>
        </TouchableOpacity>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isValid && !isSubmitting ? "#0B3963" : "#F5F5F9",
            },
          ]}
          disabled={!isValid || isSubmitting}
          onPress={handleContinue}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={[
                styles.buttonText,
                { color: isValid ? "#FFFFFF" : "#1e1e1e8c" },
              ]}
            >
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

const Input = ({ label, placeholder, value, setValue, borderColor, icon, keyboardType }: any) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputContainer, { borderColor }]}>
      {icon && (
        <Feather
          name={icon}
          size={20}
          color="#777"
          style={styles.inputIcon}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType || "default"}
      />
    </View>
  </>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(6),
    backgroundColor: "#fff",
  },
  topBar: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: responsiveHeight(2),
  },
  backBtn: { position: "absolute", left: 0 },
  logo: { width: responsiveWidth(55), height: responsiveHeight(10), alignSelf: "center" },
  title: { fontSize: responsiveFontSize(2.5), fontFamily: Fonts.semiBold },
  subtitle: {
    fontSize: responsiveFontSize(1.4),
    color: "#777",
    marginTop: 6,
    fontFamily: Fonts.regular,
  },
  label: {
    marginTop: responsiveHeight(2),
    marginBottom: 3,
    fontSize: responsiveFontSize(1.6),
    fontFamily: Fonts.semiBold,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: responsiveHeight(6.3),
    backgroundColor: "#1e1e1e0c",
  },
  input: {
    flex: 1,
    fontSize: responsiveFontSize(1.7),
    fontFamily: Fonts.regular,
    color: "black",
  },
  inputIcon: {
    marginRight: moderateScale(10),
  },
  eyeIcon: {
    marginHorizontal: moderateScale(5),
  },
  dateValue: {
    flex: 1,
    fontSize: responsiveFontSize(1.7),
    fontFamily: Fonts.regular,
    color: "black",
  },

  dropdownOverlay: {
    position: "absolute",
    top: responsiveHeight(6.5),
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },

  dropdownItem: { padding: 12 },

  terms: {
    fontSize: responsiveFontSize(1.5),
    color: "#1E1E1E",
    marginVertical: responsiveHeight(1.8),
    fontFamily: Fonts.medium,
  },
  link: { color: "#0B3963", fontWeight: "600" },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  checkbox: {
    width: 16,
    height: 16,
    marginRight: 8,
    justifyContent: "center",
    backgroundColor: "#1e1e1e0c",
    alignItems: "center",
    borderRadius: 4,
    marginTop: responsiveHeight(0.2),
  },
  checkboxActive: { backgroundColor: "#0B3963", borderColor: "#0B3963" },

  checkboxText: {
    flex: 1,
    fontSize: responsiveFontSize(1.5),
    color: "#1E1E1E",
    fontFamily: Fonts.medium,
  },

  errorText: {
    marginTop: responsiveHeight(0.5),
    marginBottom: responsiveHeight(0.6),
    color: "#FB002E",
    fontFamily: Fonts.semiBold,
    fontSize: responsiveFontSize(1.35),
    textAlign: "center",
  },

  button: {
    marginTop: 10,
    width: responsiveWidth(88),
    height: responsiveHeight(6.5),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: responsiveHeight(8),
  },

  buttonText: {
    fontSize: responsiveFontSize(1.8),
    fontFamily: Fonts.medium,
  },
});
