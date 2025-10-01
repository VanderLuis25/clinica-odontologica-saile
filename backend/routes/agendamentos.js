// routes/agendamentos.js
import express from 'express';
import { emitirAtualizacao } from '../server.js';
import Agendamento from '../models/Agendamento.js';

const router = express.Router();

// GET: Buscar todos os agendamentos, populando paciente, procedimento e profissional
router.get('/', async (req, res) => {
    try {
        const agendamentos = await Agendamento.find()
            .populate({
                path: 'paciente',
                // ✅ CORREÇÃO APLICADA AQUI: Mudado de 'tel' para 'telefone'
                select: 'nome cpf telefone' 
            })
            .populate({
                path: 'procedimento',
                select: 'nome valor'
            })
            .populate({
                path: 'profissional',
                select: 'nome funcao perfil' 
            });

        res.json(agendamentos);
    } catch (err) {
        console.error("Erro no GET /agendamentos:", err);
        res.status(500).json({ message: 'Erro ao buscar agendamentos', error: err.message });
    }
});

// POST: Criar novo agendamento
router.post('/', async (req, res) => {
    try {
        const { paciente, procedimento, data, hora, profissional } = req.body;

        // Validação dos campos obrigatórios
        if (!paciente || !procedimento || !data || !hora || !profissional) {
            return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }

        // Converte a data para o formato correto
        const newAgendamento = new Agendamento({
            ...req.body,
            data: new Date(data) // Converte a data se necessário
        });

        await newAgendamento.save();
        emitirAtualizacao();
        res.status(201).json(newAgendamento);
    } catch (err) {
        console.error("Erro ao criar agendamento:", err);
        res.status(500).json({ message: 'Erro ao criar agendamento', error: err.message });
    }
});

// PUT: Atualizar agendamento existente
router.put('/:id', async (req, res) => {
    try {
        const payload = req.body;

        // Converte a data para o formato correto
        if (payload.data && typeof payload.data === 'string') {
            payload.data = new Date(payload.data);
        }

        const updatedAgendamento = await Agendamento.findByIdAndUpdate(
            req.params.id,
            payload,
            { new: true, runValidators: true }
        )
            // ✅ CORREÇÃO APLICADA AQUI: Mudado de 'tel' para 'telefone'
            .populate({ path: 'paciente', select: 'nome cpf telefone' }) 
            .populate({ path: 'procedimento', select: 'nome valor' })
            .populate({ path: 'profissional', select: 'nome funcao perfil' });

        if (!updatedAgendamento) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }

        emitirAtualizacao();
        res.json(updatedAgendamento);
    } catch (err) {
        console.error("Erro ao atualizar agendamento:", err);
        res.status(500).json({ message: 'Erro ao atualizar agendamento', error: err.message });
    }
});

// DELETE: Excluir agendamento
router.delete('/:id', async (req, res) => {
    try {
        const deletedAgendamento = await Agendamento.findByIdAndDelete(req.params.id);
        if (!deletedAgendamento) {
            return res.status(404).json({ message: 'Agendamento não encontrado' });
        }
        emitirAtualizacao();
        res.status(200).json({ message: "Agendamento excluído com sucesso" });
    } catch (err) {
        console.error("Erro ao deletar agendamento:", err);
        res.status(500).json({ message: 'Erro ao deletar agendamento', error: err.message });
    }
});

export default router;