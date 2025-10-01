// models/Paciente.js
import mongoose from 'mongoose';

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
    unique: true,
    trim: true,
  },
  telefone: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  medicalHistory: medicalHistorySchema
}, { timestamps: true });

pacienteSchema.index({ nome: 1 });
pacienteSchema.index({ cpf: 1 }, { unique: true });

const Paciente = model('Paciente', pacienteSchema);
export default Paciente;