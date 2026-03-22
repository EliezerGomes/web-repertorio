import "./index.css";
import type { IconType } from "react-icons";
import { MdChevronRight } from "react-icons/md";
import { useNavigation } from "../../context/NavigationContext";
import { PiSunFill } from "react-icons/pi";

type CardProps = {
  id: string;
  day: string;
  hour: string;
  Icon: IconType;
  description: string;
  singers: string[]
};

const Card = ({ id, day, description, hour, Icon, singers }: CardProps) => {
  const { navigateTo } = useNavigation();

  function handleMext() {
    navigateTo("music", {id, day, description, hour, singers});
  }

  return (
    <div onClick={handleMext} className="evento-card">
      <div className="evento-icon-container" style={{ backgroundColor: Icon === PiSunFill ? "#d97706" : "#1a237e" }}>
        {Icon && <Icon size={28} className="evento-icon" />}
      </div>

      <div className="evento-info">
        <h3 className="text-headline-small">{day}</h3>
        <div className="evento-details">
          <span className="text-label-caps">{description}</span>
          <span className="dot">•</span>
          <span className="text-time">{hour}</span>
        </div>
      </div>

      <MdChevronRight size={35} />
    </div>
  );
};

export default Card;
