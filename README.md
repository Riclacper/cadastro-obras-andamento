# 📱 Cadastro de Obras em Andamento – App Mobile

Aplicativo em **React Native + Expo + TypeScript** para cadastro, acompanhamento e fiscalização de obras públicas.  
Permite registrar obras, fiscalizações, anexar fotos, localização por GPS, e enviar relatórios por e-mail.

---

## 🚀 Tecnologias Utilizadas

- [Expo](https://expo.dev/) (Managed Workflow)
- React Native
- TypeScript
- @react-native-picker/picker
- expo-image-picker, expo-location, expo-router
- react-native-progress
- Integração com backend Node.js + MongoDB via REST API

---

## 📲 Como rodar o app

### Pré-requisitos
- Node.js (>=18)
- Expo CLI (`npm install -g expo-cli`)
- Conta no [Expo Go](https://expo.dev/expo-go) (App para testar no celular)
- Backend rodando (veja documentação do backend)

### Instale as dependências

```bash
npm install
```

### Configure a API

Copie o arquivo de exemplo e informe a URL do backend:

```bash
cp .env.example .env
```

Edite `.env`:

```env
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:5000
```

Em um celular físico, `SEU_IP_LOCAL` deve ser o IP do computador na mesma rede
Wi-Fi do aparelho. Não é necessário alterar arquivos `.tsx`.

### Inicie o projeto

```bash
npx expo start
```

* Faça login no **Expo Go** do seu celular com a mesma conta Expo.
* O projeto aparece em “Projetos” no Expo Go, basta tocar (sem precisar escanear QR code, se estiver logado).
* Ou use o QR code normalmente.

---

## 🛠️ Funcionalidades

* **Splash personalizada** com logo e barra de progresso animada.
* **Cadastro de Obras:** nome, responsável, datas, descrição, foto (câmera), localização via GPS.
* **Listagem de Obras:** com “pull to refresh” (puxar para atualizar) e botão flutuante para adicionar nova.
* **Detalhes da Obra:** dados completos, foto, localização, fiscalizações associadas.
* **Cadastro e edição de Fiscalizações:** data, status, observações, foto, localização, obra vinculada.
* **Envio de relatório por e-mail:** envia todos os dados para o endereço escolhido.
* **Visual moderno e responsivo, com botões arredondados e ícones.**
* **Compatível com tema claro e escuro.**
* **Fluxo 100% integrado ao backend**.

---

## 📦 Estrutura de Pastas

```
app/
  ├── obras/
  │     ├── index.tsx         # Listagem de obras (com refresh)
  │     ├── nova.tsx          # Cadastro de obra
  │     ├── [id].tsx          # Detalhes da obra
  │     └── editar/[id].tsx   # Edição de obra
  ├── fiscalizacoes/
  │     ├── nova.tsx          # Cadastro de fiscalização
  │     ├── editar/[id].tsx   # Edição de fiscalização
  │     └── ...
  ├── components/
  │     └── Header.tsx        # Componente da logo
  ├── assets/
  │     └── images/logo.png   # Logo do app
  ├── utils/
  │     └── formatDate.ts     # Funções para datas
  ├── SplashScreen.tsx        # Splash personalizada com barra
  ├── index.tsx               # Exporta SplashScreen como tela inicial
  ├── (tabs)/                 # Rotas de abas do app
  ...
```

---

## 💡 Observações

* **Datas:** preencha sempre como `DD-MM-YYYY` ou `DD/MM/YYYY` (app converte automaticamente para ISO).
* **Permissões:** o app solicita acesso à câmera e localização quando necessário.
* **API Backend:** o app espera que o backend (Node.js/MongoDB) esteja rodando e acessível na mesma rede.
* **Configuração:** a URL é lida de `EXPO_PUBLIC_API_URL`; o arquivo `.env` não deve ser versionado.
* **Atualização das listas:** basta puxar para baixo para atualizar as obras ou fiscalizações.

---

## 📸 Prints de Telas

> Inclua prints das principais telas: splash personalizada, cadastro, listagem, detalhes, envio de e-mail, etc.

---

## 👨‍💻 Autor

Desenvolvido por **Ricardo Lacerda**
Orientação acadêmica: **Geraldo Gomes**

---

## 📚 Licença

Este projeto é para fins acadêmicos e didáticos.
