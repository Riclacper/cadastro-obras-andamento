import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, Button, Alert, TouchableOpacity, ActivityIndicator, Modal, TextInput, StyleSheet, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiFetch } from "@/utils/api";
import Header from "../../components/Header";
import { getAuthUser } from "@/utils/session";
import type { Localizacao } from "@/utils/location";

interface Obra {
  _id: string;
  nome: string;
  responsavel: string;
  dataInicio: string;
  dataFim: string;
  status?: string;
  descricao: string;
  foto?: string;
  localizacao?: Localizacao;
}

interface Fiscalizacao {
  _id: string;
  data: string;
  status: string;
  observacoes: string;
  foto?: string;
  localizacao?: Localizacao;
}

function statusColor(status?: string) {
  if (status === "Concluída") return "#168557";
  if (status === "Pausada") return "#B83B45";
  if (status === "Planejada") return "#2477A8";
  return "#D97706";
}

function mapaUrl(localizacao: Localizacao) {
  return localizacao.googleMapsUrl || `https://www.google.com/maps?q=${localizacao.lat},${localizacao.long}`;
}

export default function DetalheObra() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [obra, setObra] = useState<Obra | null>(null);
  const [fiscalizacoes, setFiscalizacoes] = useState<Fiscalizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEmail, setModalEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  async function fetchObra() {
    setLoading(true);
    try {
      const res = await apiFetch(`/obras/${id}`);
      const data = await res.json();
      setObra(data);
    } catch (err) {
      Alert.alert("Erro ao carregar obra");
    }
    setLoading(false);
  }

  async function fetchFiscalizacoes() {
    try {
      const res = await apiFetch(`/obras/${id}/fiscalizacoes`);
      const data = await res.json();
      setFiscalizacoes(data);
    } catch (err) {
      setFiscalizacoes([]);
    }
  }

  useEffect(() => {
    fetchObra();
    fetchFiscalizacoes();
    void getAuthUser().then((user) => setIsAdmin(user?.role === "admin"));
  }, [id]);

  async function deletarObra() {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir esta obra e todas as fiscalizações relacionadas?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiFetch(`/obras/${id}`, { method: "DELETE" });
              if (res.ok) {
                Alert.alert("Obra excluída com sucesso!");
                router.replace("/obras");
              } else {
                Alert.alert("Erro ao excluir obra");
              }
            } catch {
              Alert.alert("Erro ao excluir obra");
            }
          }
        }
      ]
    );
  }

  async function enviarEmail() {
    if (!email) {
      Alert.alert("Digite um e-mail válido!");
      return;
    }
    setSending(true);
    try {
      const res = await apiFetch(`/obras/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        Alert.alert("E-mail enviado com sucesso!");
        setModalEmail(false);
        setEmail("");
      } else {
        const data = await res.json();
        Alert.alert("Erro ao enviar e-mail", data.error || "");
      }
    } catch (error) {
      Alert.alert("Erro ao enviar relatório", error instanceof Error ? error.message : "Verifique a configuração de e-mail do backend.");
    }
    setSending(false);
  }

  if (loading || !obra) {
    return <ActivityIndicator size="large" color="#27ae60" style={{ marginTop: 64 }} />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 18, backgroundColor: "#fff", flexGrow: 1 }}>
      <Header title={obra.nome} />
      {obra.foto ? (
        <Image source={{ uri: obra.foto }} style={styles.img} />
      ) : (
        <View style={styles.semImg}><Text>Sem imagem</Text></View>
      )}

      <Text style={styles.label}>Responsável:</Text>
      <Text>{obra.responsavel}</Text>

      <Text style={styles.label}>Datas:</Text>
      <Text>
        {obra.dataInicio.slice(0, 10)} até {obra.dataFim.slice(0, 10)}
      </Text>

      <Text style={styles.label}>Status da obra:</Text>
      <View style={[styles.statusBadge, { backgroundColor: `${statusColor(obra.status)}18` }]}>
        <Text style={[styles.statusText, { color: statusColor(obra.status) }]}>{obra.status || "Em andamento"}</Text>
      </View>

      <Text style={styles.label}>Localização:</Text>
      {obra.localizacao
        ? <><Text>Lat: {obra.localizacao.lat} | Long: {obra.localizacao.long}</Text>{obra.localizacao.endereco && <Text>Endereço aproximado: {obra.localizacao.endereco}</Text>}{obra.localizacao.precisao && <Text>Precisão: aproximadamente {obra.localizacao.precisao} m</Text>}<TouchableOpacity onPress={() => void Linking.openURL(mapaUrl(obra.localizacao!))}><Text style={styles.mapLink}>Abrir no Google Maps</Text></TouchableOpacity></>
        : <Text>Não informada</Text>}

      <Text style={styles.label}>Descrição da obra:</Text>
      <Text>{obra.descricao}</Text>

      <View style={styles.separador} />

      <Text style={styles.fiscalizacoesTitle}>Fiscalizações da obra</Text>
      <View style={styles.fiscalizacoesContent}>
        {fiscalizacoes.length === 0 ? (
          <Text style={styles.emptyFiscalizacoes}>Nenhuma fiscalização cadastrada.</Text>
        ) : (
          fiscalizacoes.map((f) => (
            <TouchableOpacity key={f._id} style={styles.fiscalCard} onPress={() => router.push(`/fiscalizacoes/${f._id}`)}>
            <Text style={{ fontWeight: "bold" }}>{f.status} - {f.data.slice(0, 10)}</Text>
            <Text style={styles.observationLabel}>Observações: <Text style={styles.observation}>{f.observacoes}</Text></Text>
            {f.foto ? <Image source={{ uri: f.foto }} style={styles.fiscImg} /> : null}
            {f.localizacao
              ? <><Text style={{ fontSize: 12, color: "#555" }}>Lat: {f.localizacao.lat} | Long: {f.localizacao.long}</Text>{f.localizacao.endereco && <Text style={{ fontSize: 12, color: "#555" }}>{f.localizacao.endereco}</Text>}{f.localizacao.precisao && <Text style={{ fontSize: 12, color: "#555" }}>Precisão: {f.localizacao.precisao} m</Text>}</>
              : null}
          </TouchableOpacity>
          ))
        )}
      </View>

      <View style={[styles.actionGrid, styles.actionsTopSpacing]}>
        {isAdmin && <TouchableOpacity style={[styles.actionButton, styles.blueAction]} onPress={() => router.push(`/obras/editar/${obra._id}`)}><Text style={styles.actionText}>Editar obra</Text></TouchableOpacity>}
        <TouchableOpacity style={[styles.actionButton, styles.greenAction]} onPress={() => router.push({ pathname: "/fiscalizacoes/nova", params: { obraId: obra._id } })}><Text style={styles.actionText}>Nova fiscalização</Text></TouchableOpacity>
      </View>
      <View style={styles.actionGrid}>
        {isAdmin && <TouchableOpacity style={[styles.actionButton, styles.orangeAction]} onPress={() => setModalEmail(true)}><Text style={styles.actionText}>Gerar relatório</Text></TouchableOpacity>}
        {isAdmin && <TouchableOpacity style={[styles.actionButton, styles.redAction]} onPress={deletarObra}><Text style={styles.actionText}>Excluir obra</Text></TouchableOpacity>}
      </View>

      {/* Modal para digitar e-mail */}
      <Modal visible={modalEmail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>Gerar relatório por e-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o e-mail"
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Button title="Cancelar" color="#888" onPress={() => setModalEmail(false)} />
              <Button title={sending ? "Enviando..." : "Enviar"} color="#27ae60" onPress={enviarEmail} disabled={sending} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titulo: { fontWeight: "bold", fontSize: 22, marginBottom: 8 },
  img: { width: "100%", height: 180, borderRadius: 8, marginBottom: 12 },
  semImg: { width: "100%", height: 180, borderRadius: 8, marginBottom: 12, backgroundColor: "#eee", alignItems: "center", justifyContent: "center" },
  label: { fontWeight: "bold", marginTop: 8 },
  mapLink: { color: "#2477A8", fontWeight: "800", marginTop: 4 },
  separador: { height: 1, backgroundColor: "#ddd", marginVertical: 12 },
  fiscalCard: { backgroundColor: "#f3f3f3", borderRadius: 7, padding: 10, marginBottom: 10 },
  observationLabel: { color: "#183B56", fontSize: 12, fontWeight: "800", marginTop: 4 },
  observation: { color: "#333", fontWeight: "400" },
  statusBadge: { alignSelf: "flex-start", borderRadius: 9, marginTop: 2, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 13, fontWeight: "800" },
  fiscImg: { width: 80, height: 60, borderRadius: 6, marginTop: 6 },
  fiscalizacoesTitle: { color: "#183B56", fontSize: 18, fontWeight: "800", marginBottom: 12, marginTop: 4 },
  fiscalizacoesContent: { marginBottom: 6 },
  emptyFiscalizacoes: { color: "#718096", marginBottom: 8 },
  actionsTopSpacing: { marginTop: 12 },
  actionGrid: { flexDirection: "row", gap: 10, marginBottom: 10, marginTop: 4 },
  actionButton: { alignItems: "center", borderRadius: 12, flex: 1, justifyContent: "center", minHeight: 52, paddingHorizontal: 8, paddingVertical: 10 },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "800", textAlign: "center" },
  blueAction: { backgroundColor: "#2477A8" },
  greenAction: { backgroundColor: "#168557" },
  orangeAction: { backgroundColor: "#D97706" },
  redAction: { backgroundColor: "#B83B45" }
  , modalOverlay: { flex: 1, backgroundColor: "#0008", alignItems: "center", justifyContent: "center" },
  modalContent: { backgroundColor: "#fff", padding: 24, borderRadius: 8, width: "85%" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginVertical: 12 }
});
