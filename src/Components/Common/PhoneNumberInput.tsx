import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { CountryPicker } from "react-native-country-codes-picker";
import { countryCodes } from "react-native-country-codes-picker/constants/countryCodes";
import * as Localization from "expo-localization";
import * as Location from "expo-location";
import { moderateScale } from "react-native-size-matters";
import { responsiveFontSize } from "react-native-responsive-dimensions";

interface Props {
  value: string;
  onChangeValue: (fullNumber: string) => void;
  placeholder?: string;
  style?: any;
  inputStyle?: any;
}

// Renders a flag + dial code picker alongside a national-number input; reports
// the combined E.164-ish string ("+<dialCode><number>") via onChangeValue.
const PhoneNumberInput: React.FC<Props> = ({ value, onChangeValue, placeholder, style, inputStyle }) => {
  const [dialCode, setDialCode] = useState("+1");
  const [flag, setFlag] = useState("🇺🇸");
  const [showPicker, setShowPicker] = useState(false);
  const [nationalNumber, setNationalNumber] = useState(value);

  // Auto-pick the dial code: first try the device's GPS location (reverse-geocoded
  // to a country), then fall back to the device locale's region.
  useEffect(() => {
    const applyCountry = (isoCode?: string | null) => {
      const match = countryCodes.find((c) => c.code === isoCode);
      if (match) {
        setDialCode(match.dial_code);
        setFlag(match.flag);
        emit(match.dial_code, nationalNumber);
        return true;
      }
      return false;
    };

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          });
          const geo = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          if (applyCountry(geo[0]?.isoCountryCode)) {
            return;
          }
        }
      } catch {
        // location unavailable/denied — fall through to locale
      }
      applyCountry(Localization.getLocales()[0]?.regionCode);
    })();
  }, []);

  const emit = (code: string, number: string) => {
    onChangeValue(`${code}${number}`);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.flagButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.flag}>{flag}</Text>
        <Text style={styles.dialCode}>{dialCode}</Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder || "Phone number"}
        keyboardType="phone-pad"
        value={nationalNumber}
        onChangeText={(text) => {
          setNationalNumber(text);
          emit(dialCode, text);
        }}
      />

      <CountryPicker
        lang="en"
        show={showPicker}
        inputPlaceholder="Search country or code"
        pickerButtonOnPress={(item) => {
          setDialCode(item.dial_code);
          setFlag(item.flag);
          setShowPicker(false);
          emit(item.dial_code, nationalNumber);
        }}
        onBackdropPress={() => setShowPicker(false)}
        style={{ modal: styles.pickerModal, itemsList: styles.pickerList }}
      />
    </View>
  );
};

export default PhoneNumberInput;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  flagButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: moderateScale(8),
    paddingRight: moderateScale(8),
    borderRightWidth: 1,
    borderRightColor: "#ccc",
  },
  flag: {
    fontSize: responsiveFontSize(2),
    marginRight: moderateScale(4),
  },
  dialCode: {
    fontSize: responsiveFontSize(1.6),
    fontWeight: "500",
  },
  input: {
    flex: 1,
    fontSize: responsiveFontSize(1.6),
  },
  pickerModal: {
    maxHeight: "80%",
  },
  pickerList: {
    flexGrow: 0,
  },
});
