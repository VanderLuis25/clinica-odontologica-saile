import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch, FaEdit, FaTrash, FaDownload, FaTimes } from "react-icons/fa";
import { apiService } from "../services/api.js";
import { jsPDF } from "jspdf";
import SignaturePad from "react-signature-canvas";
import "./Prontuarios.css";
import logo from "../assets/odontologia-logo.png"; // Logo da empresa

// Componente simples para a mensagem Toast
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  const baseClasses = "fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white transition-opacity duration-300";
  const typeClasses = type === 'error' ? "bg-red-600" : "bg-green-600";

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      <div className="flex items-center">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

// Componente simples para o Modal de Confirmação
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Confirmação</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn-cancel">
            Cancelar
          </button>
          <button onClick={onConfirm} className="btn-confirm">
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ INÍCIO DA CORREÇÃO: Definição dos componentes e estado inicial que estavam faltando.

const initialAnamneseState = {
  dataInicioTratamento: '',
  diabetes: '', diabetesDieta: '', hipertensao: '', hipertensaoDieta: '',
  problemasCardiacos: '', problemasCardiacosQuais: '', avc: '',
  doencaTireoide: '', tipoTireoide: '', asma: '', ulceraGastrica: '',
  anemia: '', anemiaQual: '', hemofilia: '', hemorragia: '',
  problemaFigado: '', problemaFigadoQual: '', problemaRenal: '', problemaRenalQual: '',
  convulsao: '', convulsaoTratamento: '', epilepsia: '', problemaPulmonar: '', problemaPulmonarQual: '',
  hepatite: '', tuberculose: '', sifilis: '', hiv: '', febreReumatica: '',
  outrasInfectocontagiosas: '', outrasInfectocontagiosasAtiva: '', outrasInfectocontagiosasQuais: '',
  tumorCancer: '', tumorCancerLocal: '',
  fezQuimio: '', fezQuimioTempo: '', fazQuimio: '',
  fezRadio: '', fezRadioTempo: '', fazRadio: '',
  acompanhamentoMedico: '',
  cirurgia: '', cirurgiaQual: '', alteracaoCicatrizacao: '', alteracaoCicatrizacaoQual: '',
  hemorragiaCirurgica: '', cirurgiaOdontologica: '', cirurgiaOdontologicaQual: '',
  tabagista: '', tabagistaAtivo: '', tabagistaParouHa: '', tabagistaFrequencia: '', tabagistaQuantidade: '', tabagistaProduto: '',
  alcoolista: '', alcoolistaAtivo: '', alcoolistaParouHa: '', alcoolistaFrequencia: '', alcoolistaQuantidade: '',
  atividadeFisica: '',
  pressaoArterial: '', pressaoArterialObs: '', pulso: '', pulsoObs: '',
  temperatura: '', temperaturaObs: '', indiceGlicemico: '', indiceGlicemicoObs: '',
  peso: '', pesoObs: '', altura: '', gravidez: '', gravidezObs: '',
  emTratamentoMedico: '', tratamentoMedicoQual: '', alergia: '', alergiaQual: '',
  medicacaoEmUso: '',
  medicacoes: [
    { nome: '', dosagem: '' }, { nome: '', dosagem: '' },
    { nome: '', dosagem: '' }, { nome: '', dosagem: '' }
  ],
  responsavelNome: '', responsavelRg: '',
};

// Componente para grupo de botões de rádio (Sim/Não)
const RadioGroup = ({ name, value, onChange, legend }) => (
  <div className="radio-group">
    <span className="radio-legend">{legend}</span>
    <div className="radio-options">
      <label>
        <input type="radio" name={name} value="sim" checked={value === 'sim'} onChange={onChange} /> Sim
      </label>
      <label>
        <input type="radio" name={name} value="nao" checked={value === 'nao'} onChange={onChange} /> Não
      </label>
    </div>
  </div>
);

const AnamneseForm = ({ data, onAnamneseChange, onMedicacaoChange, paciente }) => {
  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    onAnamneseChange(name, value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onAnamneseChange(name, value);
  };

  const handleMedicacaoChange = (index, field, e) => {
    const { value } = e.target;
    onMedicacaoChange(index, field, value);
  };

  // Helper para inputs condicionais
  const renderConditionalInput = (condition, name, placeholder) => {
    if (condition !== 'sim') return null;
    return (
      <div className="conditional-input">
        <input type="text" name={name} value={data[name] || ''} onChange={handleInputChange} placeholder={placeholder} />
      </div>
    );
  };

  return (
    <div className="anamnese-form-container">
      {/* Doenças Referidas */}
      <fieldset className="anamnese-fieldset">
        <legend>Doenças Referidas</legend>
        <div className="anamnese-questions">
          <div className="question-row"><RadioGroup name="diabetes" value={data.diabetes} onChange={handleRadioChange} legend="Diabetes:" /> {data.diabetes === 'sim' && <RadioGroup name="diabetesDieta" value={data.diabetesDieta} onChange={handleRadioChange} legend="Faz dieta para DM?" />}</div>
          <div className="question-row"><RadioGroup name="hipertensao" value={data.hipertensao} onChange={handleRadioChange} legend="Hipertensão:" /> {data.hipertensao === 'sim' && <RadioGroup name="hipertensaoDieta" value={data.hipertensaoDieta} onChange={handleRadioChange} legend="Faz dieta Hipossódica?" />}</div>
          <div className="question-row"><RadioGroup name="problemasCardiacos" value={data.problemasCardiacos} onChange={handleRadioChange} legend="Problemas Cardíacos:" /> {renderConditionalInput(data.problemasCardiacos, 'problemasCardiacosQuais', 'Quais?')}</div>
          <div className="question-row"><RadioGroup name="avc" value={data.avc} onChange={handleRadioChange} legend="AVC:" /></div>
          <div className="question-row"><RadioGroup name="doencaTireoide" value={data.doencaTireoide} onChange={handleRadioChange} legend="Doença da Tireoide:" /> {data.doencaTireoide === 'sim' && <div className="conditional-input"><label><input type="radio" name="tipoTireoide" value="hipotireoidismo" checked={data.tipoTireoide === 'hipotireoidismo'} onChange={handleRadioChange} /> Hipotireoidismo</label> <label><input type="radio" name="tipoTireoide" value="hipertireoidismo" checked={data.tipoTireoide === 'hipertireoidismo'} onChange={handleRadioChange} /> Hipertireoidismo</label></div>}</div>
          <div className="question-row"><RadioGroup name="asma" value={data.asma} onChange={handleRadioChange} legend="Asma:" /></div>
          <div className="question-row"><RadioGroup name="ulceraGastrica" value={data.ulceraGastrica} onChange={handleRadioChange} legend="Ulcera Gástrica:" /></div>
          <div className="question-row"><RadioGroup name="anemia" value={data.anemia} onChange={handleRadioChange} legend="Anemia:" /> {renderConditionalInput(data.anemia, 'anemiaQual', 'Qual tipo?')}</div>
          <div className="question-row"><RadioGroup name="hemofilia" value={data.hemofilia} onChange={handleRadioChange} legend="Hemofilia:" /></div>
          <div className="question-row"><RadioGroup name="hemorragia" value={data.hemorragia} onChange={handleRadioChange} legend="Hemorragia:" /></div>
          <div className="question-row"><RadioGroup name="problemaFigado" value={data.problemaFigado} onChange={handleRadioChange} legend="Problema no Fígado:" /> {renderConditionalInput(data.problemaFigado, 'problemaFigadoQual', 'Qual?')}</div>
          <div className="question-row"><RadioGroup name="problemaRenal" value={data.problemaRenal} onChange={handleRadioChange} legend="Problema Renal:" /> {renderConditionalInput(data.problemaRenal, 'problemaRenalQual', 'Qual?')}</div>
          <div className="question-row"><RadioGroup name="convulsao" value={data.convulsao} onChange={handleRadioChange} legend="Convulsão:" /> {data.convulsao === 'sim' && <RadioGroup name="convulsaoTratamento" value={data.convulsaoTratamento} onChange={handleRadioChange} legend="Faz tratamento?" />}</div>
          <div className="question-row"><RadioGroup name="epilepsia" value={data.epilepsia} onChange={handleRadioChange} legend="Epilepsia:" /></div>
          <div className="question-row"><RadioGroup name="problemaPulmonar" value={data.problemaPulmonar} onChange={handleRadioChange} legend="Problema Pulmonar:" /> {renderConditionalInput(data.problemaPulmonar, 'problemaPulmonarQual', 'Qual?')}</div>
          <div className="question-row"><RadioGroup name="hepatite" value={data.hepatite} onChange={handleRadioChange} legend="Hepatite:" /></div>
          <div className="question-row"><RadioGroup name="tuberculose" value={data.tuberculose} onChange={handleRadioChange} legend="Tuberculose:" /></div>
          <div className="question-row"><RadioGroup name="sifilis" value={data.sifilis} onChange={handleRadioChange} legend="Sífilis:" /></div>
          <div className="question-row"><RadioGroup name="hiv" value={data.hiv} onChange={handleRadioChange} legend="HIV+:" /></div>
          <div className="question-row"><RadioGroup name="febreReumatica" value={data.febreReumatica} onChange={handleRadioChange} legend="Febre Reumática:" /></div>
          <div className="question-row"><RadioGroup name="outrasInfectocontagiosas" value={data.outrasInfectocontagiosas} onChange={handleRadioChange} legend="Outras Infectocontagiosas:" /> {data.outrasInfectocontagiosas === 'sim' && <RadioGroup name="outrasInfectocontagiosasAtiva" value={data.outrasInfectocontagiosasAtiva} onChange={handleRadioChange} legend="Ativa?" />} {renderConditionalInput(data.outrasInfectocontagiosas, 'outrasInfectocontagiosasQuais', 'Quais?')}</div>
          <div className="question-row"><RadioGroup name="tumorCancer" value={data.tumorCancer} onChange={handleRadioChange} legend="Tumor/Câncer:" /> {renderConditionalInput(data.tumorCancer, 'tumorCancerLocal', 'Qual o local?')}</div>
          <div className="question-row"><RadioGroup name="fezQuimio" value={data.fezQuimio} onChange={handleRadioChange} legend="Fez Quimio?" /> {renderConditionalInput(data.fezQuimio, 'fezQuimioTempo', 'Há quanto tempo (anos)?')} {data.fezQuimio === 'sim' && <RadioGroup name="fazQuimio" value={data.fazQuimio} onChange={handleRadioChange} legend="Faz quimio?" />}</div>
          <div className="question-row"><RadioGroup name="fezRadio" value={data.fezRadio} onChange={handleRadioChange} legend="Fez Radio?" /> {renderConditionalInput(data.fezRadio, 'fezRadioTempo', 'Há quanto tempo (anos)?')} {data.fezRadio === 'sim' && <RadioGroup name="fazRadio" value={data.fazRadio} onChange={handleRadioChange} legend="Faz radio?" />}</div>
          <div className="form-group span-full"><label>Qual seu acompanhamento médico?</label><textarea name="acompanhamentoMedico" value={data.acompanhamentoMedico || ''} onChange={handleInputChange}></textarea></div>
        </div>
      </fieldset>

      <fieldset className="anamnese-fieldset">
        <legend>Antecedentes Cirúrgicos</legend>
        <div className="anamnese-questions">
          <div className="question-row"><RadioGroup name="cirurgia" value={data.cirurgia} onChange={handleRadioChange} legend="Já se submeteu a alguma tratamento cirúrgico?" /> {renderConditionalInput(data.cirurgia, 'cirurgiaQual', 'Qual?')}</div>
          <div className="question-row"><RadioGroup name="alteracaoCicatrizacao" value={data.alteracaoCicatrizacao} onChange={handleRadioChange} legend="Possui alteração de cicatrização?" /> {renderConditionalInput(data.alteracaoCicatrizacao, 'alteracaoCicatrizacaoQual', 'Qual?')}</div>
          <div className="question-row"><RadioGroup name="hemorragiaCirurgica" value={data.hemorragiaCirurgica} onChange={handleRadioChange} legend="Já teve hemorragia cirúrgica?" /></div>
          <div className="question-row"><RadioGroup name="cirurgiaOdontologica" value={data.cirurgiaOdontologica} onChange={handleRadioChange} legend="Já se submeteu a alguma cirurgia Odontológica?" /> {renderConditionalInput(data.cirurgiaOdontologica, 'cirurgiaOdontologicaQual', 'Qual?')}</div>
        </div>
      </fieldset>

      <fieldset className="anamnese-fieldset">
        <legend>Hábitos</legend>
        <div className="anamnese-questions">
          <div className="question-row"><RadioGroup name="tabagista" value={data.tabagista} onChange={handleRadioChange} legend="Tabagista:" /> {data.tabagista === 'sim' && <RadioGroup name="tabagistaAtivo" value={data.tabagistaAtivo} onChange={handleRadioChange} legend="Ativo?" />} {data.tabagistaAtivo === 'nao' && renderConditionalInput(data.tabagista, 'tabagistaParouHa', 'Parou há quanto tempo?')}</div>
          {data.tabagista === 'sim' && <div className="form-group-inline"><input type="text" name="tabagistaFrequencia" value={data.tabagistaFrequencia || ''} onChange={handleInputChange} placeholder="Frequência" /><input type="text" name="tabagistaQuantidade" value={data.tabagistaQuantidade || ''} onChange={handleInputChange} placeholder="Quantidade/Dia" /><input type="text" name="tabagistaProduto" value={data.tabagistaProduto || ''} onChange={handleInputChange} placeholder="Produto" /></div>}
          <div className="question-row"><RadioGroup name="alcoolista" value={data.alcoolista} onChange={handleRadioChange} legend="Alcoolista:" /> {data.alcoolista === 'sim' && <RadioGroup name="alcoolistaAtivo" value={data.alcoolistaAtivo} onChange={handleRadioChange} legend="Ativo?" />} {data.alcoolistaAtivo === 'nao' && renderConditionalInput(data.alcoolista, 'alcoolistaParouHa', 'Parou há quanto tempo?')}</div>
          {data.alcoolista === 'sim' && <div className="form-group-inline"><input type="text" name="alcoolistaFrequencia" value={data.alcoolistaFrequencia || ''} onChange={handleInputChange} placeholder="Frequência" /><input type="text" name="alcoolistaQuantidade" value={data.alcoolistaQuantidade || ''} onChange={handleInputChange} placeholder="Quantidade/Dia" /></div>}
          <div className="question-row"><RadioGroup name="atividadeFisica" value={data.atividadeFisica} onChange={handleRadioChange} legend="Pratica Atividade Física?" /></div>
        </div>
      </fieldset>

      <fieldset className="anamnese-fieldset">
        <legend>Dados de Saúde</legend>
        <div className="dados-saude-grid">
          <label>Pressão Arterial:</label><input type="text" name="pressaoArterial" value={data.pressaoArterial || ''} onChange={handleInputChange} /><label>OBS:</label><input type="text" name="pressaoArterialObs" value={data.pressaoArterialObs || ''} onChange={handleInputChange} />
          <label>Pulso:</label><input type="text" name="pulso" value={data.pulso || ''} onChange={handleInputChange} /><label>OBS:</label><input type="text" name="pulsoObs" value={data.pulsoObs || ''} onChange={handleInputChange} />
          <label>Temperatura:</label><input type="text" name="temperatura" value={data.temperatura || ''} onChange={handleInputChange} /><label>OBS:</label><input type="text" name="temperaturaObs" value={data.temperaturaObs || ''} onChange={handleInputChange} />
          <label>Índice glicêmico:</label><input type="text" name="indiceGlicemico" value={data.indiceGlicemico || ''} onChange={handleInputChange} /><label>OBS:</label><input type="text" name="indiceGlicemicoObs" value={data.indiceGlicemicoObs || ''} onChange={handleInputChange} />
          <label>Peso:</label><input type="text" name="peso" value={data.peso || ''} onChange={handleInputChange} /><label>OBS:</label><input type="text" name="pesoObs" value={data.pesoObs || ''} onChange={handleInputChange} />
          <label>Altura:</label><input type="text" name="altura" value={data.altura || ''} onChange={handleInputChange} /><div></div><div></div>
          <label>Gravidez:</label><input type="text" name="gravidez" value={data.gravidez || ''} onChange={handleInputChange} /><label>OBS:</label><input type="text" name="gravidezObs" value={data.gravidezObs || ''} onChange={handleInputChange} />
        </div>
        <div className="anamnese-questions">
          <div className="question-row"><RadioGroup name="emTratamentoMedico" value={data.emTratamentoMedico} onChange={handleRadioChange} legend="Está em Tratamento médico?" /> {renderConditionalInput(data.emTratamentoMedico, 'tratamentoMedicoQual', 'Qual?')}</div>
          <div className="question-row"><RadioGroup name="alergia" value={data.alergia} onChange={handleRadioChange} legend="Tem alguma alergia?" /> {renderConditionalInput(data.alergia, 'alergiaQual', 'Qual?')}</div>
          <div className="question-row"><RadioGroup name="medicacaoEmUso" value={data.medicacaoEmUso} onChange={handleRadioChange} legend="Está em uso de medicação?" /></div>
        </div>
        {data.medicacaoEmUso === 'sim' && (
          <div className="medicacoes-list">
            {data.medicacoes.map((med, index) => (
              <div key={index} className="medicacao-item">
                <span>{index + 1}-</span>
                <input type="text" placeholder="Nome" value={med.nome} onChange={(e) => handleMedicacaoChange(index, 'nome', e)} />
                <input type="text" placeholder="Dosagem" value={med.dosagem} onChange={(e) => handleMedicacaoChange(index, 'dosagem', e)} />
              </div>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset className="anamnese-fieldset">
        <legend>Responsável Legal</legend>
        <div className="form-group-inline">
          <input type="text" name="responsavelNome" placeholder="Nome do Responsável" value={data.responsavelNome || ''} onChange={handleInputChange} />
          <input type="text" name="responsavelRg" placeholder="RG do Responsável" value={data.responsavelRg || ''} onChange={handleInputChange} />
        </div>
      </fieldset>

      <div className="declaracao-final">
        <h5>O paciente ou seu responsável se compromete a seguir as orientações do Cirurgião-Dentista, comunicando imediatamente qualquer alteração em decorrência do tratamento realizado, compromete-se a veracidade das informações prestada para seu tratamento, comparecer pontualmente as consultas marcadas, justificando as faltas com antecedência mínima de 24 (vinte e quatro) horas. Faltas não justificadas, serão sujeitas a cobrança da consulta.</h5>
      </div>

    </div>
  );
};

// ✅ FIM DA CORREÇÃO

export default function Prontuario() {
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [selectedTab, setSelectedTab] = useState("fichaAdulto");
  const [editId, setEditId] = useState(null);

  // -- ESTADO PARA UI MESSAGES E CONFIRMAÇÃO (Substituindo alert/confirm) --
  const [uiMessage, setUiMessage] = useState(null);
  const [messageType, setMessageType] = useState("success");
  const [isConfirming, setIsConfirming] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    data: new Date().toISOString().split("T")[0], // ✅ CORREÇÃO: Inicializa com a data atual
    observacoes: "",
    historicoFamiliar: "",
    evolucao: "",
    medicamento: "", // Mantido para receituário
    dosagem: "", // Mantido para receituário
    assinaturaProfissional: null,
    assinaturaPaciente: null,
  });

  // -- ESTADO PRINCIPAL: Agora busca os dados da API --
  const [prontuarios, setProntuarios] = useState([]);

  const sigPadRef = useRef();
  const sigPadPacienteRef = useRef();

  // Função para mostrar mensagens de feedback (Toast)
  const showMessage = useCallback((message, type = 'success') => {
    setUiMessage(message);
    setMessageType(type);
    setTimeout(() => setUiMessage(null), 3000); // Esconde após 3 segundos
  }, []);

  const fetchProntuarios = useCallback(async () => {
    try {
      const { data } = await apiService.getProntuarios();
      setProntuarios(data);
    } catch (err) {
      showMessage("Erro ao carregar prontuários do servidor.", "error");
      console.error("Erro ao carregar prontuários:", err);
    }
  }, [showMessage]);

  // Carregar dados iniciais (pacientes e prontuários)
  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const { data } = await apiService.getPacientes();
        setPacientes(data);
      } catch (err) {
        console.error("Erro ao carregar pacientes:", err);
      }
    };
    fetchPacientes();
    fetchProntuarios();
  }, [fetchProntuarios]);

  // Atualiza searchResults
  useEffect(() => {
    if (!searchTerm) return setSearchResults([]);
    const termo = searchTerm.toLowerCase();

    const resultados = pacientes.filter(
      (p) =>
        (p.nome && p.nome.toLowerCase().startsWith(termo)) ||
        (p.cpf && p.cpf.startsWith(termo))
    );
    setSearchResults(resultados);
  }, [searchTerm, pacientes]);

  const handleSelectPaciente = async (paciente) => {
    setSearchTerm(paciente.nome);
    setSearchResults([]);
    try {
      // ✅ CORREÇÃO: Busca os dados completos do paciente pela API
      const { data: fullPatientData } = await apiService.getPacienteById(paciente._id);
      // Atualiza o estado com os dados completos, que preencherão o formulário
      setSelectedPaciente(fullPatientData);
    } catch (error) {
      console.error("Erro ao buscar detalhes do paciente:", error);
      showMessage("Não foi possível carregar os dados completos do paciente.", "error");
      setSelectedPaciente(paciente); // Mantém os dados parciais como fallback
    }
  };  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnamneseChange = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      anamneseCompleta: { ...prev.anamneseCompleta, [fieldName]: value }
    }));
  }, []);

  const handleMedicacaoChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newMedicacoes = [...prev.anamneseCompleta.medicacoes];
      newMedicacoes[index] = { ...newMedicacoes[index], [field]: value };
      return { ...prev, anamneseCompleta: { ...prev.anamneseCompleta, medicacoes: newMedicacoes } };
    });
  }, []);

  useEffect(() => {
    if (selectedPaciente) {
      setFormData((prev) => ({ ...prev, nome: selectedPaciente.nome, cpf: selectedPaciente.cpf }));
    }
  }, [selectedPaciente]);

  const handleLimparAssinatura = () => {
    sigPadRef.current.clear();
  };

  const handleLimparAssinaturaPaciente = () => {
    sigPadPacienteRef.current.clear();
  };

  const limparFormulario = () => {
    setFormData({
      nome: "", cpf: "", data: new Date().toISOString().split("T")[0], observacoes: "", historicoFamiliar: "",
      evolucao: "", medicamento: "", dosagem: "", assinaturaProfissional: null, assinaturaPaciente: null,
      anamneseCompleta: initialAnamneseState, // Limpa a anamnese
    });
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
    if (sigPadPacienteRef.current) {
      sigPadPacienteRef.current.clear();
    }
    setSelectedPaciente(null);
    setSearchTerm("");
    setEditId(null);
  };

  const handleSalvarProntuario = async (e) => {
    e.preventDefault();

    if (!selectedPaciente && !editId) {
      showMessage("Por favor, selecione um paciente antes de salvar.", "error");
      return;
    }

    const prontuarioData = { ...formData };
    const isCanvasEmpty = sigPadRef.current.isEmpty();
    const isCanvasPacienteEmpty = sigPadPacienteRef.current.isEmpty();

    // 1. Validação da Assinatura
    if (editId) {
      // Editando: Se uma nova assinatura foi desenhada, use-a.
      if (!isCanvasEmpty) {
        prontuarioData.assinaturaProfissional = sigPadRef.current.toDataURL("image/png");
      }
      if (!isCanvasPacienteEmpty) {
        prontuarioData.assinaturaPaciente = sigPadPacienteRef.current.toDataURL("image/png");
      }
      // Se não, a assinatura antiga (já em `prontuarioData.assinaturaProfissional`) será mantida.
    } else {
      // Criando: A assinatura é obrigatória.
      if (isCanvasEmpty) {
        showMessage("Assinatura do profissional é obrigatória!", "error");
        return;
      }
      prontuarioData.assinaturaProfissional = sigPadRef.current.toDataURL("image/png");
      if (!isCanvasPacienteEmpty) {
        prontuarioData.assinaturaPaciente = sigPadPacienteRef.current.toDataURL("image/png");
      }
    }

    // ✅ CORREÇÃO: Garante que nome e cpf do paciente selecionado sejam enviados.
    // Isso corrige o erro 400 (Bad Request) por falta de campos obrigatórios.
    if (selectedPaciente) {
      prontuarioData.nome = selectedPaciente.nome;
      prontuarioData.cpf = selectedPaciente.cpf;
    }
    prontuarioData.paciente = selectedPaciente?._id || formData.paciente;
    prontuarioData.tipoFicha = selectedTab;

    try {
      if (editId) {
        // Atualizando na API
        await apiService.updateProntuario(editId, prontuarioData);
        showMessage("Prontuário atualizado com sucesso!");
      } else {
        // Criando novo na API
        await apiService.createProntuario(prontuarioData);
        showMessage("Prontuário salvo com sucesso!");
      }
      limparFormulario();
      fetchProntuarios(); // Recarrega a lista do servidor
    } catch (err) {
      const errorMessage = err.message || "Ocorreu um erro desconhecido.";
      showMessage(`Erro ao salvar prontuário: ${errorMessage}`, "error");
      console.error("Erro ao salvar prontuário:", err);
    }
  };

  const handleBaixarPDF = async (prontuario) => { // ✅ FUNÇÃO AGORA É ASSÍNCRONA
    // Define cores do CSS para uso no jsPDF
    const PRIMARY_COLOR = '#800580';
    const BORDER_COLOR = '#dee2e6';
    const TEXT_COLOR = '#343a40';
    const SECONDARY_TEXT_COLOR = '#6c757d';

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (margin * 2);
    let y = 20; // Posição vertical inicial

    // ✅ NOVO: Busca os dados completos do paciente para o PDF
    let fullPatientData = prontuario.paciente;
    if (prontuario.paciente && !prontuario.paciente.endereco) { // Verifica se o objeto paciente está populado com endereço
      try {
        const { data: fetchedPatient } = await apiService.getPacienteById(prontuario.paciente._id);
        fullPatientData = fetchedPatient;
      } catch (error) {
        console.error("Erro ao buscar detalhes completos do paciente para PDF:", error);
        // Fallback para os dados parciais se a busca falhar
        fullPatientData = prontuario.paciente;
      }
    }

    // Função para adicionar nova página se necessário
    const checkPageBreak = (spaceNeeded = 10) => {
      if (y + spaceNeeded > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // ✅ NOVO: Função para adicionar um título de seção estilizado
    const addSectionTitle = (title) => {
      checkPageBreak(15);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PRIMARY_COLOR);
      doc.text(title, margin, y);
      doc.setDrawColor(BORDER_COLOR);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 10;
      doc.setTextColor(TEXT_COLOR);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    };

    // ✅ NOVO: Função para adicionar um par chave-valor
    const addKeyValuePair = (label, value, xOffset = margin, width = contentWidth / 2) => {
      if (!value) return;
      checkPageBreak(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, xOffset, y);
      doc.setFont('helvetica', 'normal');
      // ✅ CORREÇÃO: Adiciona 2mm de espaço após o rótulo para melhor legibilidade
      const labelWidth = doc.getTextWidth(`${label}: `);
      const textLines = doc.splitTextToSize(String(value), width - labelWidth - 2);
      doc.text(textLines, xOffset + labelWidth + 2, y);
      y += (textLines.length * 4) + 2; // Ajusta a altura da linha
    };

    // 1. Cabeçalho
    const logoImg = new Image();
    logoImg.src = logo;
    doc.addImage(logoImg, "PNG", margin, margin, 40, 15);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PRIMARY_COLOR);
    doc.text('PRONTUÁRIO ODONTOLÓGICO', pageWidth / 2, margin + 10, { align: 'center' }); // Título centralizado
    doc.setLineWidth(0.5);
    doc.setDrawColor(PRIMARY_COLOR); // Linha do cabeçalho com cor primária
    doc.line(margin, margin + 20, pageWidth - margin, margin + 20); // Linha abaixo do título
    y = margin + 30;
    doc.setTextColor(TEXT_COLOR); // Reset text color

    // 2. DADOS DO PACIENTE
    addSectionTitle('DADOS DO PACIENTE');

    // Linha 1: Paciente e Profissional
    doc.text(`Paciente: ${fullPatientData?.nome || prontuario.nome || 'N/A'}`, margin, y);
    doc.text(`Profissional: ${prontuario.profissional?.nome || 'N/A'}`, margin + contentWidth / 2, y);
    y += 6;

    // Linha 2: CPF e Data de Nascimento
    doc.text(`CPF: ${fullPatientData?.cpf || prontuario.cpf || 'N/A'}`, margin, y);
    doc.text(`Data de Nascimento: ${fullPatientData?.dataNascimento ? new Date(fullPatientData.dataNascimento).toLocaleDateString('pt-BR') : 'N/A'}`, margin + contentWidth / 2, y);
    y += 6;

    // Linha 3: RG e Sexo
    doc.text(`RG: ${fullPatientData?.rg || 'N/A'}`, margin, y);
    doc.text(`Sexo: ${fullPatientData?.sexo || 'N/A'}`, margin + contentWidth / 2, y);
    y += 6;

    // Linha 4: Profissão e Tel/Cel
    doc.text(`Profissão: ${fullPatientData?.profissao || 'N/A'}`, margin, y);
    doc.text(`Tel/Cel: ${fullPatientData?.telefone || 'N/A'}`, margin + contentWidth / 2, y);
    y += 6;

    // Linha 5: E-mail
    doc.text(`E-mail: ${fullPatientData?.email || 'N/A'}`, margin, y);
    y += 6;

    // Endereço
    const endereco = fullPatientData?.endereco;
    if (endereco?.rua || endereco?.numero || endereco?.bairro || endereco?.cidade || endereco?.estado || endereco?.cep) {
      doc.text(`Endereço: ${endereco?.rua || ''}, ${endereco?.numero || ''} - ${endereco?.bairro || ''}`, margin, y);
      y += 6;
      doc.text(`Cidade: ${endereco?.cidade || ''} - ${endereco?.estado || ''}, CEP: ${endereco?.cep || ''}`, margin, y);
      y += 6;
    }
    y += 5; // Espaço extra após detalhes do paciente

    // 3. DETALHES DA FICHA (Observações, Histórico, Evolução, Receituário)
    addSectionTitle('DETALHES DA FICHA');
    addKeyValuePair('Observações Clínicas', prontuario.observacoes);
    addKeyValuePair('Histórico Familiar', prontuario.historicoFamiliar);
    addKeyValuePair('Evolução do Tratamento', prontuario.evolucao);
    if (prontuario.medicamento) addKeyValuePair('Receituário', `${prontuario.medicamento} - ${prontuario.dosagem}`);

    // 4. Anamnese (se existir)
    // ✅ CORREÇÃO: Garante que a anamnese seja impressa se houver qualquer dado nela.
    if (prontuario.anamneseCompleta && Object.values(prontuario.anamneseCompleta).some(v => v && v.length > 0)) {
      checkPageBreak(20);
      y += 5;
      doc.setFontSize(12);
      addSectionTitle('ANAMNESE / HISTÓRICO MÉDICO');
      y += 8;
      doc.setFontSize(10);

      const anamnese = prontuario.anamneseCompleta;
      const renderAnamneseItem = (label, value) => {
        if (!value || value === 'nao' || value === '') return; // Ignora 'nao' e campos vazios
        checkPageBreak(6);
        doc.setFont('helvetica', 'normal');
        let text = `${label}: ${value}`;
        // Simplifica a exibição para 'Sim'
        if (value === 'sim') text = `${label}: Sim`;
        doc.text(text, margin, y);
        y += 6;
      };

      // ✅ NOVO: Organização mais detalhada da anamnese
      // Doenças Referidas
      addSectionTitle('DOENÇAS REFERIDAS');
      renderAnamneseItem('Diabetes', anamnese.diabetes);
      if (anamnese.diabetes === 'sim') renderAnamneseItem('Faz dieta para DM', anamnese.diabetesDieta);
      renderAnamneseItem('Hipertensão', anamnese.hipertensao);
      if (anamnese.hipertensao === 'sim') renderAnamneseItem('Faz dieta Hipossódica', anamnese.hipertensaoDieta);
      renderAnamneseItem('Problemas Cardíacos', anamnese.problemasCardiacos);
      if (anamnese.problemasCardiacos === 'sim') addKeyValuePair('Quais problemas cardíacos', anamnese.problemasCardiacosQuais);
      renderAnamneseItem('AVC', anamnese.avc);
      renderAnamneseItem('Doença da Tireoide', anamnese.doencaTireoide);
      if (anamnese.doencaTireoide === 'sim') renderAnamneseItem('Tipo de Tireoide', anamnese.tipoTireoide);
      renderAnamneseItem('Asma', anamnese.asma);
      renderAnamneseItem('Ulcera Gástrica', anamnese.ulceraGastrica);
      renderAnamneseItem('Anemia', anamnese.anemia);
      if (anamnese.anemia === 'sim') addKeyValuePair('Qual tipo de anemia', anamnese.anemiaQual);
      renderAnamneseItem('Hemofilia', anamnese.hemofilia);
      renderAnamneseItem('Hemorragia', anamnese.hemorragia);
      renderAnamneseItem('Problema no Fígado', anamnese.problemaFigado);
      if (anamnese.problemaFigado === 'sim') addKeyValuePair('Qual problema no fígado', anamnese.problemaFigadoQual);
      renderAnamneseItem('Problema Renal', anamnese.problemaRenal);
      if (anamnese.problemaRenal === 'sim') addKeyValuePair('Qual problema renal', anamnese.problemaRenalQual);
      renderAnamneseItem('Convulsão', anamnese.convulsao);
      if (anamnese.convulsao === 'sim') renderAnamneseItem('Faz tratamento para convulsão', anamnese.convulsaoTratamento);
      renderAnamneseItem('Epilepsia', anamnese.epilepsia);
      renderAnamneseItem('Problema Pulmonar', anamnese.problemaPulmonar);
      if (anamnese.problemaPulmonar === 'sim') addKeyValuePair('Qual problema pulmonar', anamnese.problemaPulmonarQual);
      renderAnamneseItem('Hepatite', anamnese.hepatite);
      renderAnamneseItem('Tuberculose', anamnese.tuberculose);
      renderAnamneseItem('Sífilis', anamnese.sifilis);
      renderAnamneseItem('HIV+', anamnese.hiv);
      renderAnamneseItem('Febre Reumática', anamnese.febreReumatica);
      renderAnamneseItem('Outras Infectocontagiosas', anamnese.outrasInfectocontagiosas);
      if (anamnese.outrasInfectocontagiosas === 'sim') {
        renderAnamneseItem('Ativa', anamnese.outrasInfectocontagiosasAtiva);
        addKeyValuePair('Quais outras infectocontagiosas', anamnese.outrasInfectocontagiosasQuais);
      }
      renderAnamneseItem('Tumor/Câncer', anamnese.tumorCancer);
      if (anamnese.tumorCancer === 'sim') addKeyValuePair('Local do tumor/câncer', anamnese.tumorCancerLocal);
      renderAnamneseItem('Fez Quimio', anamnese.fezQuimio);
      if (anamnese.fezQuimio === 'sim') {
        addKeyValuePair('Tempo da Quimio', anamnese.fezQuimioTempo);
        renderAnamneseItem('Faz Quimio atualmente', anamnese.fazQuimio);
      }
      renderAnamneseItem('Fez Radio', anamnese.fezRadio);
      if (anamnese.fezRadio === 'sim') {
        addKeyValuePair('Tempo da Radio', anamnese.fezRadioTempo);
        renderAnamneseItem('Faz Radio atualmente', anamnese.fazRadio);
      }
      if (anamnese.acompanhamentoMedico) addKeyValuePair('Acompanhamento Médico', anamnese.acompanhamentoMedico);

      // Antecedentes Cirúrgicos
      addSectionTitle('ANTECEDENTES CIRÚRGICOS');
      renderAnamneseItem('Já se submeteu a alguma tratamento cirúrgico', anamnese.cirurgia);
      if (anamnese.cirurgia === 'sim') addKeyValuePair('Qual cirurgia', anamnese.cirurgiaQual);
      renderAnamneseItem('Possui alteração de cicatrização', anamnese.alteracaoCicatrizacao);
      if (anamnese.alteracaoCicatrizacao === 'sim') addKeyValuePair('Qual alteração de cicatrização', anamnese.alteracaoCicatrizacaoQual);
      renderAnamneseItem('Já teve hemorragia cirúrgica', anamnese.hemorragiaCirurgica);
      renderAnamneseItem('Já se submeteu a alguma cirurgia Odontológica', anamnese.cirurgiaOdontologica);
      if (anamnese.cirurgiaOdontologica === 'sim') addKeyValuePair('Qual cirurgia Odontológica', anamnese.cirurgiaOdontologicaQual);

      // Hábitos
      addSectionTitle('HÁBITOS');
      renderAnamneseItem('Tabagista', anamnese.tabagista);
      if (anamnese.tabagista === 'sim') {
        renderAnamneseItem('Tabagista Ativo', anamnese.tabagistaAtivo);
        if (anamnese.tabagistaAtivo === 'nao') addKeyValuePair('Parou há quanto tempo', anamnese.tabagistaParouHa);
        addKeyValuePair('Frequência', anamnese.tabagistaFrequencia);
        addKeyValuePair('Quantidade/Dia', anamnese.tabagistaQuantidade);
        addKeyValuePair('Produto', anamnese.tabagistaProduto);
      }
      renderAnamneseItem('Alcoolista', anamnese.alcoolista);
      if (anamnese.alcoolista === 'sim') {
        renderAnamneseItem('Alcoolista Ativo', anamnese.alcoolistaAtivo);
        if (anamnese.alcoolistaAtivo === 'nao') addKeyValuePair('Parou há quanto tempo', anamnese.alcoolistaParouHa);
        addKeyValuePair('Frequência', anamnese.alcoolistaFrequencia);
        addKeyValuePair('Quantidade/Dia', anamnese.alcoolistaQuantidade);
      }
      renderAnamneseItem('Pratica Atividade Física', anamnese.atividadeFisica);

      // Dados de Saúde
      addSectionTitle('DADOS DE SAÚDE');
      addKeyValuePair('Pressão Arterial', anamnese.pressaoArterial);
      if (anamnese.pressaoArterialObs) addKeyValuePair('OBS (Pressão Arterial)', anamnese.pressaoArterialObs);
      addKeyValuePair('Pulso', anamnese.pulso);
      if (anamnese.pulsoObs) addKeyValuePair('OBS (Pulso)', anamnese.pulsoObs);
      addKeyValuePair('Temperatura', anamnese.temperatura);
      if (anamnese.temperaturaObs) addKeyValuePair('OBS (Temperatura)', anamnese.temperaturaObs);
      addKeyValuePair('Índice Glicêmico', anamnese.indiceGlicemico);
      if (anamnese.indiceGlicemicoObs) addKeyValuePair('OBS (Índice Glicêmico)', anamnese.indiceGlicemicoObs);
      addKeyValuePair('Peso', anamnese.peso);
      if (anamnese.pesoObs) addKeyValuePair('OBS (Peso)', anamnese.pesoObs);
      addKeyValuePair('Altura', anamnese.altura);
      renderAnamneseItem('Gravidez', anamnese.gravidez);
      if (anamnese.gravidezObs) addKeyValuePair('OBS (Gravidez)', anamnese.gravidezObs);
      renderAnamneseItem('Está em Tratamento médico', anamnese.emTratamentoMedico);
      if (anamnese.emTratamentoMedico === 'sim') addKeyValuePair('Qual tratamento médico', anamnese.tratamentoMedicoQual);
      renderAnamneseItem('Tem alguma alergia', anamnese.alergia);
      if (anamnese.alergia === 'sim') addKeyValuePair('Qual alergia', anamnese.alergiaQual);
      renderAnamneseItem('Está em uso de medicação', anamnese.medicacaoEmUso);

      if (anamnese.medicacoes && anamnese.medicacoes.some(m => m.nome)) {
        checkPageBreak(15);
        doc.setFont('helvetica', 'bold');
        doc.text('Medicações em uso:', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        anamnese.medicacoes.forEach((med, index) => {
          if (med.nome) {
            checkPageBreak(6);
            doc.text(`${index + 1}- ${med.nome} (${med.dosagem})`, margin + 5, y);
            y += 6;
          }
        });
      }
      y += 5;

      // Responsável Legal
      if (anamnese.responsavelNome || anamnese.responsavelRg) {
        addSectionTitle('RESPONSÁVEL LEGAL');
        addKeyValuePair('Nome do Responsável', anamnese.responsavelNome);
        addKeyValuePair('RG do Responsável', anamnese.responsavelRg);
        y += 5;
      }

      // Declaração Final
      addSectionTitle('DECLARAÇÃO');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const declarationText = "O paciente ou seu responsável se compromete a seguir as orientações do Cirurgião-Dentista, comunicando imediatamente qualquer alteração em decorrência do tratamento realizado, compromete-se a veracidade das informações prestada para seu tratamento, comparecer pontualmente as consultas marcadas, justificando as faltas com antecedência mínima de 24 (vinte e quatro) horas. Faltas não justificadas, serão sujeitas a cobrança da consulta.";
      const declarationLines = doc.splitTextToSize(declarationText, contentWidth);
      doc.text(declarationLines, margin, y);
      y += (declarationLines.length * 4) + 5;
    }

    // 5. Assinaturas
    const addSignature = (label, signatureData) => {
      if (signatureData) {
        checkPageBreak(45);
        y += 10;
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.addImage(signatureData, 'PNG', margin, y + 5, 70, 30);
        y += 40;
      }
    };

    addSectionTitle('ASSINATURAS');
    addSignature('Assinatura do Profissional:', prontuario.assinaturaProfissional);
    addSignature('Assinatura do Paciente/Responsável:', prontuario.assinaturaPaciente);

    // 6. Rodapé (Número da Página)
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(SECONDARY_TEXT_COLOR);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // 7. Salvar o PDF
    const fileName = `Prontuario_${fullPatientData?.nome || prontuario.nome || 'Paciente'}.pdf`;
    doc.save(fileName.replace(/ /g, '_'));
  };

  // ✅ NOVA FUNÇÃO: Gera PDF apenas para a aba selecionada
  const handleBaixarAbaPDF = async () => {
    // ✅ CORREÇÃO: Agora verifica se um paciente está selecionado
    if (!selectedPaciente) {
      showMessage("Selecione um paciente para baixar o PDF da aba.", "error");
      return;
    }

    const prontuario = formData; // Usa os dados do formulário em edição
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;

    // Cores e fontes
    const PRIMARY_COLOR = '#800580';
    const TEXT_COLOR = '#343a40';
    const BORDER_COLOR = '#dee2e6';

    // --- Funções Auxiliares (reutilizadas) ---
    const addSectionTitle = (title) => {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(PRIMARY_COLOR);
      doc.text(title, margin, y);
      doc.setDrawColor(BORDER_COLOR);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 2, pageWidth - margin, y + 2);
      y += 10;
      doc.setTextColor(TEXT_COLOR);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    };

    const addKeyValuePair = (label, value) => {
      if (!value) return;
      y += (y > 30 ? 6 : 0); // Adiciona espaço
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      // ✅ CORREÇÃO: Calcula a posição do valor dinamicamente para evitar sobreposição.
      const labelWidth = doc.getTextWidth(`${label}: `); // Mede a largura do texto do rótulo
      const valueXPosition = margin + labelWidth + 3; // ✅ CORREÇÃO: Aumenta o espaço para 3mm
      const textLines = doc.splitTextToSize(String(value), contentWidth - labelWidth - 2); // Quebra o texto do valor se for muito longo
      doc.text(textLines, valueXPosition, y);
      y += (textLines.length * 5) + 2;
    };

    // --- 1. Cabeçalho e Dados do Paciente (comuns a todos os PDFs) ---
    const logoImg = new Image();
    logoImg.src = logo;
    doc.addImage(logoImg, "PNG", margin, margin, 40, 15);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PRIMARY_COLOR);
    doc.text(`PRONTUÁRIO - ${selectedTab.replace(/([A-Z])/g, ' $1').toUpperCase()}`, pageWidth / 2, margin + 10, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.setDrawColor(PRIMARY_COLOR);
    doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
    y = margin + 30;
    doc.setTextColor(TEXT_COLOR);

    // ✅ CORREÇÃO: Usa o `selectedPaciente` para os dados, garantindo que sempre estejam preenchidos
    addSectionTitle('DADOS DO PACIENTE');
    doc.text(`Paciente: ${selectedPaciente?.nome || 'N/A'}`, margin, y);
    doc.text(`CPF: ${selectedPaciente?.cpf || 'N/A'}`, margin + 100, y);
    y += 6;
    doc.text(`Data da Ficha: ${new Date(prontuario.data).toLocaleDateString('pt-BR')}`, margin, y);
    doc.text(`Profissional: ${prontuario.profissional?.nome || 'N/A'}`, margin + 100, y);
    y += 10;

    // --- 2. Conteúdo Específico da Aba ---
    switch (selectedTab) {
      case 'fichaAdulto':
      case 'fichaInfantil':
        addSectionTitle('FICHA DE AVALIAÇÃO');
        addKeyValuePair('Observações Clínicas', prontuario.observacoes);
        if (selectedTab === 'fichaInfantil') {
          addKeyValuePair('Histórico Familiar', prontuario.historicoFamiliar);
        }
        break;

      case 'evolucao':
        addSectionTitle('EVOLUÇÃO DO TRATAMENTO');
        addKeyValuePair('Descrição', prontuario.evolucao);
        break;

      case 'receituario':
        addSectionTitle('RECEITUÁRIO');
        addKeyValuePair('Medicamento', prontuario.medicamento);
        addKeyValuePair('Dosagem', prontuario.dosagem);
        addKeyValuePair('Observações/Posologia', prontuario.observacoes);
        break;

      case 'historicoMedico':
        // Para o histórico, que é longo, chamamos a função completa
        // mas poderíamos criar uma versão resumida se necessário.
        // Por simplicidade, vamos apenas indicar que é o histórico.
        addSectionTitle('HISTÓRICO MÉDICO');
        doc.text("O PDF completo do Histórico Médico está disponível no download geral do prontuário.", margin, y);
        y += 10;
        doc.text("Para gerar um PDF detalhado da anamnese, use o botão 'Baixar PDF' na tabela de prontuários salvos.", margin, y, { maxWidth: contentWidth });
        break;

      default:
        doc.text('Nenhum conteúdo para esta aba.', margin, y);
    }

    // --- 3. Assinaturas ---
    y += 20;
    addSectionTitle('ASSINATURAS');
    if (prontuario.assinaturaProfissional) doc.addImage(prontuario.assinaturaProfissional, 'PNG', margin, y + 5, 60, 25);
    doc.line(margin, y + 35, margin + 70, y + 35);
    doc.text('Assinatura do Profissional', margin, y + 40);

    // --- 4. Salvar PDF ---
    const fileName = `Prontuario_${prontuario.nome}_${selectedTab}.pdf`;
    doc.save(fileName.replace(/ /g, '_'));
  };

  const handleEditar = (id) => {
    const prontuarioParaEditar = prontuarios.find((p) => p._id === id);
    if (prontuarioParaEditar) {
      setEditId(id);
      // Garante que o estado da anamnese seja preenchido, mesmo que venha vazio do DB
      const anamneseData = {
        ...initialAnamneseState,
        ...prontuarioParaEditar.anamneseCompleta,
        medicacoes: prontuarioParaEditar.anamneseCompleta?.medicacoes?.length ? prontuarioParaEditar.anamneseCompleta.medicacoes : initialAnamneseState.medicacoes
      };
      setFormData({ ...prontuarioParaEditar, anamneseCompleta: anamneseData });
      setSelectedTab(prontuarioParaEditar.tipoFicha || "fichaAdulto");

      // Limpa o canvas. A assinatura antiga já está no `formData`.
      if (sigPadRef.current) sigPadRef.current.clear();
      if (sigPadPacienteRef.current) sigPadPacienteRef.current.clear();

      const pacienteOriginal = pacientes.find(p => p.cpf === prontuarioParaEditar.cpf);
      if (pacienteOriginal) {
        // Busca o paciente completo para preencher o formulário de dados pessoais
        apiService.getPacienteById(pacienteOriginal._id).then(response => setSelectedPaciente(response.data));
      }
      setSearchTerm(prontuarioParaEditar.nome);
    }
  };

  // 3. Funções de Exclusão com Modal de Confirmação
  const handleExcluirProntuario = (id) => {
    // Abre o modal de confirmação, guardando o ID a ser excluído
    setIdToDelete(id);
    setIsConfirming(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await apiService.deleteProntuario(idToDelete);
      showMessage("Prontuário excluído com sucesso!");
      fetchProntuarios(); // Recarrega a lista
    } catch (err) {
      showMessage("Erro ao excluir o prontuário.", "error");
      console.error("Erro ao excluir:", err);
    } finally {
      setIsConfirming(false);
      setIdToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirming(false);
    setIdToDelete(null);
  };


  const renderForm = () => {
    return (
      <form className="prontuario-form card" onSubmit={handleSalvarProntuario}>
        <h2>
          {editId ? "Editando Prontuário" : selectedTab === "fichaAdulto"
            ? "Ficha de Avaliação Odontológica (Adulto)"
            : selectedTab === "fichaInfantil"
              ? "Ficha Infantil"
              : selectedTab === "evolucao"
                ? "Evolução de Tratamento"
                : selectedTab === "receituario" ? "Receituário"
                  : selectedTab === "historicoMedico" ? "Histórico Médico" // Título atualizado
                    : "Ficha"}
        </h2>

        <fieldset>
          <legend>Dados do Paciente</legend>
          {/* ✅ NOVO: Layout detalhado dos dados do paciente */}
          <div className="patient-form-grid">
            {/* Linha 1: Dados Pessoais */}
            <div className="form-group span-6"><label>Paciente:</label><input type="text" value={selectedPaciente?.nome || ''} readOnly /></div>
            <div className="form-group span-3"><label>Data de Nascimento:</label><input type="date" value={selectedPaciente?.dataNascimento ? new Date(selectedPaciente.dataNascimento).toISOString().split('T')[0] : ''} readOnly /></div>
            <div className="form-group span-3"><label>Profissão:</label><input type="text" value={selectedPaciente?.profissao || ''} readOnly /></div>
            {/* Linha 2: Endereço */}
            <div className="form-group span-7"><label>Endereço:</label><input type="text" value={selectedPaciente?.endereco?.rua || ''} readOnly /></div>
            <div className="form-group span-2"><label>Nº:</label><input type="text" value={selectedPaciente?.endereco?.numero || ''} readOnly /></div>
            <div className="form-group span-3"><label>Bairro:</label><input type="text" value={selectedPaciente?.endereco?.bairro || ''} readOnly /></div>
            {/* Linha 3: Endereço (continuação) */}
            <div className="form-group span-5"><label>Cidade:</label><input type="text" value={selectedPaciente?.endereco?.cidade || ''} readOnly /></div>
            <div className="form-group span-2"><label>Estado:</label><input type="text" value={selectedPaciente?.endereco?.estado || ''} readOnly /></div>
            <div className="form-group span-5"><label>CEP:</label><input type="text" value={selectedPaciente?.endereco?.cep || ''} readOnly /></div>
            {/* Linha 4: Contato e Documentos */}
            <div className="form-group span-4"><label>Tel/Cel:</label><input type="tel" value={selectedPaciente?.telefone || ''} readOnly /></div>
            <div className="form-group span-4"><label>CPF:</label><input type="text" value={selectedPaciente?.cpf || ''} readOnly /></div>
            <div className="form-group span-4"><label>RG:</label><input type="text" value={selectedPaciente?.rg || ''} readOnly /></div>
            {/* Linha 5: Email e Sexo */}
            <div className="form-group span-6"><label>E-mail:</label><input type="email" value={selectedPaciente?.email || ''} readOnly /></div>
            <div className="form-group span-6"><label>Sexo:</label><input type="text" value={selectedPaciente?.sexo || ''} readOnly /></div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Detalhes da Ficha</legend>
          <div className="form-grid">
            {selectedTab === "fichaAdulto" && (
              <>
                <textarea name="observacoes" placeholder="Observações Clínicas" value={formData.observacoes} onChange={handleInputChange} className="full-width"></textarea>
              </>
            )}

            {selectedTab === "fichaInfantil" && (
              <>
                <textarea name="observacoes" placeholder="Observações Clínicas" value={formData.observacoes} onChange={handleInputChange} className="full-width"></textarea>
                <input type="text" name="historicoFamiliar" placeholder="Histórico Familiar" value={formData.historicoFamiliar} onChange={handleInputChange} className="full-width" />
              </>
            )}

            {selectedTab === "evolucao" && (
              <textarea name="evolucao" placeholder="Descrição da Evolução" value={formData.evolucao} onChange={handleInputChange} className="full-width"></textarea>
            )}

            {selectedTab === "receituario" && (
              <>
                <input type="text" name="medicamento" placeholder="Nome do Medicamento" value={formData.medicamento} onChange={handleInputChange} />
                <input type="text" name="dosagem" placeholder="Dosagem" value={formData.dosagem} onChange={handleInputChange} />
                <textarea name="observacoes" placeholder="Observações/Posologia" value={formData.observacoes} onChange={handleInputChange} className="full-width"></textarea>
              </>
            )}

            {selectedTab === "historicoMedico" && (
              <AnamneseForm
                data={formData.anamneseCompleta || initialAnamneseState}
                onAnamneseChange={handleAnamneseChange}
                onMedicacaoChange={handleMedicacaoChange}
                paciente={selectedPaciente}
              />
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend>{editId ? "Nova Assinatura Profissional" : "Assinatura do Profissional"}</legend>
          <SignaturePad
            ref={sigPadRef}
            penColor="black"
            canvasProps={{ width: 400, height: 150, className: "signature-canvas" }}
          />
          <div className="signature-buttons">
            <button type="button" onClick={handleLimparAssinatura}>
              Limpar
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Assinatura do Paciente</legend>
          <SignaturePad
            ref={sigPadPacienteRef}
            penColor="black"
            canvasProps={{ width: 400, height: 150, className: "signature-canvas" }}
          />
          <div className="signature-buttons">
            <button type="button" onClick={handleLimparAssinaturaPaciente}>
              Limpar
            </button>
          </div>
        </fieldset>

        <button type="submit" className="btn-salvar-prontuario">
          {editId ? "Atualizar Prontuário" : "Salvar Prontuário"}
        </button>
        {editId && (
          <button type="button" onClick={limparFormulario} className="btn-cancelar-edicao">
            <FaTimes /> Cancelar Edição
          </button>
        )}
        {/* ✅ CORREÇÃO: Botão agora aparece quando um paciente é selecionado */}
        {selectedPaciente && (
          <button type="button" onClick={handleBaixarAbaPDF} className="btn-baixar-aba">
            <FaDownload /> Baixar PDF da Aba
          </button>
        )}
      </form>
    );
  };

  return (
    <div className="prontuarios-container">
      {/* Toast para mensagens de sucesso/erro */}
      <Toast message={uiMessage} type={messageType} onClose={() => setUiMessage(null)} />

      {/* Modal de Confirmação */}
      {isConfirming && (
        <ConfirmationModal
          message="Deseja realmente excluir este prontuário? Esta ação não pode ser desfeita."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      <img src={logo} alt="Logo Odontologia" style={{ width: "150px", marginBottom: "20px" }} />
      <h1>Prontuário Profissional</h1>

      {/* Barra de pesquisa */}
      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Pesquisar paciente pelo nome ou CPF"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchResults.length > 0 && (
        <ul className="search-results card">
          {searchResults.map((p) => (
            <li key={p._id} onClick={() => handleSelectPaciente(p)} className="paciente-card">
              <strong>{p.nome}</strong>
              <span>CPF: {p.cpf}</span>
              {p.idade && <span>Idade: {p.idade}</span>}
            </li>
          ))}
        </ul>
      )}

      {/* Tabs */}
      <div className="tabs">
        {["fichaAdulto", "fichaInfantil", "evolucao", "receituario", "historicoMedico"].map((tab) => (
          <button key={tab} className={selectedTab === tab ? "active" : ""} onClick={() => setSelectedTab(tab)}>
            {tab === "fichaAdulto"
              ? "Ficha Adulto"
              : tab === "fichaInfantil"
                ? "Ficha Infantil"
                : tab === "evolucao"
                  ? "Evolução"
                  : tab === "receituario"
                    ? "Receituário"
                    : "Histórico Médico"}
          </button>
        ))}
      </div>

      <div className="tab-content">{renderForm()}</div>

      {/* Tabela de prontuários salvos */}
      <div className="prontuarios-tabela card">
        <h2>Prontuários Salvos</h2>
        {prontuarios.length > 0 ? (
          <>
            {/* Tabela para Desktop */}
            <table className="prontuarios-table-desktop">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Data de Criação</th>
                  <th>Profissional</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {prontuarios.map((p) => (
                  <tr key={p._id}>
                    <td>{p.paciente?.nome || p.nome || 'N/A'}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td>{p.profissional?.nome || 'N/A'}</td>
                    <td className="acoes">
                      <button onClick={() => handleBaixarPDF(p)} title="Baixar PDF"><FaDownload /></button>
                      <button onClick={() => handleEditar(p._id)} title="Editar Prontuário"><FaEdit /></button>
                      <button onClick={() => handleExcluirProntuario(p._id)} title="Excluir Prontuário"><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Lista de Cards para Mobile */}
            <div className="prontuarios-cards-mobile">
              {prontuarios.map((p) => (
                <div key={p._id} className="prontuario-item-card">
                  <div className="prontuario-item-info">
                    <strong>{p.nome}</strong>
                    <span>Criado em: {new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
                    <small>Por: {p.profissional?.nome || 'N/A'}</small>
                  </div>
                  <div className="acoes">
                    <button onClick={() => handleBaixarPDF(p)} title="Baixar PDF"><FaDownload /></button>
                    <button onClick={() => handleEditar(p._id)} title="Editar Prontuário"><FaEdit /></button>
                    <button onClick={() => handleExcluirProntuario(p._id)} title="Excluir Prontuário"><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--cor-texto-secundario)' }}>Nenhum prontuário salvo.</p>
        )}
      </div>
    </div>
  );
}
