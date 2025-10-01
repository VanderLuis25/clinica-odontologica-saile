
import mongoose from "mongoose";

const LembreteSchema = new mongoose.Schema({
  paciente: { type: mongoose.Schema.Types.ObjectId, ref: "Paciente" },
  mensagem: String,
  enviadoEm: { type: Date, default: Date.now },
});

export default mongoose.model("Lembrete", LembreteSchema);
