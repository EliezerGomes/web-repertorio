import React from "react";
import { HiOutlineHome, HiOutlineCog } from "react-icons/hi"; // Ícones minimalistas
import { useNavigation } from "../../context/NavigationContext";
import "./index.css";

const Footer: React.FC = () => {
  const { showPage, navigateTo } = useNavigation();

  return (
    <footer className="footer-manager">
      <button 
        className={`footer-item ${showPage === "main" ? "active" : ""}`}
        onClick={() => navigateTo("main")}
      >
        <HiOutlineHome size={24} />
        <span className="text-label-small">Início</span>
      </button>

      <button 
        className={`footer-item ${showPage === "settings" ? "active" : ""}`}
        onClick={() => navigateTo("settings")}
      >
        <HiOutlineCog size={24} />
        <span className="text-label-small">Ajustes</span>
      </button>
    </footer>
  );
};

export default Footer;