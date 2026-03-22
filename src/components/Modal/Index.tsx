import React, { useState } from "react";
import "./index.css";
import { IoIosClose, IoIosLink } from "react-icons/io";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useNavigation } from "../../context/NavigationContext";

interface ModalProps {
  idSinger: number;
  isOpen: boolean;
  onClose: () => void;
  repertories: any[];
  getRepertories: () => void;
  musicData?: (RepertorieType & { id: string }) | null;
}

type RepertorieType = {
  id_singer: string;
  id_worship: string;
  link: string;
  name_music: string;
  name_singer: string;
  order: number;
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  idSinger,
  repertories,
  getRepertories,
  musicData,
}) => {
  const { worship } = useNavigation();
  const [obj, setObj] = useState<RepertorieType>({
    id_singer: musicData?.id_singer || idSinger || "",
    id_worship: musicData?.id_worship || worship.id || "",
    link: musicData?.link || "",
    name_music: musicData?.name_music || "",
    name_singer: musicData?.name_singer || "",
    order: musicData?.order || 0,
  });
  
  if (!isOpen) return null;

  async function sendRepertorie() {
    const isEditing = !!musicData?.id;
    if (!obj.name_music) {
      alert("Preencha o nome da música!");
      return;
    }

    try {
      if (isEditing) {
        const docRef = doc(db, "repertoire", musicData!.id);
        await updateDoc(docRef, { ...obj });
      } else {
        const singerMusics = repertories.filter(
          (m) => m.id_singer === idSinger && m.id_worship === worship.id,
        );

        const currentOrder = singerMusics.length + 1;

        const repertoireRef = collection(db, "repertoire");

        await addDoc(repertoireRef, {
          name_music: obj.name_music,
          name_singer: obj.name_singer,
          id_singer: idSinger,
          link: obj.link,
          id_worship: worship.id,
          order: currentOrder, // Agora salvamos 1 ou 2
          createdAt: serverTimestamp(),
        });
      }

        onClose();
        getRepertories();
    } catch (error) {
      console.error("Erro ao salvar música:", error);
    }
  }

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
              value={obj.name_music}
              placeholder="Ex: Bondade de Deus"
              className="modal-input"
              onChange={(e) =>
                setObj((prev) => ({
                  ...prev,
                  name_music: e.target.value,
                }))
              }
            />
          </div>

          <div className="input-group">
            <label className="text-label-caps">NOME DO CANTOR</label>
            <input
              type="text"
              value={obj.name_singer}
              onChange={(e) =>
                setObj((prev) => ({
                  ...prev,
                  name_singer: e.target.value,
                }))
              }
              placeholder="Ex: Isaias Saad"
              className="modal-input"
            />
          </div>

          <div className="input-group">
            <label className="text-label-caps">LINK DO YOUTUBE</label>
            <div className="input-with-icon">
              <IoIosLink size={18} className="inner-icon" />
              <input
                type="text"
                value={obj.link}
                onChange={(e) =>
                  setObj((prev) => ({
                    ...prev,
                    link: e.target.value,
                  }))
                }
                placeholder="https://youtube.com/..."
                className="modal-input with-icon"
              />
            </div>
          </div>

          <button onClick={sendRepertorie} className="save-button">
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Modal;
