import React, { useState } from "react";
import { toast } from "react-toastify"; // Importe o toast
import "./index.css";
import { PiMicrophoneFill } from "react-icons/pi";
import Modal from "../Modal/Index";
import erick from "../../assets/erick.png"
import camila from "../../assets/camila.png"
import ingrid from "../../assets/ingrid.png"
import adriane from "../../assets/adriane.png"
import nadila from "../../assets/nadila.png"
import { IoMdAlert } from "react-icons/io";

interface MemberProps {
  id: string,
  name: string;
  isLimitReached: boolean
  repertories: any[]
  getRepertories: () => void
}

const images: Record<string, string> = {
  "KE81ihXDYPCwOZMDaC2y": ingrid,
  "Vxb4PlodkFcG3OkCXMZX": camila,
  "WBJ7JU8oIhbYOKrwVzL9": erick,
  "ubMq7aEEqoXbsMTzTwEw": nadila,
  "wvccqsbxHRTN2SkIGCLG": adriane
}

const MemberCard: React.FC<MemberProps> = (props) => {
  const { id, name, isLimitReached, repertories, getRepertories } = props;
  const [show, setShow] = useState(false);

  const handleAddClick = () => {
    if (isLimitReached) {
      // Mensagem personalizada e amigável
      toast.warning(`Limite atingido! ${name} já possui 2 músicas escaladas.`, {
      icon: <IoMdAlert size={22} color="#f59e0b" />,
      className: "custom-toast-warning",
      progressClassName: "custom-toast-progress",
      position: "top-right",
      autoClose: 3500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
    });
      return;
    }
    setShow(true);
  };
  return (
    <>
      <div className="member-card">
        <div className="member-avatar-container">
          <img src={images[id]} alt={name} className="member-avatar" />
          <div className="member-badge">
            <PiMicrophoneFill size={14} className="member-badge-icon" />
          </div>
        </div>
        <h4 className="member-name text-body-small">{name}</h4>

        <button className="add-music-btn" onClick={handleAddClick} type="button">
          <span className="plus">+</span>
          MÚSICA
        </button>
      </div>

      <Modal getRepertories={getRepertories} isOpen={show} repertories={repertories} onClose={() => setShow(false)} idSinger={id} />
    </>
  );
};

export default MemberCard;
