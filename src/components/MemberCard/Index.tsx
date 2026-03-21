import React, { useState } from "react";
import "./index.css";
import { PiMicrophoneFill } from "react-icons/pi";
import Modal from "../Modal/Index";
import erick from "../../assets/erick.png"
import camila from "../../assets/camila.png"
import ingrid from "../../assets/ingrid.png"
import adriane from "../../assets/adriane.png"
import nadila from "../../assets/nadila.png"

interface MemberProps {
  id: string,
  name: string;
  isLimitReached: Boolean
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

        <button disabled={isLimitReached} className="add-music-btn" onClick={() => setShow(true)} type="button">
          <span className="plus">+</span>
          MÚSICA
        </button>
      </div>

      <Modal getRepertories={getRepertories} isOpen={show} repertories={repertories} onClose={() => setShow(false)} idSinger={id} />
    </>
  );
};

export default MemberCard;
