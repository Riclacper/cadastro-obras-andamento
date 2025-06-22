import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Image, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { ddmmToIso, isoToDdmm } from "../../../utils/formatDate";

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
const API_URL = "http://192.168.0.102:5000"; // Coloque o IP do backend

export default function EditarObra() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<string>("");
  const [localizacao, setLocalizacao] = useState<Localizacao>({ lat: 0, long: 0 });

  useEffect(() => {
    async function fetchObra() {
      try {
        const res = await fetch(`${API_URL}/obras/${id}`);
        const data = await res.json();
        setNome(data.nome || "");
        setResponsavel(data.responsavel || "");
        setDataInicio(data.dataInicio ? isoToDdmm(data.dataInicio) : "");
        setDataFim(data.dataFim ? isoToDdmm(data.dataFim) : "");
        setDescricao(data.descricao || "");
        setFoto(data.foto || "");
        setLocalizacao(data.localizacao || { lat: 0, long: 0 });
      } catch {
        Alert.alert("Erro ao carregar dados da obra.");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    fetchObra();
  }, [id]);

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

  async function atualizarObra() {
    if (!nome || !responsavel || !dataInicio || !dataFim || !descricao) {
      Alert.alert("Preencha todos os campos obrigatórios!");
      return;
    }
    setSalvando(true);
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
      const res = await fetch(`${API_URL}/obras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        Alert.alert("Obra atualizada com sucesso!");
        router.replace(`/obras/${id}`);
      } else {
        const data = await res.json();
        Alert.alert("Erro ao atualizar obra", data.error || "Erro desconhecido");
      }
    } catch (err) {
      Alert.alert("Erro de rede", "Não foi possível conectar ao backend.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 64 }} />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: "#f3f3f3", flexGrow: 1 }}>
      <Text style={{ fontWeight: "bold", fontSize: 22, marginBottom: 16 }}>Editar Obra</Text>
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
      <Button title={salvando ? "Salvando..." : "Salvar alterações"} onPress={atualizarObra} disabled={salvando} color="#27ae60" />
    </ScrollView>
  );
}
const styles = {
  input: { borderWidth: 1, borderColor: "#222", padding: 10, marginBottom: 10, backgroundColor: "#fff", color: "#222" },
  button: { marginBottom: 12, backgroundColor: "#eee", padding: 10, alignItems: "center" }
};
