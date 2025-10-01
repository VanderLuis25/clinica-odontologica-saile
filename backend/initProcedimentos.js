import mongoose from "mongoose";
import Procedimento from "./models/Procedimento.js";
import dotenv from "dotenv";

dotenv.config();
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/clinica";

const procedimentosPadrao = [
  { tipo: "Procedimentos Essenciais e de Prevenção", nome: "Exames Periódicos", valor: 100, detalhes: "Exames periódicos para monitoramento da saúde bucal." },
  { tipo: "Profilaxias", nome: "Limpeza Profissional", valor: 120, detalhes: "Remoção de tártaro e placa bacteriana." },
  { tipo: "Tratamentos Restauradores e Endodontia", nome: "Restauração Dentária", valor: 250, detalhes: "Reparo de dentes danificados por cáries ou traumas." },
  { tipo: "Tratamentos Restauradores e Endodontia", nome: "Tratamento de Canal", valor: 400, detalhes: "Tratamento da polpa dentária infectada ou inflamada." },
  { tipo: "Periodontia", nome: "Tratamento Gengival", valor: 200, detalhes: "Tratamento de gengivite e periodontite." },
  { tipo: "Ortodontia", nome: "Aparelho Dentário", valor: 1500, detalhes: "Correção do alinhamento dos dentes e mordida." },
  { tipo: "Próteses e Implantes", nome: "Prótese Dentária", valor: 1200, detalhes: "Confecção de coroas, pontes ou dentaduras." },
  { tipo: "Próteses e Implantes", nome: "Implante Dentário", valor: 2500, detalhes: "Fixação cirúrgica de dente artificial." },
  { tipo: "Odontopediatria", nome: "Consulta Infantil", valor: 100, detalhes: "Atendimento específico para crianças." },
  { tipo: "Odontologia Estética e Harmonização Orofacial", nome: "Clareamento Dental", valor: 500, detalhes: "Clareamento de dentes manchados ou amarelados." },
  { tipo: "Odontologia Estética e Harmonização Orofacial", nome: "Preenchimento Facial", valor: 800, detalhes: "Uso de ácido hialurônico para restaurar volume facial." },
  { tipo: "Odontologia Estética e Harmonização Orofacial", nome: "Bichectomia", valor: 1500, detalhes: "Remoção da gordura das bochechas para afinar o rosto." },
  { tipo: "Odontologia Estética e Harmonização Orofacial", nome: "Toxina Botulínica (Botox)", valor: 600, detalhes: "Relaxamento muscular e suavização de linhas de expressão." },
  { tipo: "Cirurgia Oral", nome: "Extração Dentária", valor: 250, detalhes: "Remoção de dentes, incluindo sisos." },
  { tipo: "Cirurgia Oral", nome: "Cirurgia Periodontal", valor: 400, detalhes: "Procedimentos cirúrgicos para tratamento gengival." },
];

async function initProcedimentos() {
  try {
    await mongoose.connect(mongoURI);
    console.log("Conectado ao MongoDB");

    for (const p of procedimentosPadrao) {
      const existe = await Procedimento.findOne({ tipo: p.tipo, nome: p.nome });
      if (!existe) {
        await Procedimento.create(p);
        console.log(`Procedimento criado: ${p.nome}`);
      }
    }

    console.log("Inicialização concluída!");
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}

initProcedimentos();
