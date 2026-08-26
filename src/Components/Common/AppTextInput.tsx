import React, { forwardRef } from "react";
import { TextInput, TextInputProps, StyleSheet } from "react-native";
import Colors from "../../constants/Colors";

/** App-wide TextInput with readable text + placeholder defaults. */
const AppTextInput = forwardRef<TextInput, TextInputProps>(
  ({ style, placeholderTextColor = Colors.placeholder, ...props }, ref) => (
    <TextInput
      ref={ref}
      {...props}
      placeholderTextColor={placeholderTextColor}
      style={[styles.base, style]}
    />
  )
);

AppTextInput.displayName = "AppTextInput";

const styles = StyleSheet.create({
  base: {
    color: Colors.text,
  },
});

export default AppTextInput;
