import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import { ddmmToIso } from "../../utils/formatDate";
import Header from "../../components/Header";
import { StyleSheet } from "react-native";

interface Obra {
  _id: string;
  nome: string;
}
interface FiscalizacaoPayload {
  data: string;
  status: string;
  observacoes: string;
  localizacao: { lat: number; long: number };
  foto: string;
  obra: string;
}
const API_URL = "http://192.168.0.102:5000";

export default function NovaFiscalizacao() {
  const router = useRouter();
  const params = useLocalSearchParams<{ obraId?: string }>();

  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState<string>(params.obraId || "");
  const [data, setData] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<string>("");
  const [localizacao, setLocalizacao] = useState<{ lat: number; long: number }>({ lat: 0, long: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchObras() {
      try {
        const res = await fetch(`${API_URL}/obras`);
        const data = await res.json();
        setObras(data);
      } catch {
        setObras([]);
      }
    }
    fetchObras();
  }, []);

  async function pickImage() {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permissão negada para acessar a câmera!");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets && result.assets[0].base64) {
      setFoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  }

  async function obterLocalizacao() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão negada para acessar localização!");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setLocalizacao({
      lat: location.coords.latitude,
      long: location.coords.longitude,
    });
  }

  async function cadastrarFiscalizacao() {
    if (!obraId || !data || !status || !observacoes) {
      Alert.alert("Preencha todos os campos obrigatórios!");
      return;
    }
    setLoading(true);
    const payload: FiscalizacaoPayload = {
      data: ddmmToIso(data),
      status,
      observacoes,
      localizacao,
      foto,
      obra: obraId,
    };
    try {
      const response = await fetch(`${API_URL}/fiscalizacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        Alert.alert("Fiscalização cadastrada com sucesso!");
        setData(""); setStatus(""); setObservacoes(""); setFoto(""); setLocalizacao({ lat: 0, long: 0 });
        if (!params.obraId) setObraId("");
        router.back();
      } else {
        const data = await response.json();
        Alert.alert("Erro ao cadastrar fiscalização", data.error || "Erro desconhecido");
      }
    } catch (err) {
      Alert.alert("Erro de rede", "Não foi possível conectar ao backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: "#f5f6fa", flexGrow: 1 }}>
      <Header />
      <Text style={styles.titulo}>Nova Fiscalização</Text>
      <Text style={styles.label}>Obra vinculada *</Text>
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={obraId}
          onValueChange={setObraId}
          enabled={!params.obraId}
          style={{ width: "100%" }}
        >
          <Picker.Item label="Selecione a obra" value="" />
          {obras.map(o => (
            <Picker.Item key={o._id} label={o.nome} value={o._id} />
          ))}
        </Picker>
      </View>
      <Text style={styles.label}>Data da fiscalização *</Text>
      <TextInput value={data} onChangeText={setData} placeholder="DD-MM-YYYY" style={styles.input} />
      <Text style={styles.label}>Status *</Text>
      <View style={styles.pickerBox}>
        <Picker
          selectedValue={status}
          onValueChange={setStatus}
          style={{ width: "100%" }}
        >
          <Picker.Item label="Selecione o status" value="" />
          <Picker.Item label="Em dia" value="Em dia" />
          <Picker.Item label="Atrasada" value="Atrasada" />
          <Picker.Item label="Parada" value="Parada" />
        </Picker>
      </View>
      <Text style={styles.label}>Observações *</Text>
      <TextInput value={observacoes} onChangeText={setObservacoes} multiline numberOfLines={3} style={styles.input} />
      <Text style={styles.label}>Foto</Text>
      <TouchableOpacity onPress={pickImage} style={styles.button}>
        <Text style={styles.buttonText}>{foto ? "Trocar foto" : "Tirar foto"}</Text>
      </TouchableOpacity>
      {foto ? <Image source={{ uri: foto }} style={{ width: 220, height: 150, borderRadius: 8, marginBottom: 12, alignSelf: "center" }} /> : null}
      <Text style={styles.label}>Localização (GPS)</Text>
      <TouchableOpacity onPress={obterLocalizacao} style={styles.button}>
        <Text style={styles.buttonText}>Obter localização atual</Text>
      </TouchableOpacity>
      {localizacao.lat !== 0 && (
        <Text style={{ marginBottom: 14, textAlign: "center" }}>
          Lat: {localizacao.lat.toFixed(5)} | Long: {localizacao.long.toFixed(5)}
        </Text>
      )}
      <TouchableOpacity style={styles.button} onPress={cadastrarFiscalizacao} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Salvando..." : "Cadastrar Fiscalização"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#27ae60",
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#fff",
    color: "#222",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    marginBottom: 14,
    backgroundColor: "#27ae60",
    padding: 14,
    alignItems: "center",
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  titulo: {
    fontWeight: "bold",
    fontSize: 24,
    color: "#2980b9",
    marginBottom: 18,
    textAlign: "center"
  },
  label: { fontWeight: "bold", color: "#222", marginBottom: 4 },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#27ae60",
    borderRadius: 8,
    marginBottom: 14,
    backgroundColor: "#fff",
    overflow: "hidden"
  }
});
