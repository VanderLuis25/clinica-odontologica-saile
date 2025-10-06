// models/Paciente.js
import mongoose from 'mongoose';
import Clinica from './Clinica.js'; // Importar para referência

const { Schema, model } = mongoose;

const medicalHistorySchema = new Schema({
  bloodType: String,
  allergies: String,
  chronicDiseases: String,
  habits: String,
  medications: String,
  surgeries: String,
  familyHistory: String,
  lastVisit: Date,
  currentComplaints: String
}, { _id: false });

const pacienteSchema = new Schema({
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
  medicalHistory: medicalHistorySchema,

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

const Paciente = model('Paciente', pacienteSchema);
export default Paciente;