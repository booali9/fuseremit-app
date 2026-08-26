import { Appearance, Platform } from "react-native";

/**
 * Lock the app to light UI so Android OEMs (Samsung, Xiaomi, etc.)
 * cannot force-dark invert text on light surfaces.
 */
export function applyLightUi() {
  Appearance.setColorScheme("light");

  if (Platform.OS === "android") {
    try {
      // Optional peer — present after expo-system-ui install.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SystemUI = require("expo-system-ui");
      SystemUI?.setBackgroundColorAsync?.("#FFFFFF");
    } catch {
      // package not linked yet — native plugin + styles.xml still apply
    }
  }
}
