// Adicione esta linha no TOPO do arquivo para carregar as variáveis do .env
require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Usuario = require("./models/Usuario");
const Clinica = require("./models/Clinica"); // 1. Importar o modelo Clinica

const app = express();
// Use a variável de ambiente para a porta ou 5000 como padrão
const PORT = process.env.PORT || 5000;
// Use a variável de ambiente para a chave secreta
const JWT_SECRET = process.env.SECRET_KEY;
// Use a variável de ambiente para a string de conexão do MongoDB
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão MongoDB Atlas (Opções obsoletas removidas)
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB conectado"))
  .catch(err => console.log(err));

// Criar primeiro Patrão automaticamente
app.post("/usuarios/login", async (req, res) => {
  const { username, password, nomeEmpresa } = req.body;

  // Procura pelo username (padrão) ou pelo nomeEmpresa (primeiro login do patrão)
  const query = username ? { username } : { nomeEmpresa };
  let usuario = await Usuario.findOne(query);

  // Se não existe usuário E foi passado nomeEmpresa, cria o primeiro Patrão
  if (!usuario && nomeEmpresa) {
    // Hashear a senha antes de salvar
    const senhaHash = await bcrypt.hash(password, 10);
    usuario = new Usuario({
      nomeEmpresa,
      nome: "Patrão",
      username: nomeEmpresa, // Garante que o patrão também tenha um username para login futuro
      senha: senhaHash,
      perfil: "patrao"
    });
    await usuario.save();
    return res.status(201).json({ message: "Primeiro Patrão criado com sucesso." });
  }

  // Compara a senha com o hash armazenado
  if (!usuario) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const senhaValida = await bcrypt.compare(password, usuario.senha);
  if (!senhaValida) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const token = jwt.sign({ id: usuario._id, perfil: usuario.perfil }, JWT_SECRET, { expiresIn: "12h" });

  // Retorna o usuário completo para o frontend ter acesso a todos os dados
  // Omitindo a senha por segurança
  const userResponse = usuario.toObject();
  delete userResponse.senha;
  res.json({ token, user: userResponse });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
