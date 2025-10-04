import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nome: { type: String, required: true },
  cpf: { type: String, unique: true },
  tel: { type: String },
  email: { type: String },
  funcao: { type: String }, // Usado para Especialidade (ex: Ortodontia)
  cro: { type: String, unique: true, sparse: true }, 
  perfil: {
    type: String, 
    enum: ["patrao", "funcionario"],
    default: "funcionario"
  },
  
  // Campo que define o tipo/função do funcionário (usado para filtro)
  profissional: { 
    type: String, 
    enum: ["Dr(a)", "Atendente", "Dona", "Outro"],
    default: "Atendente" 
  },
  foto: { type: String },

  // 💡 NOVO: Campo para associar o usuário a uma clínica
  clinica: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinica',
    required: false // Pode ser false para permitir usuários sem clínica (como o patrão)
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);