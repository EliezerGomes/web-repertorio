import React from "react";
import "./index.css";
import { MdMoreVert } from "react-icons/md";
import type { IconType } from "react-icons"; // Para tipar o ícone

// 1. Tipagem das Props para uma música
interface MusicProps {
  title: string;
  artist: string;
  key: string;
  typeTag: "ABERTURA" | "LOUVOR" | "ADORAÇÃO"; // Tipo da música na tag
  link?: string; // Capa opcional
}

const SetlistMusicCard: React.FC<MusicProps> = ({
  title,
  artist,
  key,
  typeTag,
  link,
}) => {
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
          <span className="music-key text-label-small">{key}</span>
        </div>
      </div>

      <div className={`music-tag ${typeTag.toLowerCase()}`}>{typeTag}</div>

      <button className="music-action-button">
        <MdMoreVert size={24} />
      </button>
    </div>
  );
};

export default SetlistMusicCard;
