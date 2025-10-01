// routes/relatorios.js
import express from 'express';
import Financeiro from '../models/Financeiro.js';
import Agendamento from '../models/Agendamento.js';
import Procedimento from '../models/Procedimento.js';

const router = express.Router();

// Rota para o relatório financeiro
router.get('/financeiro', async (req, res) => {
    try {
        const items = await Financeiro.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar dados financeiros.', error: err.message });
    }
});

// Rota para listar agendamentos com paginação
router.get('/agendamentos', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;  // Número da página, padrão é 1
        const limit = parseInt(req.query.limit) || 10; // Limite de itens por página, padrão é 10
        const skip = (page - 1) * limit; // Cálculo do número de itens a serem pulados

        const totalAgendamentos = await Agendamento.countDocuments(); // Total de agendamentos
        const agendamentos = await Agendamento.find({})
            .skip(skip) // Pula os itens
            .limit(limit); // Limita os itens

        res.status(200).json({
            total: totalAgendamentos,
            page,
            totalPages: Math.ceil(totalAgendamentos / limit), // Total de páginas
            agendamentos,
        });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar agendamentos.', error: err.message });
    }
});

// Rota para listar procedimentos
router.get('/procedimentos', async (req, res) => {
    try {
        const procedimentos = await Procedimento.find({});
        res.status(200).json(procedimentos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar procedimentos.', error: err.message });
    }
});

export default router;