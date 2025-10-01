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
    data: "",
    observacoes: "",
    anamnese: "",
    historicoMedico: "",
    historicoFamiliar: "",
    evolucao: "",
    medicamento: "",
    dosagem: "",
    areaAplicacao: "",
    dose: "",
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

  const handleSelectPaciente = (p) => {
    setSelectedPaciente(p);
    setSearchTerm(p.nome);
    setSearchResults([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
      nome: "", cpf: "", data: "", observacoes: "", anamnese: "", historicoMedico: "",
      historicoFamiliar: "", evolucao: "", medicamento: "", dosagem: "", assinaturaProfissional: null,
      assinaturaPaciente: null, areaAplicacao: "", dose: "",
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

    // Adiciona o ID do paciente e o tipo de ficha
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
      showMessage(`Erro ao salvar: ${errorMessage}`, "error");
      console.error("Erro ao salvar prontuário:", err);
    }
  };

  const handleBaixarPDF = (prontuario) => {
    const doc = new jsPDF();

    const logoImg = new Image();
    logoImg.src = logo;
    doc.addImage(logoImg, "PNG", 10, 10, 50, 20);

    doc.setFontSize(16);
    doc.text(`Prontuário de: ${prontuario.nome}`, 10, 40);
    doc.text(`CPF: ${prontuario.cpf}`, 10, 50);
    doc.text(`Data: ${prontuario.data}`, 10, 60);

    let y = 70;
    for (const key in prontuario) {
      if (!["id", "nome", "cpf", "data", "assinaturaProfissional"].includes(key)) {
        // Tratamento simples para garantir que o texto cabe (apenas para exibição)
        let textContent = `${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: ${prontuario[key]}`;
        const lines = doc.splitTextToSize(textContent, 180); // 180mm de largura
        doc.text(lines, 10, y);
        y += (lines.length * 5) + 5; // Aumenta o y com base no número de linhas
        
        // Adiciona nova página se estiver muito perto do fim
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
      }
    }

    if (prontuario.assinaturaProfissional) {
      // Verifica se precisa de nova página para a assinatura
      if (y > 220) {
          doc.addPage();
          y = 20;
      }
      doc.text("Assinatura do Profissional:", 10, y);
      doc.addImage(prontuario.assinaturaProfissional, "PNG", 10, y + 5, 80, 40);
      y += 50;
    }
    
    if (prontuario.assinaturaPaciente) {
      if (y > 220) {
          doc.addPage();
          y = 20;
      }
      doc.text("Assinatura do Paciente:", 10, y);
      doc.addImage(prontuario.assinaturaPaciente, "PNG", 10, y + 5, 80, 40);
      y += 50;
    }

    doc.save(`Prontuario_${prontuario.nome}.pdf`);
  };

  const handleEditar = (id) => {
    const prontuarioParaEditar = prontuarios.find((p) => p._id === id);
    if (prontuarioParaEditar) {
      setEditId(id);
      setFormData({ ...prontuarioParaEditar });
      setSelectedTab(prontuarioParaEditar.tipoFicha || "fichaAdulto");

      // Limpa o canvas. A assinatura antiga já está no `formData`.
      if (sigPadRef.current) sigPadRef.current.clear();
      if (sigPadPacienteRef.current) sigPadPacienteRef.current.clear();
      
      const pacienteOriginal = pacientes.find(p => p.cpf === prontuarioParaEditar.cpf);
      if(pacienteOriginal) setSelectedPaciente(pacienteOriginal);
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
            : selectedTab === "receituario"
            ? "Receituário"
            : "Procedimentos"}
        </h2>

        <fieldset>
          <legend>Dados do Paciente</legend>
          <div className="form-grid">
            <input type="text" name="nome" placeholder="Nome do Paciente" value={formData.nome} onChange={handleInputChange} readOnly />
            <input type="text" name="cpf" placeholder="CPF do Paciente" value={formData.cpf} onChange={handleInputChange} readOnly />
            <input type="date" name="data" value={formData.data} onChange={handleInputChange} required />
          </div>
        </fieldset>

        <fieldset>
          <legend>Detalhes da Ficha</legend>
          <div className="form-grid">
            {selectedTab === "fichaAdulto" && (
              <>
                <textarea name="observacoes" placeholder="Observações Clínicas" value={formData.observacoes} onChange={handleInputChange} className="full-width"></textarea>
                <input type="text" name="anamnese" placeholder="Anamnese" value={formData.anamnese} onChange={handleInputChange} />
                <input type="text" name="historicoMedico" placeholder="Histórico Médico" value={formData.historicoMedico} onChange={handleInputChange} />
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

            {selectedTab === "procedimentos" && (
              <>
                <input type="text" name="areaAplicacao" placeholder="Área de Aplicação" value={formData.areaAplicacao} onChange={handleInputChange} />
                <input type="text" name="dose" placeholder="Dose Utilizada" value={formData.dose} onChange={handleInputChange} />
                <textarea name="observacoes" placeholder="Observações" value={formData.observacoes} onChange={handleInputChange} className="full-width"></textarea>
              </>
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

        <button type="submit">{editId ? "Atualizar Prontuário" : "Salvar Prontuário"}</button>
        {editId && (
          <button type="button" onClick={limparFormulario} style={{ background: '#6c757d' }}>
            <FaTimes /> Cancelar Edição
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
        {["fichaAdulto", "fichaInfantil", "evolucao", "receituario", "procedimentos"].map((tab) => (
          <button key={tab} className={selectedTab === tab ? "active" : ""} onClick={() => setSelectedTab(tab)}>
            {tab === "fichaAdulto"
              ? "Ficha Adulto"
              : tab === "fichaInfantil"
              ? "Ficha Infantil"
              : tab === "evolucao"
              ? "Evolução"
              : tab === "receituario"
              ? "Receituário"
              : "Procedimentos"}
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
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {prontuarios.map((p) => (
                  <tr key={p._id}>
                    <td>{p.nome}</td>
                    <td>{new Date(p.createdAt).toLocaleDateString("pt-BR")}</td>
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
