import express from "express";
import Prontuario from "../models/Prontuario.js";

const router = express.Router();

// GET: Buscar todos os prontuários
router.get("/", async (req, res) => {
  try {
    const prontuarios = await Prontuario.find().sort({ createdAt: -1 });
    res.json(prontuarios);
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar prontuários", error: err.message });
  }
});

// POST: Criar novo prontuário
router.post("/", async (req, res) => {
  try {
    const novoProntuario = new Prontuario(req.body);
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
