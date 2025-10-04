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

  const token = jwt.sign({ id: usuario._id, perfil: usuario.perfil }, JWT_SECRET, { expiresIn: "12h" });

  // Retorna o usuário completo para o frontend ter acesso a todos os dados
  // Omitindo a senha por segurança
  const userResponse = usuario.toObject();
  delete userResponse.senha;
  res.json({ token, user: userResponse });
});

// Middleware de autenticação
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token necessário" });

  // 2. Middleware agora extrai o ID da clínica do header
  const clinicaId = req.headers['x-clinic-id'];

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    if (clinicaId) req.clinicaId = clinicaId; // Adiciona o ID da clínica na requisição
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expirado" });
    }
    res.status(401).json({ error: "Token inválido" });
  }
};

// Exemplo de rota protegida ATUALIZADA para filtrar por clínica
app.get("/usuarios", auth, async (req, res) => {
  if (req.usuario.perfil !== "patrao") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  
  // 3. Filtra os usuários pela clínica selecionada
  const filter = {};
  if (req.clinicaId) {
    filter.clinica = req.clinicaId;
  }

  // Popula o nome da clínica para exibir no frontend
  const usuarios = await Usuario.find(filter).populate('clinica', 'nome');
  res.json(usuarios);
});

// 4. NOVAS ROTAS PARA GERENCIAMENTO DE CLÍNICAS (Apenas para o Patrão)
const isPatrao = (req, res, next) => {
  if (req.usuario.perfil !== 'patrao') {
    return res.status(403).json({ error: 'Acesso negado. Apenas para administradores.' });
  }
  next();
};

// Listar todas as clínicas
app.get('/api/clinicas', auth, isPatrao, async (req, res) => {
  try {
    const clinicas = await Clinica.find();
    res.json(clinicas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar clínicas.' });
  }
});

// Criar nova clínica
app.post('/api/clinicas', auth, isPatrao, async (req, res) => {
  try {
    const novaClinica = new Clinica(req.body);
    await novaClinica.save();
    res.status(201).json(novaClinica);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar clínica.' });
  }
});

// Adicione aqui as rotas para ATUALIZAR (PUT) e DELETAR (DELETE) clínicas se necessário
// ...

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
