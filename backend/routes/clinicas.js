import express from 'express';
import Clinica from '../models/Clinica.js';
import Usuario from '../models/User.js';

const router = express.Router();

// Middleware para verificar se o usuário é "patrão"
// Nota: Este middleware assume que o middleware de autenticação principal já foi executado.
const isPatrao = (req, res, next) => {
  if (req.usuario?.perfil !== 'patrao') {
    return res.status(403).json({ error: 'Acesso negado. Apenas para administradores.' });
  }
  next();
};

// Listar todas as clínicas
router.get('/', isPatrao, async (req, res) => {
  try {
    // Garante que a clínica mais antiga (matriz) venha primeiro.
    const clinicas = await Clinica.find().sort({ createdAt: 1 });
    res.json(clinicas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar clínicas.' });
  }
});

// Criar nova clínica
router.post('/', isPatrao, async (req, res) => {
  try {
    const novaClinica = new Clinica(req.body);
    await novaClinica.save();
    res.status(201).json(novaClinica);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar clínica.' });
  }
});

// Atualizar clínica
router.put('/:id', isPatrao, async (req, res) => {
  try {
    const clinicaAtualizada = await Clinica.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!clinicaAtualizada) {
      return res.status(404).json({ error: 'Clínica não encontrada.' });
    }
    res.json(clinicaAtualizada);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar clínica.' });
  }
});

// Deletar clínica
router.delete('/:id', isPatrao, async (req, res) => {
  try {
    // Verificação de segurança: não permite excluir clínica se houver usuários nela.
    const usuariosNaClinica = await Usuario.countDocuments({ clinica: req.params.id });
    if (usuariosNaClinica > 0) {
      return res.status(400).json({ error: 'Não é possível excluir. Existem usuários associados a esta clínica.' });
    }
    const clinicaDeletada = await Clinica.findByIdAndDelete(req.params.id);
    if (!clinicaDeletada) {
      return res.status(404).json({ error: 'Clínica não encontrada.' });
    }
    res.json({ message: 'Clínica excluída com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir clínica.' });
  }
});

export default router;