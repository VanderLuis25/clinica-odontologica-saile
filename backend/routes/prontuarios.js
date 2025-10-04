import express from "express";
import Prontuario from "../models/Prontuario.js";
import Clinica from '../models/Clinica.js'; // Importar Clinica

const router = express.Router();

// GET: Buscar todos os prontuários
router.get("/", async (req, res) => {
  try {
    // 💡 ATUALIZAÇÃO: Filtro rigoroso por clínica.
    const clinicaId = req.headers['x-clinic-id'];
    const filtro = {};

    // Lógica para tratar dados antigos como pertencentes à clínica matriz.
    if (clinicaId) {
        const matriz = await Clinica.findOne().sort({ createdAt: 1 });
        if (matriz && matriz._id.toString() === clinicaId) {
            // Se a clínica selecionada é a matriz, mostra os dela E os sem clínica.
            filtro.$or = [{ clinica: clinicaId }, { clinica: null }, { clinica: { $exists: false } }];
        } else {
            // Para outras clínicas, mostra apenas os dados exclusivos dela.
            filtro.clinica = clinicaId;
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
