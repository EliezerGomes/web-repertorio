import React, { useState } from "react";
import "./index.css";
import { PiMicrophoneFill } from "react-icons/pi";
import Modal from "../Modal/Index";
import female from "../../assets/female.png"

interface MemberProps {
  id: number,
  name: string;
  gender: string
}

const MemberCard: React.FC<MemberProps> = (props) => {
  const { id, name, gender } = props;
  const [show, setShow] = useState(false);

  return (
    <>
      <div className="member-card">
        <div className="member-avatar-container">
          <img src={gender === "F" ? female : ""} alt={name} className="member-avatar" />
          <div className="member-badge">
            <PiMicrophoneFill size={14} className="member-badge-icon" />
          </div>
        </div>
        <h4 className="member-name text-body-small">{name}</h4>

        <button className="add-music-btn" onClick={() => setShow(true)} type="button">
          <span className="plus">+</span>
          MÚSICA
        </button>
      </div>

      <Modal isOpen={show} onClose={() => setShow(false)} idSinger={id} />
    </>
  );
};

export default MemberCard;
