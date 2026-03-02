import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { 
  getAllAppointments, 
  deleteAppointment, 
  updateAppointment, 
  createAppointmentAsAdmin, 
  getAvailableSlots, 
  completeAppointment, 
  getReport,
  getServices,
  createService,
  updateService,
  deleteService
} from "../services/api";
import styles from "./AdminPanel.module.css";

export default function AdminPanel() {
  const { token, user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editService, setEditService] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Estados para gerenciar serviços
  const [services, setServices] = useState([]);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceIcon, setNewServiceIcon] = useState("📋");
  const [editingService, setEditingService] = useState(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [editServiceIcon, setEditServiceIcon] = useState("");

  // Estados para criar agendamento como admin
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    service: "",
    date: "",
    time: "",
    userEmail: ""
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Estados para horários disponíveis
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [editAvailableSlots, setEditAvailableSlots] = useState([]);
  const [editLoadingSlots, setEditLoadingSlots] = useState(false);

  // Estados para exportação
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState("all");

  // Função para carregar serviços
  const loadServices = async () => {
    try {
      const data = await getServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      setServices([]);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.role === "admin") {
      loadAppointments();
      loadServices();
    }
  }, [token, user]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAllAppointments(token);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar horários disponíveis para criação
  useEffect(() => {
    if (newAppointment.date) {
      loadAvailableSlots(newAppointment.date);
    } else {
      setAvailableSlots([]);
      setNewAppointment(prev => ({ ...prev, time: "" }));
    }
  }, [newAppointment.date]);

  // Buscar horários disponíveis para edição
  useEffect(() => {
    if (editDate) {
      loadEditAvailableSlots(editDate);
    } else {
      setEditAvailableSlots([]);
      setEditTime("");
    }
  }, [editDate]);

  const loadAvailableSlots = async (selectedDate) => {
    try {
      setLoadingSlots(true);
      const data = await getAvailableSlots(token, selectedDate);
      
      if (data.error) {
        console.error("Erro ao carregar horários:", data.error);
        setAvailableSlots([]);
      } else if (data.availableSlots) {
        setAvailableSlots(data.availableSlots);
        if (newAppointment.time && !data.availableSlots.includes(newAppointment.time)) {
          setNewAppointment(prev => ({ ...prev, time: "" }));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar horários disponíveis:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadEditAvailableSlots = async (selectedDate) => {
    try {
      setEditLoadingSlots(true);
      const data = await getAvailableSlots(token, selectedDate);
      
      if (data.error) {
        console.error("Erro ao carregar horários:", data.error);
        setEditAvailableSlots([]);
      } else if (data.availableSlots) {
        setEditAvailableSlots(data.availableSlots);
        if (editTime && !data.availableSlots.includes(editTime)) {
          setEditTime("");
        }
      }
    } catch (error) {
      console.error("Erro ao carregar horários disponíveis:", error);
      setEditAvailableSlots([]);
    } finally {
      setEditLoadingSlots(false);
    }
  };

  // Funções para gerenciar serviços
  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      alert("Por favor, informe o nome do serviço");
      return;
    }

    try {
      const result = await createService(token, newServiceName.trim(), newServiceIcon);
      if (result.error) throw new Error(result.error);
      
      setNewServiceName("");
      setNewServiceIcon("📋");
      await loadServices(); // ✅ Garante a atualização
      alert("Serviço criado com sucesso!");
    } catch (error) {
      alert(error.message || "Erro ao criar serviço");
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setEditServiceName(service.name);
    setEditServiceIcon(service.icon);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    if (!editServiceName.trim()) {
      alert("Por favor, informe o nome do serviço");
      return;
    }

    try {
      const result = await updateService(token, editingService._id, editServiceName.trim(), editServiceIcon, true);
      if (result.error) throw new Error(result.error);
      
      setEditingService(null);
      setEditServiceName("");
      setEditServiceIcon("📋");
      await loadServices(); // ✅ Garante a atualização
      alert("Serviço atualizado com sucesso!");
    } catch (error) {
      alert(error.message || "Erro ao atualizar serviço");
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?\n\nEsta ação não pode ser desfeita.")) {
      try {
        // ✅ Capture o resultado da API
        const result = await deleteService(token, serviceId);

        // ✅ Verifica se a API retornou um erro específico
        if (result && result.error) {
          // ⚠️ Mostra a mensagem específica da API (ex: agendamentos vinculados)
          alert(`Erro: ${result.error}`);
          return;
        }

        // ✅ Atualiza a lista de serviços imediatamente
        await loadServices();
        
        // ✅ Feedback visual para o usuário
        alert("Serviço excluído com sucesso!");
        
      } catch (error) {
        console.error("Erro ao excluir serviço:", error);
        alert(error.message || "Erro ao excluir serviço");
      }
    }
  };

  // Função para criar agendamento como admin
  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    const { service, date, time, userEmail } = newAppointment;
    
    if (!service || !date || !time || !userEmail) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    try {
      setCreateLoading(true);
      const result = await createAppointmentAsAdmin(token, service, date, time, userEmail);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Limpa o formulário e fecha o modal
      setNewAppointment({
        service: services.length > 0 ? services[0].name : "",
        date: "",
        time: "",
        userEmail: ""
      });
      setShowCreateModal(false);
      setAvailableSlots([]);
      
      // Recarrega a lista
      await loadAppointments();
      alert("Agendamento criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      alert(error.message || "Erro ao criar agendamento. Tente novamente.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setEditService(appointment.service);
    
    const dateTime = new Date(appointment.date);
    setEditDate(dateTime.toISOString().split('T')[0]);
    setEditTime(dateTime.toTimeString().slice(0, 5));
  };

  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    if (!editDate || !editTime) return;

    try {
      setEditLoading(true);
      const result = await updateAppointment(token, editingAppointment._id, editService, editDate, editTime);
      
      if (result.error) {
        throw new Error(result.error);
      }

      await loadAppointments();
      setEditingAppointment(null);
      setEditService("");
      setEditDate("");
      setEditTime("");
      setEditAvailableSlots([]);
      alert("Agendamento atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      alert(error.message || "Erro ao atualizar agendamento. Tente novamente.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (window.confirm("Tem certeza que deseja excluir este agendamento?\n\nO usuário receberá uma notificação por email sobre o cancelamento.")) {
      try {
        await deleteAppointment(token, appointmentId);
        setAppointments(prev => prev.filter(a => a._id !== appointmentId));
        alert("Agendamento excluído com sucesso!\n\nO usuário foi notificado por email.");
      } catch (error) {
        console.error("Erro ao excluir agendamento:", error);
        alert("Erro ao excluir agendamento. Tente novamente.");
      }
    }
  };

  const handleCompleteAppointment = async (appointmentId, userEmail) => {
    if (window.confirm(`Deseja encerrar este agendamento?\n\nO serviço será marcado como concluído e o usuário ${userEmail} receberá uma notificação por email.`)) {
      try {
        const result = await completeAppointment(token, appointmentId);
        
        if (result.error) {
          alert(`Erro ao encerrar agendamento: ${result.error}`);
          return;
        }
        
        await loadAppointments();
        alert("Agendamento encerrado com sucesso!\n\nO usuário foi notificado sobre a conclusão do serviço.");
      } catch (error) {
        console.error("Erro ao encerrar agendamento:", error);
        alert("Erro ao encerrar agendamento. Tente novamente.");
      }
    }
  };

  const handleExport = async (download = false) => {
    if (appointments.length === 0) {
      alert('Não há agendamentos para exportar.');
      return;
    }

    try {
      setExportLoading(true);
      const htmlReport = await getReport(token, exportType, download);
      
      if (htmlReport.error) {
        throw new Error(htmlReport.error);
      }

      if (download) {
        const blob = new Blob([htmlReport], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `relatorio_${exportType}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('📥 Relatório baixado com sucesso!');
        setShowExportModal(false);
      } else {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(htmlReport);
        newWindow.document.close();
        
        setTimeout(() => {
          const shouldPrint = window.confirm(
            '📋 Relatório gerado com sucesso!\n\nDeseja imprimir ou salvar como PDF?\n\n• OK: Abre diálogo de impressão/PDF\n• Cancelar: Mantém relatório na tela'
          );
          
          if (shouldPrint) {
            newWindow.print();
          }
        }, 1000);
      }
        
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('❌ Erro ao gerar relatório: ' + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitial = (nameOrEmail) => {
    if (!nameOrEmail) return "U";
    if (nameOrEmail.includes(' ')) {
      const names = nameOrEmail.split(' ');
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return nameOrEmail.charAt(0).toUpperCase();
  };

  const getServiceOptions = () => {
    return [...new Set(appointments.map(a => a.service))];
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.service?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterService === "all" || appointment.service === filterService;
    return matchesSearch && matchesFilter;
  });

  const getStats = () => {
    const total = appointments.length;
    const today = new Date().toISOString().split('T')[0];
    const todayCount = appointments.filter(a => a.date.split('T')[0] === today).length;
    const uniqueUsers = new Set(appointments.map(a => a.userId?.email)).size;
    
    return { total, todayCount, uniqueUsers };
  };

  const stats = getStats();
  const serviceOptions = getServiceOptions();

  if (user?.role !== "admin") {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <div className={styles.accessDeniedIcon}>🚫</div>
          <h2>Acesso Restrito</h2>
          <p>Somente administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Modal de Gerenciar Serviços */}
      {showServicesModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Gerenciar Serviços</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowServicesModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalContent}>
              {/* Formulário para criar novo serviço */}
              <form className={styles.serviceForm} onSubmit={handleCreateService}>
                <h4>Adicionar Novo Serviço</h4>
                <div className={styles.formRow}>
                  <input
                    type="text"
                    placeholder="Nome do serviço"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className={styles.modalInput}
                    required
                  />
                  <select
                    value={newServiceIcon}
                    onChange={(e) => setNewServiceIcon(e.target.value)}
                    className={styles.iconSelect}
                  >
                    <option value="📋">📋 Padrão</option>
                    <option value="📊">📊 Gráfico</option>
                    <option value="📝">📝 Documento</option>
                    <option value="📈">📈 Gráfico</option>
                    <option value="🔍">🔍 Lupa</option>
                    <option value="💰">💰 Dinheiro</option>
                    <option value="⚖️">⚖️ Balança</option>
                    <option value="📑">📑 Pasta</option>
                  </select>
                  <button type="submit" className={styles.addButton}>
                    ➕ Adicionar
                  </button>
                </div>
              </form>

              {/* Lista de serviços existentes */}
              <div className={styles.servicesList}>
                <h4>Serviços Cadastrados</h4>
                {services.length === 0 ? (
                  <p className={styles.noServices}>Nenhum serviço cadastrado</p>
                ) : (
                  services.map(service => (
                    <div key={service._id} className={styles.serviceItem}>
                      {editingService?._id === service._id ? (
                        <form className={styles.editForm} onSubmit={handleUpdateService}>
                          <input
                            type="text"
                            value={editServiceName}
                            onChange={(e) => setEditServiceName(e.target.value)}
                            className={styles.modalInput}
                            required
                          />
                          <select
                            value={editServiceIcon}
                            onChange={(e) => setEditServiceIcon(e.target.value)}
                            className={styles.iconSelect}
                          >
                            <option value="📋">📋</option>
                            <option value="📊">📊</option>
                            <option value="📝">📝</option>
                            <option value="📈">📈</option>
                            <option value="🔍">🔍</option>
                            <option value="💰">💰</option>
                            <option value="⚖️">⚖️</option>
                            <option value="📑">📑</option>
                          </select>
                          <button type="submit" className={styles.saveButton}>
                            💾
                          </button>
                          <button 
                            type="button" 
                            className={styles.cancelButton}
                            onClick={() => setEditingService(null)}
                          >
                            ❌
                          </button>
                        </form>
                      ) : (
                        <>
                          <span className={styles.serviceInfo}>
                            <span className={styles.serviceIcon}>{service.icon}</span>
                            {service.name}
                          </span>
                          <div className={styles.serviceActions}>
                            <button 
                              className={styles.editButton}
                              onClick={() => handleEditService(service)}
                            >
                              ✏️
                            </button>
                            <button 
                              className={styles.deleteButton}
                              onClick={() => handleDeleteService(service._id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.closeModalButton}
                onClick={() => setShowServicesModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar Agendamento */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Criar Agendamento</h3>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowCreateModal(false);
                  setNewAppointment({
                    service: services.length > 0 ? services[0].name : "",
                    date: "",
                    time: "",
                    userEmail: ""
                  });
                  setAvailableSlots([]);
                }}
              >
                ×
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={handleCreateAppointment}>
              <div className={styles.modalContent}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Email do Usuário</label>
                  <input
                    type="email"
                    className={styles.modalInput}
                    value={newAppointment.userEmail}
                    onChange={e => setNewAppointment(prev => ({
                      ...prev,
                      userEmail: e.target.value
                    }))}
                    placeholder="exemplo@email.com"
                    required
                  />
                </div>
                
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Serviço</label>
                  <select
                    className={styles.modalSelect}
                    value={newAppointment.service}
                    onChange={e => setNewAppointment(prev => ({
                      ...prev,
                      service: e.target.value
                    }))}
                    required
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map(s => (
                      <option key={s._id} value={s.name}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Data</label>
                  <input
                    type="date"
                    className={styles.modalInput}
                    value={newAppointment.date}
                    onChange={e => setNewAppointment(prev => ({
                      ...prev,
                      date: e.target.value,
                      time: ""
                    }))}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>
                    Horário
                    {loadingSlots && <span className={styles.loadingText}> (carregando...)</span>}
                  </label>
                  <select
                    className={styles.modalInput}
                    value={newAppointment.time}
                    onChange={e => setNewAppointment(prev => ({
                      ...prev,
                      time: e.target.value
                    }))}
                    required
                    disabled={!newAppointment.date || loadingSlots}
                  >
                    <option value="">Selecione um horário</option>
                    {availableSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {availableSlots.length === 0 && newAppointment.date && !loadingSlots && (
                    <div className={styles.warningText}>
                      Não há horários disponíveis para esta data
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button 
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAppointment({
                      service: services.length > 0 ? services[0].name : "",
                      date: "",
                      time: "",
                      userEmail: ""
                    });
                    setAvailableSlots([]);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className={styles.saveButton}
                  disabled={createLoading || !newAppointment.date || !newAppointment.time || !newAppointment.userEmail || loadingSlots}
                >
                  {createLoading ? "Criando..." : "Criar Agendamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>📊 Exportar Relatório</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowExportModal(false)}
                disabled={exportLoading}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <p>Selecione o tipo de relatório que deseja exportar:</p>
              
              <div className={styles.exportOptions}>
                <label className={styles.exportOption}>
                  <input
                    type="radio"
                    name="exportType"
                    value="all"
                    checked={exportType === "all"}
                    onChange={(e) => setExportType(e.target.value)}
                  />
                  <div className={styles.optionContent}>
                    <span className={styles.optionIcon}>📋</span>
                    <div>
                      <strong>Relatório Completo</strong>
                      <p>Todos os agendamentos com detalhes</p>
                    </div>
                  </div>
                </label>

                <label className={styles.exportOption}>
                  <input
                    type="radio"
                    name="exportType"
                    value="service"
                    checked={exportType === "service"}
                    onChange={(e) => setExportType(e.target.value)}
                  />
                  <div className={styles.optionContent}>
                    <span className={styles.optionIcon}>📈</span>
                    <div>
                      <strong>Por Serviço</strong>
                      <p>Agrupado por tipo de serviço</p>
                    </div>
                  </div>
                </label>

                <label className={styles.exportOption}>
                  <input
                    type="radio"
                    name="exportType"
                    value="daily"
                    checked={exportType === "daily"}
                    onChange={(e) => setExportType(e.target.value)}
                  />
                  <div className={styles.optionContent}>
                    <span className={styles.optionIcon}>📅</span>
                    <div>
                      <strong>Relatório Diário</strong>
                      <p>Agrupado por data</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className={styles.exportInfo}>
                <p><strong>📝 Informações:</strong></p>
                <ul>
                  <li>Total de agendamentos: {appointments.length}</li>
                  <li>Usuários únicos: {stats.uniqueUsers}</li>
                </ul>
              </div>
            </div>

            <div className={styles.exportActions}>
              <button 
                className={styles.previewButton}
                onClick={() => handleExport(false)}
                disabled={exportLoading}
              >
                👁️ Visualizar Relatório
              </button>
              
              <button 
                className={styles.downloadButton}
                onClick={() => handleExport(true)}
                disabled={exportLoading}
              >
                📥 Baixar HTML
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Agendamento */}
      {showModal && selectedAppointment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Detalhes do Agendamento</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.detailRow}>
                <strong>Nome do Usuário:</strong>
                <span>{selectedAppointment.userId?.name || "Nome não informado"}</span>
              </div>
              
              <div className={styles.detailRow}>
                <strong>Usuário:</strong>
                <span>{selectedAppointment.userId?.email || "N/A"}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Data e Hora:</strong>
                <span>{formatFullDate(selectedAppointment.date)}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Serviço:</strong>
                <span className={styles.serviceBadge}>{selectedAppointment.service}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>ID do Agendamento:</strong>
                <span className={styles.idText}>{selectedAppointment._id}</span>
              </div>
              <div className={styles.detailRow}>
                <strong>Criado em:</strong>
                <span>{selectedAppointment.createdAt ? formatFullDate(selectedAppointment.createdAt) : "N/A"}</span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.editButton}
                onClick={() => {
                  setShowModal(false);
                  handleEditAppointment(selectedAppointment);
                }}
              >
                Editar Agendamento
              </button>
              <button 
                className={styles.deleteButton}
                onClick={() => {
                  handleDeleteAppointment(selectedAppointment._id);
                  setShowModal(false);
                }}
              >
                Excluir Agendamento
              </button>
              <button 
                className={styles.closeModalButton}
                onClick={() => setShowModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Agendamento */}
      {editingAppointment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Editar Agendamento</h3>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setEditingAppointment(null);
                  setEditService("");
                  setEditDate("");
                  setEditTime("");
                  setEditAvailableSlots([]);
                }}
              >
                ×
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={handleUpdateAppointment}>
              <div className={styles.modalContent}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Usuário</label>
                  <input
                    type="text"
                    className={styles.modalInput}
                    value={editingAppointment.userId?.email || "N/A"}
                    disabled
                  />
                </div>
                
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Serviço</label>
                  <select
                    className={styles.modalSelect}
                    value={editService}
                    onChange={e => setEditService(e.target.value)}
                    required
                  >
                    {services.map(s => (
                      <option key={s._id} value={s.name}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Nova Data</label>
                  <input
                    type="date"
                    className={styles.modalInput}
                    value={editDate}
                    onChange={e => {
                      setEditDate(e.target.value);
                      setEditTime("");
                    }}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>
                    Novo Horário
                    {editLoadingSlots && <span className={styles.loadingText}> (carregando...)</span>}
                  </label>
                  <select
                    className={styles.modalInput}
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    required
                    disabled={!editDate || editLoadingSlots}
                  >
                    <option value="">Selecione um horário</option>
                    {editAvailableSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {editAvailableSlots.length === 0 && editDate && !editLoadingSlots && (
                    <div className={styles.warningText}>
                      Não há horários disponíveis para esta data
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button 
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setEditingAppointment(null);
                    setEditService("");
                    setEditDate("");
                    setEditTime("");
                    setEditAvailableSlots([]);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className={styles.saveButton}
                  disabled={editLoading || !editDate || !editTime || editLoadingSlots}
                >
                  {editLoading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1>Painel Administrativo</h1>
            <p className={styles.subtitle}>Gerencie todos os agendamentos do sistema</p>
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {getUserInitial(user?.name || user?.email)}
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>
                {user?.name || 'Usuário'}
              </div>
              <div className={styles.userEmail}>{user?.email}</div>
              <div className={styles.userRole}>{user?.role}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statTitle}>Ações Rápidas</div>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)', color: 'white' }}>
              ⚡
            </div>
          </div>
          
          <button 
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Criar Agendamento
          </button>
          
          <button 
            className={styles.manageServicesButton}
            onClick={() => setShowServicesModal(true)}
          >
            ⚙️ Gerenciar Serviços
          </button>
          
          <button 
            className={styles.exportMainButton}
            onClick={() => setShowExportModal(true)}
            disabled={appointments.length === 0}
          >
            📊 Exportar Relatórios
          </button>
          
          <p className={styles.statDescription}>
            {appointments.length} agendamentos • {stats.uniqueUsers} usuários
          </p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statTitle}>Total de Agendamentos</div>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              📊
            </div>
          </div>
          <h3 className={styles.statValue}>{stats.total}</h3>
          <p className={styles.statDescription}>Agendamentos totais no sistema</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statTitle}>Agendamentos Hoje</div>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white' }}>
              📅
            </div>
          </div>
          <h3 className={styles.statValue}>{stats.todayCount}</h3>
          <p className={styles.statDescription}>Para hoje</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={styles.statTitle}>Usuários Únicos</div>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)', color: 'white' }}>
              👥
            </div>
          </div>
          <h3 className={styles.statValue}>{stats.uniqueUsers}</h3>
          <p className={styles.statDescription}>Usuários com agendamentos</p>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className={styles.appointmentsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Todos os Agendamentos</h2>
          <div className={styles.controls}>
            <input
              type="text"
              placeholder="Buscar por email ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Todos os serviços</option>
              {serviceOptions.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando agendamentos...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <h3>Nenhum agendamento encontrado</h3>
            <p>
              {appointments.length === 0 
                ? "Ainda não há agendamentos no sistema." 
                : "Nenhum agendamento corresponde aos filtros aplicados."}
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.appointmentsTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>Usuário</th>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Serviço</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(appointment => (
                  <tr key={appointment._id} className={styles.tableRow}>
                    <td className={styles.userCell}>
                      <div className={styles.userInitial}>
                        {getUserInitial(appointment.userId?.email)}
                      </div>
                      <div className={styles.userEmail}>
                        {appointment.userId?.email || "Usuário não encontrado"}
                      </div>
                    </td>
                    <td className={styles.dateCell}>
                      {formatDate(appointment.date)}
                    </td>
                    <td className={styles.timeCell}>
                      {formatTime(appointment.date)}
                    </td>
                    <td>
                      <span className={styles.serviceCell}>
                        {appointment.service}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <button 
                        className={`${styles.actionButton} ${styles.viewButton}`}
                        onClick={() => handleViewAppointment(appointment)}
                      >
                        Ver
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.editButton}`}
                        onClick={() => handleEditAppointment(appointment)}
                      >
                        Editar
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.completeButton}`}
                        onClick={() => handleCompleteAppointment(appointment._id, appointment.userId?.email)}
                        title="Marcar serviço como concluído"
                      >
                        ✅ Encerrar
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDeleteAppointment(appointment._id)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}