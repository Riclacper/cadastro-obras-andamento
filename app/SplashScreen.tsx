import React, { useEffect, useState } from "react";
import { View, Image, Text } from "react-native";
import * as Progress from "react-native-progress";
import { useRouter } from "expo-router";

export default function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval = setInterval(() => {
      setProgress((old) => {
        if (old < 1) return old + 0.01;
        clearInterval(interval);
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1000);
        return 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{
      flex: 1,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <Image
        source={require("../assets/images/logo.png")}
        style={{ width: 120, height: 120, marginBottom: 28 }}
        resizeMode="contain"
      />
      <Progress.Bar
        progress={progress}
        width={180}
        color="#27ae60"
        borderRadius={8}
        unfilledColor="#e0e0e0"
        height={12}
        animated
      />
      <Text style={{ marginTop: 20, color: "#27ae60", fontWeight: "bold", fontSize: 16 }}>
        Carregando...
      </Text>
    </View>
  );
}
