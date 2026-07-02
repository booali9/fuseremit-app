import React, { ReactElement } from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51RELBuPuq0Z2WCCYlDYOUOx6ukBMQ7K1wYIHfAFYzmTARaVEeq1Kk0yzqhi8NSAvmdWtcYCRDJGcWTPqjMgu1aNQ00bgpcURMU";

interface Props {
  children: ReactElement | ReactElement[];
}

const StripeWrapper: React.FC<Props> = ({ children }) => {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {children}
    </StripeProvider>
  );
};

export default StripeWrapper;
