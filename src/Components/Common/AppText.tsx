import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import Colors from "../../constants/Colors";

/** App-wide Text with a readable default color (override via style). */
const AppText = ({ style, ...props }: TextProps) => (
  <Text {...props} style={[styles.base, style]} />
);

const styles = StyleSheet.create({
  base: {
    color: Colors.text,
  },
});

export default AppText;
