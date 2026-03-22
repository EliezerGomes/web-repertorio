import React, { useState } from "react";
import "./index.css";
import { MdDelete, MdEdit, MdMoreVert } from "react-icons/md";
import type { IconType } from "react-icons"; // Para tipar o ícone
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";

// 1. Tipagem das Props para uma música
interface MusicProps {
  title: string;
  artist: string;
  id: string;
  typeTag: "ABERTURA" | "LOUVOR" | "ADORAÇÃO"; // Tipo da música na tag
  link?: string; // Capa opcional
  onEdit: () => void
  getRepertories: () => void
}

const SetlistMusicCard: React.FC<MusicProps> = ({
  title,
  artist,
  id,
  typeTag,
  link,
  onEdit,
  getRepertories
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getYouTubeThumbnail = (url: string) => {
    if (!url) return null;

    try {
      let videoId: string | null = null;

      if (url.includes("youtu.be/")) {
        // Formato: https://youtu.be/ID_DO_VIDEO
        videoId = url.split("youtu.be/")[1]?.split(/[?#]/)[0];
      } else if (url.includes("youtube.com")) {
        // Formato: https://www.youtube.com/watch?v=ID_DO_VIDEO
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get("v");
      }

      if (videoId && videoId.length === 11) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }

      return null;
    } catch (e) {
      return null;
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "repertoire", id));
      getRepertories();
      setShowConfirm(false);
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const thumbnailUrl = link ? getYouTubeThumbnail(link) : null;

  return (
    <div className="music-card">
      <div className="music-cover-container">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${title} cover`}
            className="music-cover"
            style={{ objectFit: "cover" }} // Garante que a thumb preencha o espaço
          />
        ) : (
          <div className="music-cover-placeholder">
            {title.substring(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="music-info">
        <h4 className="music-title text-headline-tiny">{title}</h4>
        <div className="music-meta">
          <span className="music-artist text-body-small">{artist}</span>
          <span className="dot">•</span>
          {/* <span className="music-key text-label-small">{key}</span> */}
        </div>
      </div>

      <div className={`music-tag ${typeTag.toLowerCase()}`}>{typeTag}</div>

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
            <button className="delete-opt" onClick={() => { setShowConfirm(true); setMenuOpen(false); }}>
              <MdDelete size={18} /> Remover
            </button>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO CUSTOMIZADO */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal-content">
            <h3 className="text-headline-small">Deseja excluir a música?</h3>
            <p className="text-body-medium">"{title}" será removida permanentemente do setlist.</p>
            
            <div className="confirm-modal-actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)}>
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
