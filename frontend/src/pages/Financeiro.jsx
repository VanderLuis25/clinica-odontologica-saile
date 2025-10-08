
import React, { useState, useEffect, useContext, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import { FaSearch, FaEdit, FaTrash, FaFilePdf, FaPlus, FaSave } from "react-icons/fa";
import { MdDeleteForever, MdEdit } from "react-icons/md";
import { SystemDataContext } from "../context/SystemDataContext.jsx";
import AssinaturaDigital from "../components/AssinaturaDigital.jsx";
import logo from "../assets/odontologia-logo.png";
import "./Financeiro.css";
import "../components/modal.css";

const EMPTY_PLANO = [{ data: "", valor: "", observacoes: "", responsavel: "" }];

export default function Financeiro() {
  const {
    financeiro,
    fetchFinanceiro,
    createFinanceiro,
    updateFinanceiro,
    deleteFinanceiro,
    loading,
  } = useContext(SystemDataContext);

  const [searchTerm, setSearchTerm] = useState("");
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "receita",
    data: "",
    statusPagamento: "pendente",
  });

  // State for Consentimento Modal
  const [isConsentimentoModalOpen, setConsentimentoModalOpen] = useState(false);
  const [selectedLancamento, setSelectedLancamento] = useState(null);
  const [assinatura, setAssinatura] = useState(null);
  const [planoPagamento, setPlanoPagamento] = useState(EMPTY_PLANO);
  const [isEditingConsentimento, setIsEditingConsentimento] = useState(false);
  const consentimentoRef = useRef(null);

  useEffect(() => {
    fetchFinanceiro();
  }, [fetchFinanceiro]);

  // --- CRUD Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.descricao || !formData.valor || !formData.data) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    try {
      if (editData) {
        await updateFinanceiro(editData._id, formData);
      } else {
        await createFinanceiro(formData);
      }
      setFormData({ descricao: "", valor: "", tipo: "receita", data: "", statusPagamento: "pendente" });
      setEditData(null);
    } catch (err) {
      console.error("Erro ao salvar registro:", err);
    }
  };

  const handleEdit = (registro) => {
    setEditData(registro);
    setFormData({
      descricao: registro.descricao,
      valor: registro.valor,
      tipo: registro.tipo,
      data: registro.data?.substring(0, 10),
      statusPagamento: registro.statusPagamento ?? "pendente",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    await deleteFinanceiro(id);
  };

  const handleStatusChange = async (id, newStatus) => {
    await updateFinanceiro(id, { statusPagamento: newStatus });
  };

  // --- Consentimento Modal Handlers ---
  const handleOpenConsentimentoModal = (lancamento) => {
    setSelectedLancamento(lancamento);
    setAssinatura(lancamento.assinaturaDigital || null);
    const hasPlano = lancamento.planoPagamento && lancamento.planoPagamento.length > 0;
    setPlanoPagamento(hasPlano ? lancamento.planoPagamento : EMPTY_PLANO);
    setIsEditingConsentimento(!hasPlano); // Enter edit mode if no plan exists
    setConsentimentoModalOpen(true);
  };

  const handleCloseConsentimentoModal = () => {
    setConsentimentoModalOpen(false);
    setSelectedLancamento(null);
    setAssinatura(null);
    setPlanoPagamento(EMPTY_PLANO);
    setIsEditingConsentimento(false);
  };

  const handlePlanoChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPlano = [...planoPagamento];
    updatedPlano[index] = { ...updatedPlano[index], [name]: value };
    setPlanoPagamento(updatedPlano);
  };

  const addPlanoRow = () => {
    setPlanoPagamento([...planoPagamento, { data: "", valor: "", observacoes: "", responsavel: "" }]);
  };

  const removePlanoRow = (index) => {
    const updatedPlano = planoPagamento.filter((_, i) => i !== index);
    setPlanoPagamento(updatedPlano);
  };

  const handleSavePlano = async () => {
    if (!selectedLancamento) return;
    const payload = { 
        planoPagamento: planoPagamento.filter(p => p.data || p.valor || p.observacoes || p.responsavel),
        assinaturaDigital: assinatura,
        dataAssinatura: assinatura ? new Date().toISOString() : null
    };
    await updateFinanceiro(selectedLancamento._id, payload);
    setIsEditingConsentimento(false);
  };

  const handleDeletePlano = async () => {
    if (!selectedLancamento || !window.confirm("Deseja excluir o plano de pagamento e a assinatura deste registro?")) return;
    const payload = { planoPagamento: [], assinaturaDigital: null, dataAssinatura: null };
    await updateFinanceiro(selectedLancamento._id, payload);
    setPlanoPagamento(EMPTY_PLANO);
    setAssinatura(null);
    setIsEditingConsentimento(true);
  };

  // --- PDF Handlers ---
  const handleDownloadConsentimentoPDF = () => {
    const contentToCapture = consentimentoRef.current;
    if (!contentToCapture) return;

    const modalBox = contentToCapture.closest('.modal-box');
    const overlay = contentToCapture.closest('.modal-overlay');

    // Store original styles
    const originalContentStyle = { overflowY: contentToCapture.style.overflowY, height: contentToCapture.style.height };
    const originalModalBoxStyle = { height: modalBox.style.height, maxHeight: modalBox.style.maxHeight };
    const originalOverlayStyle = { alignItems: overlay.style.alignItems };

    // Temporarily modify styles for capture
    overlay.style.alignItems = 'flex-start'; // Align to top to see the full height
    contentToCapture.style.overflowY = 'visible';
    contentToCapture.style.height = 'auto';
    modalBox.style.height = 'auto';
    modalBox.style.maxHeight = 'none';

    // --- Input to Span replacement ---
    const inputs = contentToCapture.querySelectorAll('input');
    const tempSpans = [];
    inputs.forEach(input => {
      const span = document.createElement('span');
      span.className = 'pdf-input-value';
      if (input.type === 'date' && input.value) {
        const [year, month, day] = input.value.split('-');
        span.textContent = `${day}/${month}/${year}`;
      } else {
        span.textContent = input.value;
      }
      input.style.display = 'none';
      input.parentNode.insertBefore(span, input);
      tempSpans.push({ span, input });
    });

    html2canvas(contentToCapture, { 
        scale: 2, 
        useCORS: true,
        logging: false
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasAspectRatio = canvas.width / canvas.height;
        const imgWidthInPdf = pdfWidth - 20;
        const imgHeightInPdf = imgWidthInPdf / canvasAspectRatio;
        let heightLeft = imgHeightInPdf;
        let position = 10;

        pdf.addImage(imgData, 'PNG', 10, position, imgWidthInPdf, imgHeightInPdf);
        heightLeft -= (pdfHeight - 20);

        while (heightLeft > 0) {
            position = -heightLeft + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidthInPdf, imgHeightInPdf);
            heightLeft -= (pdfHeight - 20);
        }

        pdf.save(`consentimento-${selectedLancamento.procedimento?.paciente?.nome || "paciente"}.pdf`);

    }).finally(() => {
        // --- Restore all original styles and inputs ---
        overlay.style.alignItems = originalOverlayStyle.alignItems;
        contentToCapture.style.overflowY = originalContentStyle.overflowY;
        contentToCapture.style.height = originalContentStyle.height;
        modalBox.style.height = originalModalBoxStyle.height;
        modalBox.style.maxHeight = originalModalBoxStyle.maxHeight;

        tempSpans.forEach(({ span, input }) => {
            span.remove();
            input.style.display = '';
        });
    });
  };

  const generateMainPDF = (dataToExport) => {
    const doc = new jsPDF();
    doc.text("Relatório Financeiro", 14, 15);
    const tableData = dataToExport.map((item) => [
      item.procedimento?.paciente?.nome || "N/A",
      item.procedimento?.paciente?.cpf || "N/A",
      item.descricao,
      `R$ ${Number(item.valor).toFixed(2)}`,
      item.tipo,
      new Date(item.data).toLocaleDateString("pt-BR"),
      item.statusPagamento,
    ]);
    autoTable(doc, { head: [["Paciente", "CPF", "Descrição", "Valor", "Tipo", "Data", "Status"]], body: tableData, startY: 25 });
    doc.save("relatorio_financeiro.pdf");
  };

  const filteredData = financeiro.filter(
    (item) =>
      (item.descricao?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.procedimento?.paciente?.nome?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.procedimento?.paciente?.cpf?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="financeiro-container">
      <h2>Gestão Financeira</h2>

      <form className="financeiro-form" onSubmit={handleSubmit}>
        <input type="text" name="descricao" placeholder="Descrição" value={formData.descricao} onChange={handleChange} required />
        <input type="number" name="valor" placeholder="Valor" value={formData.valor} onChange={handleChange} required />
        <select name="tipo" value={formData.tipo} onChange={handleChange}>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </select>
        <input type="date" name="data" value={formData.data} onChange={handleChange} required />
        <select name="statusPagamento" value={formData.statusPagamento} onChange={handleChange}>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button type="submit">{editData ? "Atualizar" : "Cadastrar"}</button>
      </form>

      <div className="financeiro-search">
        <FaSearch />
        <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <button onClick={() => generateMainPDF(filteredData)}>Exportar PDF</button>
      </div>

      {loading.financeiro ? <p>Carregando...</p> : (
        <table className="financeiro-table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>CPF</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Data</th>
              <th>Status</th>
              <th>Clínica</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((registro) => (
              <tr key={registro._id}>
                <td>{registro.nomePaciente || registro.procedimento?.paciente?.nome || "N/A"}</td>
                <td>{registro.cpfPaciente || registro.procedimento?.paciente?.cpf || "N/A"}</td>
                <td>{registro.descricao}</td>
                <td>R$ {Number(registro.valor).toFixed(2)}</td>
                <td>{registro.tipo}</td>
                <td>{new Date(registro.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                <td>
                  <select value={registro.statusPagamento || 'pendente'} onChange={(e) => handleStatusChange(registro._id, e.target.value)}>
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
                <td>{registro.clinica?.nome || "N/A"}</td>
                <td className="acoes-buttons">
                  <button onClick={() => handleEdit(registro)}><FaEdit /></button>
                  <button onClick={() => handleDelete(registro._id)}><FaTrash /></button>
                  {registro.procedimento?.paciente && (
                    <button onClick={() => handleOpenConsentimentoModal(registro)}><FaFilePdf /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isConsentimentoModalOpen && selectedLancamento && (
        <div className="modal-overlay">
          <div className="modal-box consentimento-modal">
            <div ref={consentimentoRef} className="consentimento-content">
              <img src={logo} alt="Logo" className="consentimento-logo" />
              <h3>PLANO DE TRATAMENTO – CONSENTIMENTO ESCLARECIDO</h3>
              <p><strong>PACIENTE:</strong> {selectedLancamento.procedimento?.paciente?.nome}</p>
              <p><strong>PLANO DE PAGAMENTO CONFORME – VALOR TOTAL:</strong> R$ {Number(selectedLancamento.valor).toFixed(2)}</p>
              
              <table className="consentimento-table editable">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Observações</th>
                    <th>Responsável</th>
                    {isEditingConsentimento && <th>Ação</th>}
                  </tr>
                </thead>
                <tbody>
                  {planoPagamento.map((row, index) => (
                    <tr key={index}>
                      <td><input type="date" name="data" value={row.data} onChange={(e) => handlePlanoChange(index, e)} disabled={!isEditingConsentimento} /></td>
                      <td><input type="number" name="valor" value={row.valor} onChange={(e) => handlePlanoChange(index, e)} disabled={!isEditingConsentimento} /></td>
                      <td><input type="text" name="observacoes" value={row.observacoes} onChange={(e) => handlePlanoChange(index, e)} disabled={!isEditingConsentimento} /></td>
                      <td><input type="text" name="responsavel" value={row.responsavel} onChange={(e) => handlePlanoChange(index, e)} disabled={!isEditingConsentimento} /></td>
                      {isEditingConsentimento && (
                        <td>
                          <button className="remove-row-btn" onClick={() => removePlanoRow(index)}><MdDeleteForever /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {isEditingConsentimento && (
                <button className="add-row-btn" onClick={addPlanoRow}><FaPlus /> Adicionar Linha</button>
              )}

              <p className="consentimento-declaracao">Declaro, que após ter sido devidamente esclarecido sobre os propósitos, riscos, 
custos e alternativas de tratamento, conforme acima apresentados, aceito e autorizo a execução do tratamento, 
comprometendo-me a cumprir as orientações do profissional assistente e arcar com os custos estipulados no orçamento. </p>
              <AssinaturaDigital onSignatureChange={setAssinatura} signatureData={assinatura} disabled={!isEditingConsentimento} />
              <footer className="consentimento-footer">
                <p>Rua Jose Neves, 625, Vila São Paulo, São Paulo-SP, CEP: 04650-141</p>
                <p>Fone/Cel: 5686-1504 - 97774-1144</p>
              </footer>
            </div>
            <div className="consentimento-actions">
                {isEditingConsentimento ? (
                    <button onClick={handleSavePlano} className="btn-primary"><FaSave /> Salvar</button>
                ) : (
                    <button onClick={() => setIsEditingConsentimento(true)}><MdEdit /> Editar</button>
                )}
                <button onClick={handleDeletePlano} className="btn-danger"><MdDeleteForever /> Excluir</button>
                <button onClick={handleDownloadConsentimentoPDF}><FaFilePdf /> Baixar PDF</button>
                <button onClick={handleCloseConsentimentoModal}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
