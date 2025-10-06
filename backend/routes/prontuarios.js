import express from "express";
import Prontuario from "../models/Prontuario.js";
import Clinica from '../models/Clinica.js'; // Importar Clinica
import User from '../models/User.js'; // Importar User para filtro de funcionário

const router = express.Router();

// GET: Buscar todos os prontuários
router.get("/", async (req, res) => {
  try {
    // 💡 ATUALIZAÇÃO: Filtro rigoroso por clínica.
    const filtro = {};

    if (req.usuario.perfil === 'patrao') {
        const clinicaId = req.headers['x-clinic-id'];
        if (clinicaId) {
            const matriz = await Clinica.findOne().sort({ createdAt: 1 });
            if (matriz && matriz._id.toString() === clinicaId) {
                // Patrão na Matriz: vê dados da matriz e dados antigos sem clínica.
                filtro.$or = [{ clinica: clinicaId }, { clinica: null }, { clinica: { $exists: false } }];
            } else {
                // Patrão em outra clínica: vê apenas dados daquela clínica.
                filtro.clinica = clinicaId;
            }
        }
    } else if (req.usuario.perfil === 'funcionario') {
        const funcionarioLogado = await User.findById(req.usuario.id);
        if (funcionarioLogado && funcionarioLogado.clinica) {
            filtro.clinica = funcionarioLogado.clinica;
        } else {
            return res.json([]);
        }
    }

    const prontuarios = await Prontuario.find(filtro).sort({ createdAt: -1 });
    res.json(prontuarios);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar prontuários", error: err.message });
  }
});

// POST: Criar novo prontuário
router.post("/", async (req, res) => {
  try {
    // 💡 ATUALIZAÇÃO: Associa o prontuário à clínica selecionada.
    const clinicaId = req.headers['x-clinic-id'];
    const novoProntuario = new Prontuario({
      ...req.body,
      clinica: clinicaId
    });
    await novoProntuario.save();
    res.status(201).json(novoProntuario);
  } catch (err) {
    res.status(400).json({ message: "Erro ao criar prontuário", error: err.message });
  }
});

// PUT: Atualizar prontuário
router.put("/:id", async (req, res) => {
  try {
    const prontuarioAtualizado = await Prontuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!prontuarioAtualizado) {
      return res.status(404).json({ message: "Prontuário não encontrado" });
    }
    res.json(prontuarioAtualizado);
  } catch (err) {
    res.status(400).json({ message: "Erro ao atualizar prontuário", error: err.message });
  }
});

// DELETE: Excluir prontuário
router.delete("/:id", async (req, res) => {
  try {
    const prontuarioDeletado = await Prontuario.findByIdAndDelete(req.params.id);
    if (!prontuarioDeletado) {
      return res.status(404).json({ message: "Prontuário não encontrado" });
    }
    res.json({ message: "Prontuário excluído com sucesso" });
  } catch (err) {
    res.status(500).json({ message: "Erro ao excluir prontuário", error: err.message });
  }
});

export default router;
