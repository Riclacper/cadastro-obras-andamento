import React, { useState } from "react";
import { View, Text, TextInput, Button, Image, Alert, ScrollView, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { ddmmToIso } from "../../utils/formatDate";

interface Localizacao {
  lat: number;
  long: number;
}
interface ObraPayload {
  nome: string;
  responsavel: string;
  dataInicio: string;
  dataFim: string;
  localizacao: Localizacao;
  descricao: string;
  foto: string;
}
const API_URL = "http://192.168.0.102:5000"; // Altere para seu backend

export default function NovaObra() {
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<string>("");
  const [localizacao, setLocalizacao] = useState<Localizacao>({ lat: 0, long: 0 });
  const [loading, setLoading] = useState(false);

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
    if (!result.cancelled && result.assets && result.assets[0].base64) {
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
  async function cadastrarObra() {
    if (!nome || !responsavel || !dataInicio || !dataFim || !descricao) {
      Alert.alert("Preencha todos os campos obrigatórios!");
      return;
    }
    setLoading(true);
    const payload: ObraPayload = {
      nome,
      responsavel,
      dataInicio: ddmmToIso(dataInicio),
      dataFim: ddmmToIso(dataFim),
      localizacao,
      descricao,
      foto,
    };
    try {
      const response = await fetch(`${API_URL}/obras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        Alert.alert("Obra cadastrada com sucesso!");
        setNome(""); setResponsavel(""); setDataInicio(""); setDataFim("");
        setDescricao(""); setFoto(""); setLocalizacao({ lat: 0, long: 0 });
      } else {
        const data = await response.json();
        Alert.alert("Erro ao cadastrar obra", data.error || "Erro desconhecido");
      }
    } catch (err) {
      Alert.alert("Erro de rede", "Não foi possível conectar ao backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: "#f3f3f3", flexGrow: 1 }}>
      <Text style={{ fontWeight: "bold", fontSize: 26, marginBottom: 18 }}>Cadastro de Obra</Text>
      <Text>Nome da obra *</Text>
      <TextInput value={nome} onChangeText={setNome} style={styles.input} />
      <Text>Responsável *</Text>
      <TextInput value={responsavel} onChangeText={setResponsavel} style={styles.input} />
      <Text>Data de início *</Text>
      <TextInput value={dataInicio} onChangeText={setDataInicio} placeholder="DD-MM-YYYY" style={styles.input} />
      <Text>Data de término *</Text>
      <TextInput value={dataFim} onChangeText={setDataFim} placeholder="DD-MM-YYYY" style={styles.input} />
      <Text>Descrição *</Text>
      <TextInput value={descricao} onChangeText={setDescricao} multiline numberOfLines={3} style={styles.input} />
      <Text>Foto da Obra</Text>
      <TouchableOpacity onPress={pickImage} style={styles.button}>
        <Text>{foto ? "Trocar foto" : "Tirar foto"}</Text>
      </TouchableOpacity>
      {foto ? <Image source={{ uri: foto }} style={{ width: 220, height: 150, borderRadius: 8, marginBottom: 12 }} /> : null}
      <Text>Localização (GPS)</Text>
      <TouchableOpacity onPress={obterLocalizacao} style={styles.button}>
        <Text>Obter localização atual</Text>
      </TouchableOpacity>
      {localizacao.lat !== 0 && (
        <Text>Lat: {localizacao.lat.toFixed(5)} | Long: {localizacao.long.toFixed(5)}</Text>
      )}
      <Button title={loading ? "Salvando..." : "Cadastrar Obra"} onPress={cadastrarObra} disabled={loading} color="#27ae60" />
    </ScrollView>
  );
}
const styles = {
  input: { borderWidth: 1, borderColor: "#222", padding: 10, marginBottom: 10, backgroundColor: "#fff", color: "#222" },
  button: { marginBottom: 12, backgroundColor: "#eee", padding: 10, alignItems: "center" }
};
