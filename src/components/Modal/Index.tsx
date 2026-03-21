import React from "react";
import "./index.css";
import { IoIosClose, IoIosLink } from "react-icons/io";

interface ModalProps {
    idSinger: number,
  isOpen: boolean;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2 className="text-headline-small">Nova Música</h2>
          <button className="close-button" onClick={onClose}>
            <IoIosClose size={24} />
          </button>
        </header>

        <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <label className="text-label-caps">NOME DA MÚSICA</label>
            <input
              type="text"
              placeholder="Ex: Bondade de Deus"
              className="modal-input"
            />
          </div>

          <div className="input-group">
            <label className="text-label-caps">NOME DO CANTOR</label>
            <div className="select-wrapper">
              <input type="text" className="modal-input with-icon" />
            </div>
          </div>

          <div className="input-group">
            <label className="text-label-caps">LINK DO YOUTUBE</label>
            <div className="input-with-icon">
              <IoIosLink size={18} className="inner-icon" />
              <input
                type="text"
                placeholder="https://youtube.com/..."
                className="modal-input with-icon"
              />
            </div>
          </div>

          <button type="submit" className="save-button">
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Modal;
