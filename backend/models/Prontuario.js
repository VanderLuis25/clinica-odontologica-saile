import mongoose from "mongoose";

const prontuarioSchema = new mongoose.Schema(
  {
    // ✅ CORREÇÃO: Adiciona a referência ao profissional que criou o prontuário
    profissional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
    nome: { type: String, required: true },
    cpf: { type: String, required: true },
    data: { type: String, required: true },
    observacoes: { type: String, default: "" },
    historicoFamiliar: { type: String, default: "" },
    evolucao: { type: String, default: "" },
    medicamento: { type: String, default: "" },
    dosagem: { type: String, default: "" }, // Para receituário
    historicoMedico: { type: String, default: "" }, // Novo campo para o histórico
    queixaPrincipal: { type: String, default: "" }, // Novo campo para o histórico
    assinaturaProfissional: { type: String, required: true },
    assinaturaPaciente: { type: String, required: false }, // Assinatura do Paciente
    tipoFicha: { type: String, required: true },

    // ✅ CORREÇÃO: Adiciona a referência à clínica
    clinica: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinica',
      required: true,
      index: true // Otimiza consultas por clínica
    },
  },
  { timestamps: true }
);

const Prontuario = mongoose.model("Prontuario", prontuarioSchema);

export default Prontuario;
