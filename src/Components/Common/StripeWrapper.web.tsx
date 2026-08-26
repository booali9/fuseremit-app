import React, { ReactElement } from "react";

// Web stub: @stripe/stripe-react-native is native-only and cannot be imported on web.
// Expo's bundler picks this file (.web.tsx) automatically when targeting the web platform.

interface Props {
  children: ReactElement | ReactElement[];
}

const StripeWrapper: React.FC<Props> = ({ children }) => {
  return <>{children}</>;
};

export default StripeWrapper;
