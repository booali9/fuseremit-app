import { CommonActions, NavigationProp } from "@react-navigation/native";
import { fetchCurrentUserStatus } from "../services/userApi";
import { getAccessTokenAsync } from "../services/session";

export const getRootNavigation = (navigation: NavigationProp<any>) => {
  let root = navigation;
  while (root.getParent()) {
    root = root.getParent()!;
  }
  return root;
};

export const resetToLogin = (navigation: NavigationProp<any>) => {
  getRootNavigation(navigation).dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: "Login" }],
    }),
  );
};

// Only a "verified" KYC status may enter the main app; everything else routes to the Stripe Identity flow.
export const resetToDashboardOrKyc = async (navigation: NavigationProp<any>) => {
  let routeName: "AppServiceBottomNavigation" | "AdvancedKYC" = "AdvancedKYC";

  try {
    const token = await getAccessTokenAsync();
    const status = token ? await fetchCurrentUserStatus(token) : null;
    if (status?.kycStatus === "verified") {
      routeName = "AppServiceBottomNavigation";
    }
  } catch {
    // ponytail: fail closed — if status can't be fetched, force through KYC rather than let an unverified user in
  }

  getRootNavigation(navigation).dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: routeName }],
    }),
  );
};
