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
        // Se uma clínica específica for selecionada, filtra por ela.
        // Se não (Visão Geral), o filtro fica vazio e busca de TODAS as clínicas.
        if (clinicaId) filtro.clinica = clinicaId;

    } else if (req.usuario.perfil === 'funcionario') {
        const funcionarioLogado = await User.findById(req.usuario.id);
        if (funcionarioLogado && funcionarioLogado.clinica) {
            filtro.clinica = funcionarioLogado.clinica;
        } else {
            return res.json([]);
        }
    }

    const prontuarios = await Prontuario.find(filtro)
        .populate('profissional', 'nome') // Popula o nome do profissional
        // ✅ CORREÇÃO: Popula o paciente de forma segura, evitando erros se não existir.
        .populate('paciente', 'nome cpf') 
        .sort({ createdAt: -1 });
    res.json(prontuarios);
  } catch (err) {
    console.error("Erro detalhado ao buscar prontuários:", err); // Log detalhado no servidor
    res.status(500).json({ message: "Erro interno ao buscar prontuários.", error: err.message });
  }
});

// POST: Criar novo prontuário
router.post("/", async (req, res) => {
  try {
    let clinicaId;

    // ✅ CORREÇÃO: Garante que a clínica seja a do funcionário logado.
    if (req.usuario.perfil === 'funcionario') {
        const funcionarioLogado = await User.findById(req.usuario.id);
        clinicaId = funcionarioLogado?.clinica; // Pega a clínica do funcionário
    } else {
        // Para o patrão, usa a clínica selecionada no cabeçalho.
        clinicaId = req.headers['x-clinic-id'];
        // ✅ CORREÇÃO: Se o patrão estiver na "Visão Geral" (sem clínica selecionada),
        // e um paciente for selecionado, usa a clínica do paciente para salvar o prontuário.
        if (!clinicaId && req.body.paciente) {
            const paciente = await Paciente.findById(req.body.paciente);
            if (paciente) clinicaId = paciente.clinica;
        }
    }

    if (!clinicaId) return res.status(400).json({ message: "O usuário não está associado a nenhuma clínica." });

    const novoProntuario = new Prontuario({
      ...req.body,
      clinica: clinicaId, // Associa à clínica correta.
      profissional: req.usuario.id, // Salva o ID do profissional que criou
      paciente: req.body.paciente // Garante que o ID do paciente seja salvo
    });
    await novoProntuario.save();
    res.status(201).json(novoProntuario);
  } catch (err) {
    console.error("Erro ao criar prontuário:", err);
    res.status(500).json({ message: "Erro ao criar prontuário", error: err.message });
  }
});

// PUT: Atualizar prontuário
router.put("/:id", async (req, res) => {
  try {
    // ✅ INÍCIO DA VERIFICAÇÃO DE SEGURANÇA
    const prontuario = await Prontuario.findById(req.params.id);
    if (!prontuario) {
      return res.status(404).json({ message: "Prontuário não encontrado." });
    }

    if (req.usuario.perfil === 'funcionario') {
      const funcionarioLogado = await User.findById(req.usuario.id);
      // Verifica se o prontuário pertence à clínica do funcionário
      if (prontuario.clinica.toString() !== funcionarioLogado.clinica.toString()) {
        return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para alterar este prontuário.' });
      }
    }
    // ✅ FIM DA VERIFICAÇÃO DE SEGURANÇA

    const prontuarioAtualizado = await Prontuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('profissional', 'nome'); // Popula o profissional ao retornar

    res.status(200).json(prontuarioAtualizado);
  } catch (err) {
    res.status(400).json({ message: "Erro ao atualizar prontuário", error: err.message });
  }
});

// DELETE: Excluir prontuário
router.delete("/:id", async (req, res) => {
  try {
    // ✅ INÍCIO DA VERIFICAÇÃO DE SEGURANÇA
    const prontuario = await Prontuario.findById(req.params.id);
    if (!prontuario) {
      return res.status(404).json({ message: "Prontuário não encontrado." });
    }

    if (req.usuario.perfil === 'funcionario') {
      const funcionarioLogado = await User.findById(req.usuario.id);
      if (prontuario.clinica.toString() !== funcionarioLogado.clinica.toString()) {
        return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para excluir este prontuário.' });
      }
    }
    // ✅ FIM DA VERIFICAÇÃO DE SEGURANÇA

    const prontuarioDeletado = await Prontuario.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Prontuário excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir prontuário:", err);
    res.status(500).json({ message: "Erro ao excluir prontuário", error: err.message });
  }
});

export default router;
