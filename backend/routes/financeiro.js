import express from 'express';
import Financeiro from '../models/Financeiro.js';
import Clinica from '../models/Clinica.js'; // Importar Clinica
import User from '../models/User.js'; // 💡 Importar User para buscar dados do funcionário
const router = express.Router();

router.get('/', async (req, res) => { 
  try {
    const filtro = {};

    if (req.usuario.perfil === 'patrao') {
        const clinicaId = req.headers['x-clinic-id'];
        // Se uma clínica específica for selecionada, filtra por ela.
        // Se não, o filtro fica vazio e busca de TODAS as clínicas.
        if (clinicaId) filtro.clinica = clinicaId;
    } else if (req.usuario.perfil === 'funcionario') {
        const funcionarioLogado = await User.findById(req.usuario.id);
        if (funcionarioLogado && funcionarioLogado.clinica) {
            // Funcionário: vê apenas dados da sua própria clínica.
            filtro.clinica = funcionarioLogado.clinica;
        } else {
            // Se o funcionário não tem clínica, ele não pode ver nenhum registro financeiro.
            return res.json([]);
        }
    }

    const items = await Financeiro.find(filtro).populate({
      path: 'procedimento',
      populate: {
        path: 'paciente',
        model: 'Paciente'
      },
    }).populate('clinica', 'nome'); // Popula o nome da clínica
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar registros financeiros.', error });
  }
});
router.get('/:id', async (req, res) => { const item = await Financeiro.findById(req.params.id); res.json(item); });
router.post('/', async (req, res) => { 
  try {
    let clinicaId;
  
    // ✅ CORREÇÃO: Garante que a clínica seja a do funcionário logado.
    if (req.usuario.perfil === 'funcionario') {
        const funcionarioLogado = await User.findById(req.usuario.id);
        clinicaId = funcionarioLogado?.clinica;
    } else {
        // Para o patrão, continua usando o cabeçalho.
        clinicaId = req.headers['x-clinic-id'];
    }
  
    if (!clinicaId) return res.status(400).json({ message: "O usuário não está associado a nenhuma clínica." });
  
    const newItem = await Financeiro.create({
      ...req.body,
      clinica: clinicaId // Associa à clínica correta.
    }); 
    res.json(newItem); 
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar registro financeiro.', error });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const registro = await Financeiro.findById(req.params.id);
    if (!registro) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }

    if (req.usuario.perfil === 'funcionario') {
      const funcionarioLogado = await User.findById(req.usuario.id);
      if (registro.clinica.toString() !== funcionarioLogado.clinica.toString()) {
        return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para alterar este registro.' });
      }
    }

    const updated = await Financeiro.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar registro financeiro.', error });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const registro = await Financeiro.findById(req.params.id);
    if (!registro) {
      return res.status(404).json({ message: 'Registro financeiro não encontrado.' });
    }

    if (req.usuario.perfil === 'funcionario') {
      const funcionarioLogado = await User.findById(req.usuario.id);
      if (registro.clinica.toString() !== funcionarioLogado.clinica.toString()) {
        return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para excluir este registro.' });
      }
    }

    await Financeiro.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir registro financeiro.', error });
  }
});

export default router;