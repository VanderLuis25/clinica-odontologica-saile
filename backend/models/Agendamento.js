// models/Agendamento.js
import mongoose from 'mongoose';

const agendamentoSchema = new mongoose.Schema({
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',
    required: true,
  },
  procedimento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Procedimento',
    required: false, // ✅ CORREÇÃO: Procedimento agora é opcional
  },
  data: {
    type: Date,
    required: true,
  },
  hora: {
    type: String,
    required: true,
  },
  observacoes: {
    type: String,
  },
  profissional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tipoPaciente: {
    type: String,
    enum: ['adulto', 'infantil'],
    default: 'adulto'
  },
  assinaturaResponsavel: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Confirmado', 'Cancelado', 'Falta'],
    default: 'Confirmado',
  },

  // ✅ NOVO: Adiciona a referência à clínica para isolamento de dados.
  clinica: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinica',
    required: true,
    index: true // Otimiza as buscas por clínica
  }
}, { timestamps: true });

const Agendamento = mongoose.model('Agendamento', agendamentoSchema);
export default Agendamento;