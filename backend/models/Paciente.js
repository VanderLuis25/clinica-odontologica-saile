// models/Paciente.js
// ✅ CORREÇÃO: Importa o mongoose e desestrutura Schema e model
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const pacienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true,
  },
  dataNascimento: {
    type: Date,
    required: true, // ESTE CAMPO ESTÁ CORRETO, MAS EXIGE VALOR NO FORMULÁRIO
  },
  idade: {
    type: Number,
    required: false,
  },
  cpf: {
    type: String,
    required: true,
    // A unicidade será garantida pelo índice composto com 'clinica'
    trim: true,
  },
  telefone: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    // A unicidade será garantida pelo índice composto com 'clinica'
    sparse: true,
    trim: true,
    lowercase: true,
  },

  // ✅ NOVOS CAMPOS ADICIONADOS CONFORME SOLICITAÇÃO
  sexo: { type: String },
  rg: { type: String, unique: true, sparse: true },
  profissao: { type: String },

  endereco: {
    rua: { type: String },
    numero: { type: String },
    bairro: { type: String },
    cidade: { type: String },
    estado: { type: String },
    cep: { type: String },
  },
  // FIM DOS NOVOS CAMPOS


  // ✅ NOVO: Adiciona a referência à clínica
  clinica: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinica',
    required: true,
    index: true // Otimiza consultas por clínica
  }
}, { timestamps: true });

// ✅ CORREÇÃO: Cria um índice composto que garante que o CPF seja único POR CLÍNICA.
// Isso permite que o mesmo CPF seja cadastrado em clínicas diferentes.
pacienteSchema.index({ clinica: 1, cpf: 1 }, { unique: true });

const Paciente = mongoose.model('Paciente', pacienteSchema);
export default Paciente;