import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet } from "react-native";

const AnimatedSplash: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(onFinish, 500);
    });
  }, [scale, opacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.Image
        source={require("../../assets/logo.jpg.jpeg")}
        style={[styles.logo, { transform: [{ scale }] }]}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  logo: {
    width: 180,
    height: 180,
  },
});

export default AnimatedSplash;
