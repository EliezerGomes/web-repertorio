import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { MdMoreVert, MdEdit, MdDelete, MdAdd } from "react-icons/md";
import { toast } from "react-toastify";
import "./index.css";
import { IoIosClose } from "react-icons/io";
import { LuArrowUp, LuArrowDown, LuTrash2, LuCheck } from "react-icons/lu";
import { PiMicrophoneFill, PiMagicWandFill } from "react-icons/pi";
import {
  generateWeeklySchedule,
  type GenerateScheduleResult,
} from "../../services/scheduleGenerator";

interface WorshipType {
  id?: string;
  day: string;
  description: string;
  enable: boolean;
  hour: string;
  Icon: string;
  singers: string[];
}

const allMembers = [
  { id: "KE81ihXDYPCwOZMDaC2y", name: "Ingrid" },
  { id: "Vxb4PlodkFcG3OkCXMZX", name: "Camila" },
  { id: "WBJ7JU8oIhbYOKrwVzL9", name: "Erick" },
  { id: "ubMq7aEEqoXbsMTzTwEw", name: "Nadila" },
  { id: "wvccqsbxHRTN2SkIGCLG", name: "Adriane" },
];

export default function Settings() {
  const [worships, setWorships] = useState<WorshipType[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Estados para os Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedWorship, setSelectedWorship] = useState<WorshipType | null>(
    null,
  );

  const [isSingersModalOpen, setIsSingersModalOpen] = useState(false);
  const [newSingerId, setNewSingerId] = useState("");
  const [isAddingSinger, setIsAddingSinger] = useState(false);
  const [tempSingerId, setTempSingerId] = useState("");

  // Geração automática da escala semanal
  const [isConfirmGenerateOpen, setIsConfirmGenerateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] =
    useState<GenerateScheduleResult | null>(null);

  // Estado do formulário
  const [formData, setFormData] = useState<WorshipType>({
    day: "",
    description: "",
    enable: true,
    hour: "",
    Icon: "PiMoonFill",
    singers: [],
  });

  const fetchWorships = async () => {
    const querySnapshot = await getDocs(collection(db, "worship"));
    const data = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as WorshipType,
    );
    setWorships(data);
  };

//   const fetchMembers = async () => {
//     const querySnapshot = await getDocs(collection(db, "members")); // ajuste para o nome da sua coleção de pessoas
//     const data = querySnapshot.docs.map((doc) => ({
//       id: doc.id,
//       name: doc.data().name,
//     }));
//     setAllMembers(data);
//   };

  useEffect(() => {
    fetchWorships();
    // fetchMembers();
  }, []);

  // Abrir modal para Adicionar ou Editar
  const openEditModal = (worship?: WorshipType) => {
    if (worship) {
      setSelectedWorship(worship);
      setFormData(worship);
    } else {
      setSelectedWorship(null);
      setFormData({
        day: "",
        description: "",
        enable: true,
        hour: "",
        Icon: "PiMoonFill",
        singers: [],
      });
    }
    setIsModalOpen(true);
    setMenuOpenId(null);
  };

  // Salvar ou Atualizar
  const handleSaveWorship = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedWorship?.id) {
        await updateDoc(doc(db, "worship", selectedWorship.id), {
          ...formData,
        });
        toast.success("Culto atualizado!");
      } else {
        await addDoc(collection(db, "worship"), formData);
        toast.success("Novo culto adicionado!");
      }
      setIsModalOpen(false);
      fetchWorships();
    } catch (error) {
      toast.error("Erro ao salvar dados");
    }
  };

  const handleDelete = async () => {
    if (selectedWorship?.id) {
      await deleteDoc(doc(db, "worship", selectedWorship.id));
      toast.success("Culto removido");
      setIsDeleteModalOpen(false);
      fetchWorships();
    }
  };

  const handleToggleEnable = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "worship", id), { enable: !currentStatus });
      setWorships((prev) =>
        prev.map((w) => (w.id === id ? { ...w, enable: !currentStatus } : w)),
      );
    } catch (e) {
      toast.error("Erro ao alternar status");
    }
  };

  // 2. Funções de Manipulação da Escala
  const updateSingersOrder = async (updatedList: string[]) => {
    if (!selectedWorship?.id) return;
    try {
      await updateDoc(doc(db, "worship", selectedWorship.id), {
        singers: updatedList,
      });
      setSelectedWorship({ ...selectedWorship, singers: updatedList });
      fetchWorships();
    } catch (e) {
      toast.error("Erro ao atualizar ordem");
    }
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!selectedWorship) return;
    const newSingers = [...selectedWorship.singers];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSingers.length) return;

    [newSingers[index], newSingers[targetIndex]] = [
      newSingers[targetIndex],
      newSingers[index],
    ];
    updateSingersOrder(newSingers);
  };

  const handleAddSinger = async () => {
    if (!selectedWorship || !newSingerId) return;
    const updatedList = [...selectedWorship.singers, newSingerId];
    await updateSingersOrder(updatedList);
    setNewSingerId("");
    toast.success("Cantor adicionado!");
  };

  const handleRemoveSinger = async (idToRemove: string) => {
    if (!selectedWorship) return;
    const updatedList = selectedWorship.singers.filter(
      (id) => id !== idToRemove,
    );
    await updateSingersOrder(updatedList);
    toast.info("Cantor removido");
  };

  const handleConfirmAdd = async () => {
    if (!selectedWorship || !tempSingerId) return;

    const updatedSingers = [...selectedWorship.singers, tempSingerId];

    try {
      await updateDoc(doc(db, "worship", selectedWorship.id!), {
        singers: updatedSingers,
      });

      // Atualiza o local e fecha a linha de edição
      setSelectedWorship({ ...selectedWorship, singers: updatedSingers });
      setIsAddingSinger(false);
      setTempSingerId("");
      fetchWorships(); // Recarrega a listagem principal
      toast.success("Cantor escalado!");
    } catch (e) {
      toast.error("Erro ao salvar cantor");
    }
  };

  const handleGenerateSchedule = async () => {
    setIsConfirmGenerateOpen(false);
    setIsGenerating(true);
    try {
      const result = await generateWeeklySchedule();
      setGenerateResult(result);
      await fetchWorships();

      navigator.clipboard.writeText(
        "Paz pessoal, passando pra avisar que a escala da semana já está atualizada no site",
      );
      toast.success("Escala gerada! Mensagem copiada, é só colar no WhatsApp.");
    } catch (error) {
      console.error("Erro ao gerar escala:", error);
      toast.error("Erro ao gerar a escala. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="settings-container">
      <div>
        <header className="settings-header">
          <h2 className="text-headline-small text-primary">Gestão de Cultos</h2>
          <p className="text-body-small text-secondary">
            Controle os dias e horários das celebrações.
          </p>
        </header>

        <div className="worship-list">
          {worships.map((w) => (
            <div key={w.id} className="worship-item-card">
              <div className="worship-info">
                <span className="worship-day-name text-primary">{w.day}</span>
                <span className="worship-desc text-secondary">
                  {w.hour}h - {w.description}
                </span>
              </div>

              <div className="worship-actions">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={w.enable}
                    onChange={() => handleToggleEnable(w.id!, w.enable)}
                  />
                  <span className="slider round"></span>
                </label>

                <div
                  className="music-actions-container"
                  style={{ position: "relative" }}
                >
                  <button
                    className="music-action-button"
                    onClick={() =>
                      setMenuOpenId(menuOpenId === w.id ? null : w.id)
                    }
                  >
                    <MdMoreVert size={24} />
                  </button>
                  {menuOpenId === w.id && (
                    <div className="actions-dropdown">
                      <button onClick={() => openEditModal(w)}>
                        <MdEdit size={18} /> Editar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWorship(w);
                          setIsSingersModalOpen(true);
                          setMenuOpenId(null);
                        }}
                      >
                        <PiMicrophoneFill size={18} /> Cantores
                      </button>
                      <button
                        className="delete-opt"
                        onClick={() => {
                          setSelectedWorship(w);
                          setIsDeleteModalOpen(true);
                          setMenuOpenId(null);
                        }}
                      >
                        <MdDelete size={18} /> Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-add-worship" onClick={() => openEditModal()}>
        <MdAdd size={24} /> ADICIONAR NOVO CULTO
      </button>

      <button
        className="btn-generate-schedule"
        onClick={() => setIsConfirmGenerateOpen(true)}
        disabled={isGenerating}
      >
        <PiMagicWandFill size={22} />
        {isGenerating ? "Gerando..." : "Gerar Escala da Próxima Semana"}
      </button>

      {/* --- MODAL DE EDIÇÃO/CRIAÇÃO --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2 className="text-headline-small">
                {selectedWorship ? "Editar Culto" : "Novo Culto"}
              </h2>
              <button
                className="close-button"
                onClick={() => setIsModalOpen(false)}
              >
                <IoIosClose size={24} />
              </button>
            </header>

            <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
              <div className="input-group">
                <label className="text-label-caps">Dia do Culto</label>
                <input
                  type="text"
                  value={formData.day}
                  placeholder="Ex: Domingo"
                  className="modal-input"
                  onChange={(e) =>
                    setFormData({ ...formData, day: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <label className="text-label-caps">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ex: Culto de Celebração"
                  className="modal-input"
                />
              </div>

              <div className="input-group">
                <label className="text-label-caps">Horário</label>
                <input
                  type="text"
                  value={formData.hour}
                  onChange={(e) =>
                    setFormData({ ...formData, hour: e.target.value })
                  }
                  placeholder="Ex: 19:30"
                  className="modal-input"
                />
              </div>

              <button onClick={handleSaveWorship} className="save-button">
                Salvar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO --- */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="confirm-modal-content">
            <h3>Excluir culto?</h3>
            <p>
              Isso removerá a programação de "{selectedWorship?.day}"
              permanentemente.
            </p>
            <div className="confirm-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Não
              </button>
              <button className="btn-confirm-delete" onClick={handleDelete}>
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isSingersModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content singers-modal">
            <header className="modal-header">
              <h2 className="text-headline-small">
                Escala: {selectedWorship?.day}
              </h2>
              <button
                className="close-button"
                onClick={() => setIsSingersModalOpen(false)}
              >
                <IoIosClose size={32} />
              </button>
            </header>

            <div className="singers-list-container">
              {selectedWorship?.singers.map((singerId, index) => {
                // Busca o nome correto no array allMembers
                const singer = allMembers.find((m) => m.id === singerId);
                return (
                  <div
                    key={`${singerId}-${index}`}
                    className="singer-order-item"
                  >
                    <span className="singer-name text-primary">
                      {singer?.name || "Membro"}
                    </span>
                    <div className="order-actions">
                      <button
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0}
                      >
                        <LuArrowUp />
                      </button>
                      <button
                        onClick={() => handleMove(index, "down")}
                        disabled={index === selectedWorship.singers.length - 1}
                      >
                        <LuArrowDown />
                      </button>
                      <button
                        className="delete-singer"
                        onClick={() => handleRemoveSinger(singerId)}
                      >
                        <LuTrash2 />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* LINHA DE ADIÇÃO (Aparece ao clicar no botão verde lá embaixo) */}
              {isAddingSinger && (
                <div className="singer-order-item adding-row">
                  <select
                    value={tempSingerId}
                    onChange={(e) => setTempSingerId(e.target.value)}
                    className="modal-input select-singer"
                  >
                    <option value="">Selecionar...</option>
                    {allMembers
                      .filter((m) => !selectedWorship?.singers.includes(m.id))
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                  </select>
                  <div className="order-actions">
                    <button
                      className="btn-confirm-check"
                      onClick={handleConfirmAdd}
                      disabled={!tempSingerId}
                    >
                      <LuCheck size={18} />
                    </button>
                    <button
                      className="delete-singer"
                      onClick={() => setIsAddingSinger(false)}
                    >
                      <LuTrash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!isAddingSinger && (
              <button
                className="btn-add-singer-row"
                onClick={() => setIsAddingSinger(true)}
              >
                <MdAdd size={20} /> ADICIONAR CANTOR
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMAÇÃO: GERAR ESCALA --- */}
      {isConfirmGenerateOpen && (
        <div className="modal-overlay">
          <div className="confirm-modal-content">
            <h3>Gerar escala da próxima semana?</h3>
            <p>
              Isso vai apagar os louvores já cadastrados nos cultos da
              próxima semana e substituir a escala de cantores com base no
              calendário mensal e no rodízio automático. Ajustes de
              indisponibilidade continuam sendo manuais.
            </p>
            <div className="confirm-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setIsConfirmGenerateOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleGenerateSchedule}
              >
                Sim, gerar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE RESULTADO DA GERAÇÃO --- */}
      {generateResult && (
        <div className="modal-overlay">
          <div className="modal-content singers-modal">
            <header className="modal-header">
              <h2 className="text-headline-small">
                Escala gerada — {generateResult.weekLabel}
              </h2>
              <button
                className="close-button"
                onClick={() => setGenerateResult(null)}
              >
                <IoIosClose size={32} />
              </button>
            </header>

            <div className="singers-list-container">
              {generateResult.assignments.map((a, idx) => (
                <div key={idx} className="singer-order-item">
                  <span className="singer-name text-primary">
                    {a.day} — {a.description}
                  </span>
                  <span className="text-secondary" style={{ fontSize: 13 }}>
                    {a.active
                      ? a.singerNames.length > 0
                        ? a.singerNames.join(", ")
                        : "Ninguém escalado"
                      : "Sem culto nesta semana"}
                  </span>
                </div>
              ))}
            </div>

            {generateResult.warnings.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {generateResult.warnings.map((w, idx) => (
                  <p
                    key={idx}
                    className="text-secondary"
                    style={{ fontSize: 12, color: "#f59e0b" }}
                  >
                    ⚠ {w}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
