import express from 'express';
import Financeiro from '../models/Financeiro.js';
const router = express.Router();

router.get('/', async (req, res) => { 
  try {
    // 💡 ATUALIZAÇÃO: Filtro rigoroso por clínica.
    const clinicaId = req.headers['x-clinic-id'];
    const filtro = clinicaId ? { clinica: clinicaId } : {};

    const items = await Financeiro.find(filtro).populate({
      path: 'procedimento',
      populate: {
        path: 'paciente',
        model: 'Paciente'
      }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar registros financeiros.', error });
  }
});
router.get('/:id', async (req, res) => { const item = await Financeiro.findById(req.params.id); res.json(item); });
router.post('/', async (req, res) => { 
  // 💡 ATUALIZAÇÃO: Associa o lançamento à clínica selecionada.
  const clinicaId = req.headers['x-clinic-id'];
  const newItem = await Financeiro.create({
    ...req.body,
    clinica: clinicaId
  }); 
  res.json(newItem); 
});
router.put('/:id', async (req, res) => { const updated = await Financeiro.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(updated); });
router.delete('/:id', async (req, res) => { await Financeiro.findByIdAndDelete(req.params.id); res.json({ message: 'Deletado com sucesso' }); });

export default router;