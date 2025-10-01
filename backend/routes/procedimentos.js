import express from 'express';
import Procedimento from '../models/Procedimento.js';
import Financeiro from '../models/Financeiro.js'; // 💡 Importar o modelo Financeiro

const router = express.Router();

// 1. ROTA GET: Listar todos os procedimentos
router.get('/', async (req, res) => {
    try {
        // 💡 CORREÇÃO CRÍTICA: Uso de .populate('paciente')
        // Isso garante que o campo 'paciente' não retorne apenas o ID, mas o objeto completo do paciente,
        // permitindo que o frontend acesse p.paciente.nome e p.paciente.cpf (ou seja, p.paciente)
        const procedimentos = await Procedimento.find().populate('paciente');
        res.json(procedimentos);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar procedimentos', error: err.message });
    }
});

// 2. ROTA POST: Criar novo procedimento (NÃO MUDOU)
router.post('/', async (req, res) => {
    try {
        const novoProcedimento = new Procedimento(req.body);
        await novoProcedimento.save();

        // 💡 LÓGICA ADICIONADA: Criar registro financeiro correspondente
        if (novoProcedimento.valor && novoProcedimento.valor > 0) {
            const registroFinanceiro = new Financeiro({
                descricao: `Procedimento: ${novoProcedimento.nome}`,
                valor: novoProcedimento.valor,
                tipo: 'receita',
                data: new Date().toISOString().split('T')[0], // Usa a data atual
                statusPagamento: 'pendente',
                procedimento: novoProcedimento._id, // Vincula ao procedimento
                nomePaciente: novoProcedimento.paciente?.nome, // Se houver paciente populado
            });
            await registroFinanceiro.save();
        }
        
        // 💡 Melhoria: Popula o paciente no procedimento recém-criado antes de enviar ao cliente
        const procedimentoRetorno = await Procedimento.findById(novoProcedimento._id).populate('paciente');
        
        res.status(201).json(procedimentoRetorno);
    } catch (error) {
        console.error('Erro ao criar procedimento (Mongoose):', error); 
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message).join(', ');
            return res.status(400).json({ 
                message: `Erro de Validação: ${messages}`, 
                error: error.message 
            });
        }
        
        res.status(500).json({ message: 'Erro ao criar procedimento.', error: error.message });
    }
});


// 3. ROTA PUT: Atualizar procedimento por ID
router.put('/:id', async (req, res) => {
    try {
        // Popula o campo 'paciente' após a atualização
        const procedimentoAtualizado = await Procedimento.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        ).populate('paciente'); // 💡 Popula o paciente aqui também!
        
        if (!procedimentoAtualizado) return res.status(404).json({ message: 'Procedimento não encontrado.' });
        res.status(200).json(procedimentoAtualizado);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao atualizar procedimento.', error: error.message });
    }
});

// 4. ROTA DELETE: Excluir procedimento por ID (NÃO MUDOU)
router.delete('/:id', async (req, res) => {
    try {
        const procedimentoDeletado = await Procedimento.findByIdAndDelete(req.params.id);
        if (!procedimentoDeletado) return res.status(404).json({ message: 'Procedimento não encontrado.' });
        res.status(200).json({ message: 'Procedimento excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir procedimento.', error: error.message });
    }
});

export default router;