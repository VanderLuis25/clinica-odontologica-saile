import mongoose from "mongoose";

const procedimentoSchema = new mongoose.Schema({
    tipo: { 
        type: String,
        required: true 
    },
    nome: { 
        type: String, 
        required: true 
    },
    valor: { 
        type: Number, 
        required: true 
    },
    detalhes: { 
        type: String 
    },
    
    // 💡 CRÍTICO: Referência ao Paciente para que a listagem funcione
    paciente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente', // Assume que o seu modelo de paciente se chama 'Paciente'
        required: true
    },

    // 💡 NOVO: Referência à Clínica
    clinica: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinica',
        required: true,
        index: true // Otimiza consultas por clínica
    },
    
    // Campos de Informações Básicas do Paciente (para manter no histórico)
    idade: {
        type: Number
    },
    cpf: {
        type: String
    },
    telefone: {
        type: String
    },

    // Campos de Harmonização Facial
    dataAplicacaoBotox: {
        type: Date
    },
    regiaoTratadaBotox: {
        type: String
    },
    pontosBotox: {
        type: String
    },
    unidadesBotox: {
        type: Number
    },
    dataAplicacaoAcido: {
        type: Date
    },
    regiaoTratadaAcido: {
        type: String
    },
    produtoAcido: {
        type: String
    },
    volumeInjetado: {
        type: String
    },
    observacoes: {
        type: String
    },

}, {
    // Adiciona automaticamente 'createdAt' e 'updatedAt'
    timestamps: true 
});

const Procedimento = mongoose.model("Procedimento", procedimentoSchema);

export default Procedimento;