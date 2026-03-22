import React, { useState } from "react";
import "./index.css";
import { MdDelete, MdEdit, MdMoreVert } from "react-icons/md";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";

// 1. Tipagem das Props para uma música
interface MusicProps {
  title: string;
  artist: string;
  id: string;
  onEdit: () => void;
  id_singer: string; // Adicionado
  singersList: { id: string; name: string }[];
  getRepertories: () => void;
}

const SetlistMusicCard: React.FC<MusicProps> = ({
  title,
  artist,
  id,
  onEdit,
  id_singer,
  singersList,
  getRepertories,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
const singerName = singersList.find(s => s.id === id_singer)?.name || "Cantor";
  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "repertoire", id));
      getRepertories();
      setShowConfirm(false);
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  return (
    <div className="music-card">
      <div className="music-cover-container">
        <div className="music-cover-placeholder">
          {title.substring(0, 1).toUpperCase()}
        </div>
      </div>

      <div className="music-info">
        <h4 className="music-title text-headline-tiny">{title}</h4>
        <div className="music-meta">
          <span className="music-artist text-body-small">{artist}</span>
          <span className="dot">•</span>
          <span className="music-key text-label-small">{singerName}</span>
        </div>
      </div>

      <div className="music-actions-container" style={{ position: "relative" }}>
        <button
          className="music-action-button"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MdMoreVert size={24} />
        </button>

        {menuOpen && (
          <div className="actions-dropdown">
            <button
              onClick={() => {
                onEdit();
                setMenuOpen(false);
              }}
            >
              <MdEdit size={18} /> Editar
            </button>
            <button
              className="delete-opt"
              onClick={() => {
                setShowConfirm(true);
                setMenuOpen(false);
              }}
            >
              <MdDelete size={18} /> Remover
            </button>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO CUSTOMIZADO */}
        {showConfirm && (
          <div className="modal-overlay">
            <div className="confirm-modal-content">
              <h3 className="text-headline-small">Deseja excluir a música?</h3>
              <p className="text-body-medium">
                "{title}" será removida permanentemente do setlist.
              </p>

              <div className="confirm-modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowConfirm(false)}
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
      </div>
    </div>
  );
};

export default SetlistMusicCard;
