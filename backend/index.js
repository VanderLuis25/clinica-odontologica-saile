// Adicione esta linha no TOPO do arquivo para carregar as variáveis do .env
require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Usuario = require("./models/Usuario");

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
app.post("/login", async (req, res) => {
  const { nomeEmpresa, senha } = req.body;

  let usuario = await Usuario.findOne({ nomeEmpresa });

  // Se não existe usuário, cria o primeiro Patrão
  if (!usuario) {
    // Hashear a senha antes de salvar
    const senhaHash = await bcrypt.hash(senha, 10);
    usuario = new Usuario({
      nomeEmpresa,
      nome: "Patrão",
      senha: senhaHash,
      perfil: "patrao"
    });
    await usuario.save();
    return res.status(201).json({ message: "Primeiro Patrão criado com sucesso." });
  }

  // Compara a senha com o hash armazenado
  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  // Incluir a clínica do usuário no token para controle de acesso
  const tokenPayload = { 
    id: usuario._id, 
    perfil: usuario.perfil
    // clinicaId: usuario.clinica // 💡 ADICIONAR QUANDO O MODELO 'Usuario' TIVER O CAMPO 'clinica'
  };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "12h" });

  res.json({ token, user: usuario });
});

// Middleware de autenticação
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token necessário" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expirado" });
    }
    res.status(401).json({ error: "Token inválido" });
  }
};

// Exemplo de rota protegida
app.get("/usuarios", auth, async (req, res) => {
  if (req.usuario.perfil !== "patrao") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  
  const usuarios = await Usuario.find();
  res.json(usuarios);
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
