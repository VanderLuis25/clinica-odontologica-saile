import express from 'express';
import Lembrete from '../models/Lembrete.js';
const router = express.Router();

router.get('/', async (req, res) => { 
  try {
    const items = await Lembrete.find().populate('paciente', 'nome');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar lembretes." });
  }
});

router.get('/:id', async (req, res) => { 
  try {
    const item = await Lembrete.findById(req.params.id).populate('paciente', 'nome');
    if (!item) return res.status(404).json({ message: "Lembrete não encontrado." });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar lembrete." });
  }
});

router.post('/', async (req, res) => { 
  try {
    const newItem = await Lembrete.create(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar lembrete." });
  }
});

router.put('/:id', async (req, res) => { 
  try {
    const updated = await Lembrete.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Lembrete não encontrado." });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar lembrete." });
  }
});

router.delete('/:id', async (req, res) => { 
  try {
    await Lembrete.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: "Erro ao deletar lembrete." });
  }
});

export default router;
