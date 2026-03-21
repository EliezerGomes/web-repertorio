import React from 'react';
import './index.css';
import { MdMoreVert } from "react-icons/md";
import type { IconType } from 'react-icons'; // Para tipar o ícone

// 1. Tipagem das Props para uma música
interface MusicProps {
  title: string;
  artist: string;
  key: string;
  typeTag: 'ABERTURA' | 'LOUVOR' | 'ADORAÇÃO'; // Tipo da música na tag
  coverImageUrl?: string; // Capa opcional
}

const SetlistMusicCard: React.FC<MusicProps> = ({ title, artist, key, typeTag, coverImageUrl }) => {
  return (
    <div className="music-card">
      <div className="music-cover-container">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt={`${title} cover`} className="music-cover" />
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

      <div className={`music-tag ${typeTag.toLowerCase()}`}>
        {typeTag}
      </div>

      <button className="music-action-button">
        <MdMoreVert size={24} />
      </button>
    </div>
  );
};

export default SetlistMusicCard;