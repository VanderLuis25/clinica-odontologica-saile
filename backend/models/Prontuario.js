import mongoose from "mongoose";

const prontuarioSchema = new mongoose.Schema(
  {
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Paciente', required: true },
    nome: { type: String, required: true },
    cpf: { type: String, required: true },
    data: { type: String, required: true },
    observacoes: { type: String, default: "" },
    anamnese: { type: String, default: "" },
    historicoMedico: { type: String, default: "" },
    historicoFamiliar: { type: String, default: "" },
    evolucao: { type: String, default: "" },
    medicamento: { type: String, default: "" },
    dosagem: { type: String, default: "" },
    areaAplicacao: { type: String, default: "" },
    dose: { type: String, default: "" },
    assinaturaProfissional: { type: String, required: true },
    assinaturaPaciente: { type: String, required: false }, // Assinatura do Paciente
    tipoFicha: { type: String, required: true },
  },
  { timestamps: true }
);

const Prontuario = mongoose.model("Prontuario", prontuarioSchema);

export default Prontuario;
