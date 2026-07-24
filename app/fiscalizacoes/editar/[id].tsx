import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { ddmmToIso, isValidDdmm, isoToDdmm, maskDdmm } from "../../../utils/formatDate";
import Header from "../../../components/Header";
import { StyleSheet } from "react-native";
import { apiFetch } from "@/utils/api";

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
export default function EditarFiscalizacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [obraId, setObraId] = useState<string>("");
  const [data, setData] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<string>("");
  const [localizacao, setLocalizacao] = useState<{ lat: number; long: number }>({ lat: 0, long: 0 });
  const [selectingObra, setSelectingObra] = useState(false);
  const [selectingStatus, setSelectingStatus] = useState(false);
  const statusOptions = ["Em dia", "Atrasada", "Parada"];

  useEffect(() => {
    async function fetchFiscalizacao() {
      try {
        const res = await apiFetch(`/fiscalizacoes/${id}`);
        const data = await res.json();
        const obraValue = typeof data.obra === "object" ? data.obra?._id : data.obra;
        setObraId(obraValue || "");
        setData(data.data ? isoToDdmm(data.data) : "");
        setStatus(data.status || "");
        setObservacoes(data.observacoes || "");
        setFoto(data.foto || "");
        setLocalizacao(data.localizacao || { lat: 0, long: 0 });
      } catch {
        Alert.alert("Erro ao carregar fiscalização.");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    async function fetchObras() {
      try {
        const res = await apiFetch("/obras");
        const data = await res.json();
        setObras(data);
      } catch {
        setObras([]);
      }
    }
    fetchFiscalizacao();
    fetchObras();
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

  async function atualizarFiscalizacao() {
    if (!obraId || !data || !status || !observacoes) {
      Alert.alert("Preencha todos os campos obrigatórios!");
      return;
    }
    if (!isValidDdmm(data)) {
      Alert.alert("Informe uma data válida no formato DD/MM/AAAA.");
      return;
    }
    setSalvando(true);
    const payload: FiscalizacaoPayload = {
      data: ddmmToIso(data),
      status,
      observacoes,
      localizacao,
      foto,
      obra: obraId,
    };
    try {
      const res = await apiFetch(`/fiscalizacoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        Alert.alert("Fiscalização atualizada com sucesso!");
        router.back();
      } else {
        const data = await res.json();
        Alert.alert("Erro ao atualizar fiscalização", data.error || "Erro desconhecido");
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
    <ScrollView contentContainerStyle={{ padding: 20, backgroundColor: "#f5f6fa", flexGrow: 1 }}>
      <Header title="Editar fiscalização" />
      <Text style={styles.label}>Obra vinculada *</Text>
      <TouchableOpacity style={styles.selectField} onPress={() => setSelectingObra(true)}>
        <Text style={obraId ? styles.selectValue : styles.selectPlaceholder}>{obras.find((obra) => obra._id === obraId)?.nome || "Selecione a obra"}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>
      <Modal visible={selectingObra} transparent animationType="slide" onRequestClose={() => setSelectingObra(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Obra vinculada</Text>
          {obras.map((obra) => <TouchableOpacity key={obra._id} style={styles.option} onPress={() => { setObraId(obra._id); setSelectingObra(false); }}><Text style={styles.optionText}>{obra.nome}</Text>{obra._id === obraId && <Text style={styles.check}>✓</Text>}</TouchableOpacity>)}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectingObra(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
        </View></View>
      </Modal>
      <Text style={styles.label}>Data da fiscalização *</Text>
      <TextInput value={data} onChangeText={(value) => setData(maskDdmm(value))} placeholder="DD/MM/AAAA" keyboardType="number-pad" maxLength={10} style={styles.input} />
      <Text style={styles.label}>Status *</Text>
      <TouchableOpacity style={styles.selectField} onPress={() => setSelectingStatus(true)}>
        <Text style={status ? styles.selectValue : styles.selectPlaceholder}>{status || "Selecione o status"}</Text><Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>
      <Modal visible={selectingStatus} transparent animationType="slide" onRequestClose={() => setSelectingStatus(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Status da fiscalização</Text>
          {statusOptions.map((item) => <TouchableOpacity key={item} style={styles.option} onPress={() => { setStatus(item); setSelectingStatus(false); }}><Text style={styles.optionText}>{item}</Text>{item === status && <Text style={styles.check}>✓</Text>}</TouchableOpacity>)}
          <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectingStatus(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
        </View></View>
      </Modal>
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
      <TouchableOpacity style={styles.button} onPress={atualizarFiscalizacao} disabled={salvando}>
        <Text style={styles.buttonText}>{salvando ? "Salvando..." : "Salvar alterações"}</Text>
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
  },
  selectField: { alignItems: "center", backgroundColor: "#fff", borderColor: "#27ae60", borderRadius: 8, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginBottom: 14, minHeight: 52, paddingHorizontal: 14 },
  selectValue: { color: "#222", fontSize: 16 },
  selectPlaceholder: { color: "#9AA9A2", fontSize: 16 },
  chevron: { color: "#147A50", fontSize: 22 },
  modalBackdrop: { backgroundColor: "#00000066", flex: 1, justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  modalTitle: { color: "#183B56", fontSize: 20, fontWeight: "800", marginBottom: 14 },
  option: { alignItems: "center", borderBottomColor: "#E2ECE7", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 16 },
  optionText: { color: "#183B56", fontSize: 16, fontWeight: "600" },
  check: { color: "#1F9D68", fontSize: 20, fontWeight: "800" },
  cancelButton: { alignItems: "center", backgroundColor: "#E7F6EE", borderRadius: 10, marginTop: 18, padding: 14 },
  cancelText: { color: "#147A50", fontWeight: "800" }
});
