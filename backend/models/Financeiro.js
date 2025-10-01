import mongoose from 'mongoose';

const financeiroSchema = new mongoose.Schema({
  // Campos básicos
  descricao: {
    type: String,
    required: true,
  },
  valor: {
    type: Number,
    required: true,
  },
  data: {
    type: String,
    required: true,
  },
  tipo: {
    type: String,
    required: true,
  },
  // Novo campo para o plano de pagamento
  planoPagamento: [
    {
      data: { type: String, default: '' },
      valor: { type: Number, default: 0 },
      observacoes: { type: String, default: '' },
      responsavel: { type: String, default: '' },
    },
  ],
  // Assinatura digital
  assinaturaDigital: {
    type: String, // Base64 da assinatura
    required: false,
  },
  dataAssinatura: {
    type: String,
    required: false,
  },
  // Dados do paciente
  nomePaciente: {
    type: String,
    required: false,
  },
  cpfPaciente: {
    type: String,
    required: false,
  },
  // Status do pagamento
  statusPagamento: {
    type: String,
    enum: ['pendente', 'pago', 'cancelado'],
    default: 'pendente',
  },
  // Referência ao procedimento que originou este lançamento
  procedimento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Procedimento',
  },
  // Metadados
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware para atualizar updatedAt
financeiroSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Financeiro = mongoose.model('Financeiro', financeiroSchema);

export default Financeiro;
