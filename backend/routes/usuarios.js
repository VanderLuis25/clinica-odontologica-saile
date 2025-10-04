import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto"; // 1. Importar crypto para gerar o token
import nodemailer from "nodemailer"; // 2. Importar nodemailer para enviar email

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || "sua-chave-secreta-muito-segura";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).send("Token não fornecido.");
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).send("Token inválido.");
    req.userId = decoded.id;
    req.userPerfil = decoded.perfil;
    next();
  });
};

const verifyPatrao = (req, res, next) => {
  if (req.userPerfil !== "patrao") return res.status(403).send("Acesso negado. Apenas patrão.");
  next();
};

// ----------------------------------------------------
// ROTA DE LOGIN
// ----------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const patraoExistente = await User.findOne({ perfil: "patrao" });

    if (!patraoExistente && username === "patrao" && password) {
      if (!username || !password)
        return res.status(400).json({ message: "Usuário e senha obrigatórios para criar patrão." });

      const hashedPassword = await bcrypt.hash(password, 10);
      const novoPatrao = new User({
        username,
        password: hashedPassword,
        nome: username,
        perfil: "patrao",
        profissional: "Dona",
      });
      await novoPatrao.save();

      const token = jwt.sign({ id: novoPatrao._id, perfil: novoPatrao.perfil }, SECRET_KEY, { expiresIn: "8h" });

      return res.json({
        token,
        user: {
          id: novoPatrao._id,
          nome: novoPatrao.nome,
          perfil: novoPatrao.perfil,
          profissional: novoPatrao.profissional,
          funcao: novoPatrao.funcao,
          foto: novoPatrao.foto ? novoPatrao.foto : "",
        },
      });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) return res.status(401).json({ message: "Senha incorreta" });

    const token = jwt.sign({ id: user._id, perfil: user.perfil }, SECRET_KEY, { expiresIn: "8h" });

    res.json({
      token,
      user: {
        id: user._id,
        nome: user.nome,
        perfil: user.perfil, 
        profissional: user.profissional || "",
        funcao: user.funcao,
        foto: user.foto ? user.foto : "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro no login" });
  }
});
// ----------------------------------------------------
// FIM DA ROTA DE LOGIN
// ----------------------------------------------------

// ----------------------------------------------------
// ✅ ETAPA 1: ROTA PARA SOLICITAR REDEFINIÇÃO DE SENHA
// ----------------------------------------------------
router.post("/esqueci-senha", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Para segurança, não informamos se o e-mail foi encontrado ou não.
    if (!user) {
      return res.status(200).json({ message: "Se um usuário com este e-mail existir, um link de redefinição foi enviado." });
    }

    // Gerar um token seguro
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Salvar o token e a data de expiração (1 hora) no usuário
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hora
    await user.save();

    // Configurar o transportador de e-mail (usando variáveis de ambiente)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true para porta 465, false para outras
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Criar o link de redefinição
    const resetUrl = `http://localhost:3000/redefinir-senha/${resetToken}`;

    // Enviar o e-mail
    await transporter.sendMail({
      from: `"Clínica Odontológica" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Redefinição de Senha",
      html: `
        <p>Você solicitou a redefinição de senha.</p>
        <p>Clique neste <a href="${resetUrl}">link</a> para redefinir sua senha.</p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>
      `,
    });

    res.status(200).json({ message: "Se um usuário com este e-mail existir, um link de redefinição foi enviado." });

  } catch (error) {
    console.error("Erro em /esqueci-senha:", error);
    res.status(500).json({ message: "Erro ao processar a solicitação." });
  }
});

// ----------------------------------------------------
// ✅ ETAPA 2: ROTA PARA REDEFINIR A SENHA COM O TOKEN
// ----------------------------------------------------
router.post("/redefinir-senha/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Encontrar o usuário pelo token e verificar se não expirou
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }, // $gt = "greater than"
    });

    if (!user) {
      return res.status(400).json({ message: "Token de redefinição inválido ou expirado." });
    }

    // Redefinir a senha e limpar os campos do token
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Senha redefinida com sucesso!" });

  } catch (error) {
    console.error("Erro em /redefinir-senha:", error);
    res.status(500).json({ message: "Erro ao redefinir a senha." });
  }
});


// ----------------------------------------------------
// ✅ ROTA DE LISTAGEM CORRIGIDA PARA USAR O FILTRO 'perfil'
// ----------------------------------------------------
router.get("/", verifyToken, verifyPatrao, async (req, res) => {
  try {
    // Captura o parâmetro 'perfil' da URL (ex: ?perfil=funcionario)
    const { perfil } = req.query; 

    // Cria um objeto de filtro. Se 'perfil' estiver presente, adiciona { perfil: valor }
    const filtro = perfil ? { perfil } : {};
    
    // Usa o filtro na busca do Mongoose
    // Se o filtro for vazio ({}), ele busca todos. Se tiver perfil, filtra.
    // 💡 CORREÇÃO: Adicionado .populate() para buscar os dados da clínica associada.
    const users = await User.find(filtro, { password: 0 }).populate('clinica', 'nome'); 
    
    res.json(users);
  } catch (err) {
    res.status(500).send("Erro ao buscar usuários: " + err.message);
  }
});


router.post("/", verifyToken, verifyPatrao, upload.single("foto"), async (req, res) => {
  try {
    // 💡 CORREÇÃO: Adicionado 'clinica' à desestruturação
    const { username, password, nome, cpf, tel, email, funcao, perfil, profissional, clinica } = req.body;
    if (!username || !password) return res.status(400).send("Usuário e senha obrigatórios.");

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser = new User({
      username,
      password: hashedPassword,
      nome,
      cpf,
      tel,
      email,
      funcao,
      perfil: perfil || "funcionario",
      profissional: profissional || "Atendente",
      foto: req.file ? `/uploads/${req.file.filename}` : "",
      clinica: clinica || null, // 💡 CORREÇÃO: Salva a clínica
    });
    await newUser.save();

    // Popula a clínica antes de retornar para garantir que o nome esteja disponível
    newUser = await User.findById(newUser._id).populate('clinica', 'nome');
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).send("Erro ao criar usuário: " + err.message);
  }
});

router.put("/:id", verifyToken, verifyPatrao, upload.single("foto"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
    if (req.file) updates.foto = `/uploads/${req.file.filename}`;

    // 💡 CORREÇÃO: Adicionado .populate() para retornar o usuário atualizado com os dados da clínica
    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true })
                                  .populate('clinica', 'nome');
    res.json(updatedUser);
  } catch (err) {
    res.status(500).send("Erro ao atualizar usuário: " + err.message);
  }
});

router.delete("/:id", verifyToken, verifyPatrao, async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(204).send();
  } catch (err) {
    res.status(500).send("Erro ao deletar usuário: " + err.message);
  }
});


export default router;