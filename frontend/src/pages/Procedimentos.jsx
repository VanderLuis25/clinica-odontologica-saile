import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaEdit, FaTrashAlt, FaSearch } from "react-icons/fa";
import { apiService } from "../services/api.js";
import "./Procedimentos.css";

// --- Funções Auxiliares ---
const calculateAge = (birthDateString) => {
    if (!birthDateString) return "";
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age > 0 ? age.toString() : "";
};

const formatCurrency = (value) => {
    if (!value) return "";
    const numberValue = Number(String(value).replace(",", "."));
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numberValue);
};

const INITIAL_FORM_DATA = {
    nome: "Procedimento Padrão",
    pacienteId: "",
    paciente: "",
    valor: "",
    detalhes: "",
    idade: "",
    cpf: "",
    telefone: "",
    dataAplicacaoBotox: "",
    regiaoTratadaBotox: "",
    pontosBotox: "",
    unidadesBotox: "",
    dataAplicacaoAcido: "",
    regiaoTratadaAcido: "",
    produtoAcido: "",
    volumeInjetado: "",
    observacoes: "",
};

export default function Procedimentos() {
    const [procedimentos, setProcedimentos] = useState([]);
    const [selectedTab, setSelectedTab] = useState("Procedimentos Essenciais e de Prevenção");
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("paciente_asc");
    const [searchResults, setSearchResults] = useState([]);
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const categorias = useMemo(() => [
        "Procedimentos Essenciais e de Prevenção",
        "Profilaxias",
        "Tratamentos Restauradores e Endodontia",
        "Periodontia",
        "Ortodontia",
        "Próteses e Implantes",
        "Odontopediatria",
        "Harmonização Facial",
        "Cirurgia Oral",
    ], []);

    const fetchProcedimentos = useCallback(async () => {
        try {
            const { data } = await apiService.getProcedimentos();
            setProcedimentos(data);
        } catch (err) {
            console.error("Erro ao buscar procedimentos:", err);
        }
    }, []);

    useEffect(() => {
        fetchProcedimentos();
    }, [fetchProcedimentos]);

    // Preenche automaticamente o campo "nome" ao mudar de aba
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            nome: selectedTab === "Harmonização Facial"
                ? "Harmonização Facial - Detalhar"
                : selectedTab,
            tipo: selectedTab
        }));
    }, [selectedTab]);

    const handleSearch = useCallback(async (term) => {
        if (!term) {
            setSearchResults([]);
            return;
        }
        const lowerCaseTerm = term.toLowerCase().trim();
        try {
            const { data: results } = await apiService.searchPacientes(term);
            const filteredResults = results.filter(p => {
                const nomeMatch = p.nome.toLowerCase().startsWith(lowerCaseTerm);
                const cpfMatch = p.cpf && p.cpf.startsWith(term.trim());
                return nomeMatch || cpfMatch;
            });
            setSearchResults(filteredResults);
            setActiveSuggestion(0);
        } catch (err) {
            console.error("Erro ao buscar pacientes:", err);
            setSearchResults([]);
        }
    }, []);

    useEffect(() => {
        if (searchTerm.length === 0) {
            setSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 1) handleSearch(searchTerm);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, handleSearch]);

    const selectSuggestion = (p) => {
        const idadeCalculada = calculateAge(p.dataNascimento);
        setFormData(prev => ({
            ...prev,
            pacienteId: p._id,
            paciente: p.nome,
            idade: idadeCalculada,
            cpf: p.cpf || "",
            telefone: p.telefone || "",
        }));
        setSearchTerm(p.nome);
        setSearchResults([]);
    };

    const handleKeyDown = (e) => {
        if (searchResults.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveSuggestion(prev => prev < searchResults.length - 1 ? prev + 1 : prev);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveSuggestion(prev => prev > 0 ? prev - 1 : prev);
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (searchResults[activeSuggestion]) selectSuggestion(searchResults[activeSuggestion]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (selectedTab === "Harmonização Facial") {
                if (["regiaoTratadaBotox", "pontosBotox", "unidadesBotox"].includes(name) && updated.regiaoTratadaBotox)
                    updated.nome = `Botox - ${updated.regiaoTratadaBotox}`;
                else if (["regiaoTratadaAcido", "produtoAcido", "volumeInjetado"].includes(name) && updated.regiaoTratadaAcido)
                    updated.nome = `Ácido Hialurônico - ${updated.regiaoTratadaAcido}`;
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.pacienteId) { alert("Selecione um paciente."); return; }
        if (!formData.nome.trim() || formData.nome.includes("Detalhar")) { alert("Preencha um nome válido para o procedimento."); return; }

        const procedimentoFinal = {
            ...formData,
            tipo: selectedTab,
            paciente: formData.pacienteId,
        };
        delete procedimentoFinal.pacienteId;
        delete procedimentoFinal.idade;
        delete procedimentoFinal.cpf;
        delete procedimentoFinal.telefone;

        try {
            const novoProcedimento = editId
                ? (await apiService.updateProcedimento(editId, procedimentoFinal)).data
                : (await apiService.createProcedimento(procedimentoFinal)).data;

            setProcedimentos(prev => {
                const newProcedimentos = [...prev];
                const index = newProcedimentos.findIndex(p => p._id === novoProcedimento._id);
                if (index > -1) newProcedimentos[index] = novoProcedimento;
                else newProcedimentos.unshift(novoProcedimento);
                return newProcedimentos;
            });

            limparFormulario();
            alert(editId ? "Procedimento atualizado!" : "Procedimento adicionado!");
            setIsFormVisible(false);

        } catch (err) {
            console.error("Erro ao salvar procedimento:", err);
            alert("Erro ao salvar o procedimento. Verifique o console.");
        }
    };

    const handleEdit = (p) => {
        setSelectedTab(p.tipo || selectedTab);
        const pacienteId = p.paciente?._id || (typeof p.paciente === 'string' ? p.paciente : "");
        const pacienteNome = p.paciente?.nome || "";

        setFormData({
            ...INITIAL_FORM_DATA,
            nome: p.nome || selectedTab,
            tipo: p.tipo,
            pacienteId,
            paciente: pacienteNome,
            idade: p.paciente?.dataNascimento ? calculateAge(p.paciente.dataNascimento) : p.idade || "",
            cpf: p.paciente?.cpf || p.cpf || "",
            telefone: p.paciente?.telefone || p.telefone || "",
            valor: p.valor,
            detalhes: p.detalhes || "",
            dataAplicacaoBotox: p.dataAplicacaoBotox || "",
            regiaoTratadaBotox: p.regiaoTratadaBotox || "",
            pontosBotox: p.pontosBotox || "",
            unidadesBotox: p.unidadesBotox || "",
            dataAplicacaoAcido: p.dataAplicacaoAcido || "",
            regiaoTratadaAcido: p.regiaoTratadaAcido || "",
            produtoAcido: p.produtoAcido || "",
            volumeInjetado: p.volumeInjetado || "",
            observacoes: p.observacoes || "",
        });
        setEditId(p._id);
        setSearchTerm(pacienteNome);
        setSearchResults([]);
        setIsFormVisible(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Deseja deletar este procedimento?")) return;
        try {
            await apiService.deleteProcedimento(id);
            setProcedimentos(prev => prev.filter(p => p._id !== id));
        } catch (err) {
            console.error(err);
            alert("Erro ao deletar.");
        }
    };

    const limparFormulario = () => {
        setFormData({
            ...INITIAL_FORM_DATA,
            nome: selectedTab === "Harmonização Facial" ? "Harmonização Facial - Detalhar" : selectedTab,
        });
        setEditId(null);
        setSearchTerm("");
        setSearchResults([]);
    };

    const handleNewProcedimentoClick = () => {
        limparFormulario();
        setIsFormVisible(true);
    };

    const procedimentosFiltrados = useMemo(() => {
        let list = procedimentos.filter(p => {
            const pacienteNome = p.paciente?.nome || (p.paciente && typeof p.paciente === "string" ? p.paciente : "");
            return !searchTerm || pacienteNome.toLowerCase().includes(searchTerm.toLowerCase());
        });
        if (sortOption === "paciente_asc") list.sort((a,b) => (a.paciente?.nome || "").localeCompare(b.paciente?.nome || ""));
        else if (sortOption === "paciente_desc") list.sort((a,b) => (b.paciente?.nome || "").localeCompare(a.paciente?.nome || ""));
        else if (sortOption === "procedimento_asc") list.sort((a,b) => (a.nome || "").localeCompare(b.nome || ""));
        else if (sortOption === "procedimento_desc") list.sort((a,b) => (b.nome || "").localeCompare(a.nome || ""));
        return list;
    }, [procedimentos, searchTerm, sortOption]);

    const HarmonizacaoFields = () => (
        <>
            <div className="proc-harmonizacao-section">
                <h4>Toxina Botulínica (Botox)</h4>
                <input type="date" name="dataAplicacaoBotox" value={formData.dataAplicacaoBotox} onChange={handleInputChange} placeholder="Data Aplicação Botox" />
                <input type="text" name="regiaoTratadaBotox" value={formData.regiaoTratadaBotox} onChange={handleInputChange} placeholder="Região Tratada (Botox)" />
                <input type="number" name="pontosBotox" value={formData.pontosBotox} onChange={handleInputChange} placeholder="Pontos (Botox)" />
                <input type="number" name="unidadesBotox" value={formData.unidadesBotox} onChange={handleInputChange} placeholder="Unidades (Botox)" />

                <h4>Ácido Hialurônico</h4>
                <input type="date" name="dataAplicacaoAcido" value={formData.dataAplicacaoAcido} onChange={handleInputChange} placeholder="Data Aplicação Ácido" />
                <input type="text" name="regiaoTratadaAcido" value={formData.regiaoTratadaAcido} onChange={handleInputChange} placeholder="Região Tratada (Ácido)" />
                <input type="text" name="produtoAcido" value={formData.produtoAcido} onChange={handleInputChange} placeholder="Produto (Marca/Tipo)" />
                <input type="number" name="volumeInjetado" value={formData.volumeInjetado} onChange={handleInputChange} placeholder="Volume Injetado (ml)" step="0.1" />
            </div>
            <textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} placeholder="Observações gerais e histórico..."></textarea>
        </>
    );

    return (
        <div className="procedimentos-container">
            <h2>Procedimentos</h2>

            <div className="proc-tabs">
                {categorias.map(cat => (
                    <button key={cat} className={selectedTab === cat ? "active" : ""} onClick={() => setSelectedTab(cat)}>
                        {cat}
                    </button>
                ))}
            </div>

            <div className="proc-content-layout">
                <div className="proc-form-toggler">
                    <button type="button" className={`proc-btn-new ${isFormVisible ? 'proc-btn-cancel' : ''}`} 
                        onClick={isFormVisible ? () => setIsFormVisible(false) : handleNewProcedimentoClick} 
                        title={isFormVisible ? "Esconder formulário" : "Inicia um novo procedimento, limpando o formulário."}>
                        {isFormVisible ? (editId ? "Cancelar Edição" : "Esconder Formulário") : "+ Novo Procedimento"}
                    </button>
                </div>

                {isFormVisible && (
                    <>
                        <div className="proc-form-header">
                            <h3>{editId ? `Editando: ${formData.paciente}` : `Novo Procedimento - ${selectedTab}`}</h3>
                        </div>

                        <form className="proc-card" onSubmit={handleSubmit}>
                            <div className="proc-search-bar">
                                <FaSearch className="proc-search-icon" />
                                <input type="text" placeholder="Buscar paciente por nome ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleKeyDown} />
                                {searchResults.length > 0 && searchTerm !== formData.paciente && (
                                    <ul className="proc-search-results">
                                        {searchResults.map((p, i) => (
                                            <li key={p._id} className={i === activeSuggestion ? "active" : ""} onClick={() => selectSuggestion(p)}>
                                                {p.nome} - {p.cpf}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="proc-patient-data">
                                <input type="text" name="idade" value={formData.idade ? `${formData.idade} anos` : "Idade"} readOnly />
                                <input type="text" name="cpf" value={formData.cpf || "CPF"} readOnly />
                                <input type="text" name="telefone" value={formData.telefone || "Telefone"} readOnly />
                            </div>

                            <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Nome do Procedimento" required />
                            <input type="text" name="valor" value={formData.valor} onChange={handleInputChange} placeholder="Valor" />
                            {selectedTab !== "Harmonização Facial" ? (
                                <textarea name="detalhes" value={formData.detalhes} onChange={handleInputChange} placeholder="Detalhes"></textarea>
                            ) : (
                                <HarmonizacaoFields />
                            )}

                            <div className="proc-form-buttons">
                                <button type="submit">{editId ? "Atualizar" : "Adicionar"}</button>
                                <button type="button" className="proc-btn-clear" onClick={limparFormulario}>Limpar Campos</button>
                            </div>
                        </form>
                    </>
                )}

                <div className="proc-table-wrapper">
                    <h2>Procedimentos Salvos (TODOS)</h2>
                    <div className="proc-table-header">
                        <input type="text" placeholder="Filtrar por paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                            <option value="paciente_asc">Paciente A-Z</option>
                            <option value="paciente_desc">Paciente Z-A</option>
                            <option value="procedimento_asc">Procedimento A-Z</option>
                            <option value="procedimento_desc">Procedimento Z-A</option>
                        </select>
                    </div>
                    {procedimentosFiltrados.length === 0 ? (
                        <div className="proc-no-data-message">Nenhum procedimento encontrado.</div>
                    ) : (
                        <div className="proc-table-container">
                            <table className="proc-prontuarios-table">
                                <thead>
                                    <tr>
                                        <th>Procedimento</th>
                                        <th>Paciente</th>
                                        <th>Telefone</th>
                                        <th>CPF</th>
                                        <th>Valor</th>
                                        <th>Clínica</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {procedimentosFiltrados.map(p => (
                                        <tr key={p._id}>
                                            <td>{p.nome}</td>
                                            <td>{p.paciente?.nome || (typeof p.paciente === 'string' ? p.paciente : "Não informado")}</td>
                                            <td>{p.paciente?.telefone || "Não informado"}</td>
                                            <td>{p.paciente?.cpf || "Não informado"}</td>
                                            <td>{formatCurrency(p.valor)}</td>
                                            <td>{p.clinica?.nome || "N/A"}</td>
                                            <td className="proc-table-actions">
                                                <button className="proc-btn-edit" onClick={() => handleEdit(p)} title="Editar Procedimento"><FaEdit /></button>
                                                <button className="proc-btn-delete" onClick={() => handleDelete(p._id)} title="Deletar Procedimento"><FaTrashAlt /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
