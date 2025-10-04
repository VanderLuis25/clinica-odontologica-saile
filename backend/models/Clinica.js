import mongoose from 'mongoose';

const clinicaSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  corIdentificacao: { type: String, default: '#800580' }, // Cor para UI
  endereco: { type: String },
  telefone: { type: String },
  // Adicione outros campos que forem relevantes para a clínica
}, { timestamps: true });

const Clinica = mongoose.model('Clinica', clinicaSchema);

export default Clinica;