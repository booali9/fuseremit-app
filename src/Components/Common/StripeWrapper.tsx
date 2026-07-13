import React, { ReactElement } from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51QhxcRAtSFeuCmPAJW6zwkpg6sFPGFpU4i5W1RAijd7bUcKYoWAalsIx3xNn4WToyDxEYKmHNzSOsHb14PXH8k1U002Cj7ZQg3";

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
