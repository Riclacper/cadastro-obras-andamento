import React from "react";
import { View, Image } from "react-native";

export default function Header() {
  return (
    <View style={{ alignItems: "center", marginTop: 20, marginBottom: 10 }}>
      <Image
        source={require("../assets/images/logo.png")}
        style={{ width: 100, height: 100 }}
        resizeMode="contain"
      />
    </View>
  );
}
