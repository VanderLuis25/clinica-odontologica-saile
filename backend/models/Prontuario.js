import mongoose from "mongoose";

const anamneseSchema = new mongoose.Schema({
  dataInicioTratamento: { type: Date },
  // Doenças
  diabetes: { type: String, enum: ['sim', 'nao', ''] },
  diabetesDieta: { type: String, enum: ['sim', 'nao', ''] },
  hipertensao: { type: String, enum: ['sim', 'nao', ''] },
  hipertensaoDieta: { type: String, enum: ['sim', 'nao', ''] },
  problemasCardiacos: { type: String, enum: ['sim', 'nao', ''] },
  problemasCardiacosQuais: { type: String, default: '' },
  avc: { type: String, enum: ['sim', 'nao', ''] },
  doencaTireoide: { type: String, enum: ['sim', 'nao', ''] },
  tipoTireoide: { type: String, enum: ['hipotireoidismo', 'hipertireoidismo', ''] },
  asma: { type: String, enum: ['sim', 'nao', ''] },
  ulceraGastrica: { type: String, enum: ['sim', 'nao', ''] },
  anemia: { type: String, enum: ['sim', 'nao', ''] },
  anemiaQual: { type: String, default: '' },
  hemofilia: { type: String, enum: ['sim', 'nao', ''] },
  hemorragia: { type: String, enum: ['sim', 'nao', ''] },
  problemaFigado: { type: String, enum: ['sim', 'nao', ''] },
  problemaFigadoQual: { type: String, default: '' },
  problemaRenal: { type: String, enum: ['sim', 'nao', ''] },
  problemaRenalQual: { type: String, default: '' },
  convulsao: { type: String, enum: ['sim', 'nao', ''] },
  convulsaoTratamento: { type: String, enum: ['sim', 'nao', ''] },
  epilepsia: { type: String, enum: ['sim', 'nao', ''] },
  problemaPulmonar: { type: String, enum: ['sim', 'nao', ''] },
  problemaPulmonarQual: { type: String, default: '' },
  hepatite: { type: String, enum: ['sim', 'nao', ''] },
  tuberculose: { type: String, enum: ['sim', 'nao', ''] },
  sifilis: { type: String, enum: ['sim', 'nao', ''] },
  hiv: { type: String, enum: ['sim', 'nao', ''] },
  febreReumatica: { type: String, enum: ['sim', 'nao', ''] },
  outrasInfectocontagiosas: { type: String, enum: ['sim', 'nao', ''] },
  outrasInfectocontagiosasAtiva: { type: String, enum: ['sim', 'nao', ''] },
  outrasInfectocontagiosasQuais: { type: String, default: '' },
  tumorCancer: { type: String, enum: ['sim', 'nao', ''] },
  tumorCancerLocal: { type: String, default: '' },
  fezQuimio: { type: String, enum: ['sim', 'nao', ''] },
  fezQuimioTempo: { type: String, default: '' },
  fazQuimio: { type: String, enum: ['sim', 'nao', ''] },
  fezRadio: { type: String, enum: ['sim', 'nao', ''] },
  fezRadioTempo: { type: String, default: '' },
  fazRadio: { type: String, enum: ['sim', 'nao', ''] },
  acompanhamentoMedico: { type: String, default: '' },
  // Cirurgias
  cirurgia: { type: String, enum: ['sim', 'nao', ''] },
  cirurgiaQual: { type: String, default: '' },
  alteracaoCicatrizacao: { type: String, enum: ['sim', 'nao', ''] },
  alteracaoCicatrizacaoQual: { type: String, default: '' },
  hemorragiaCirurgica: { type: String, enum: ['sim', 'nao', ''] },
  cirurgiaOdontologica: { type: String, enum: ['sim', 'nao', ''] },
  cirurgiaOdontologicaQual: { type: String, default: '' },
  // Hábitos
  tabagista: { type: String, enum: ['sim', 'nao', ''] },
  tabagistaAtivo: { type: String, enum: ['sim', 'nao', ''] },
  tabagistaParouHa: { type: String, default: '' },
  tabagistaFrequencia: { type: String, default: '' },
  tabagistaQuantidade: { type: String, default: '' },
  tabagistaProduto: { type: String, default: '' },
  alcoolista: { type: String, enum: ['sim', 'nao', ''] },
  alcoolistaAtivo: { type: String, enum: ['sim', 'nao', ''] },
  alcoolistaParouHa: { type: String, default: '' },
  alcoolistaFrequencia: { type: String, default: '' },
  alcoolistaQuantidade: { type: String, default: '' },
  atividadeFisica: { type: String, enum: ['sim', 'nao', ''] },
  // Saúde
  pressaoArterial: { type: String, default: '' },
  pressaoArterialObs: { type: String, default: '' },
  pulso: { type: String, default: '' },
  pulsoObs: { type: String, default: '' },
  temperatura: { type: String, default: '' },
  temperaturaObs: { type: String, default: '' },
  indiceGlicemico: { type: String, default: '' },
  indiceGlicemicoObs: { type: String, default: '' },
  peso: { type: String, default: '' },
  pesoObs: { type: String, default: '' },
  altura: { type: String, default: '' },
  gravidez: { type: String, default: '' },
  gravidezObs: { type: String, default: '' },
  emTratamentoMedico: { type: String, enum: ['sim', 'nao', ''] },
  tratamentoMedicoQual: { type: String, default: '' },
  alergia: { type: String, enum: ['sim', 'nao', ''] },
  alergiaQual: { type: String, default: '' },
  medicacaoEmUso: { type: String, enum: ['sim', 'nao', ''] },
  medicacoes: [{ nome: String, dosagem: String }],
  // Responsável
  responsavelNome: { type: String, default: '' },
  responsavelRg: { type: String, default: '' },
}, { _id: false });

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
    medicamento: { type: String, default: "" }, // Mantido para receituário simples
    dosagem: { type: String, default: "" }, // Mantido para receituário simples
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

    // ✅ NOVO: Campo para a anamnese completa
    anamneseCompleta: anamneseSchema,
  },
  { timestamps: true }
);

const Prontuario = mongoose.model("Prontuario", prontuarioSchema);

export default Prontuario;
