import React, { useEffect, useState } from "react";
import "./index.css";
import { PiCalendarFill, PiClockFill } from "react-icons/pi";
import MemberCard from "../../components/MemberCard/Index";
import SetlistMusicCard from "../../components/SetListMusicCard/Index";
import { FiChevronLeft } from "react-icons/fi"; // Um chevron mais fino e moderno
import { useNavigation } from "../../context/NavigationContext";
import { db } from "../../services/firebase";
import { collection, getDocs } from "firebase/firestore";

type SingerType = {
  id: string;
  name: string;
  gender: string;
};

const Music: React.FC = () => {
  const { navigateTo, worship } = useNavigation();
  const [singers, setSingers] = useState<SingerType[] | []>([]);

  useEffect(() => {
    const getSingers = async () => {
      try {
        const result = await getDocs(collection(db, "singers"));

        // 1. Filtramos apenas os cantores cujo ID está no array worship.singers
        // 2. Mapeamos para o formato SingerType
        const aux: SingerType[] = result.docs
          .filter((item) => worship.singers.includes(item.id))
          .map(
            (item) =>
              ({
                id: item.id,
                ...item.data(),
              }) as SingerType,
          );

        setSingers(aux);
      } catch (error) {
        console.error("Erro ao buscar cantores:", error);
      }
    };

    getSingers();
  }, []);

  // 2. Dados de Exemplo para o Setlist
  const setlistData: {
    id: number;
    title: string;
    artist: string;
    key: string;
    typeTag: "ABERTURA" | "LOUVOR" | "ADORAÇÃO";
    coverImageUrl?: string;
  }[] = [
    {
      id: 1,
      title: "Ousado Amor",
      artist: "Reckless Love",
      key: "G",
      typeTag: "ABERTURA",
      coverImageUrl: "/path-to-ousado-amor-cover.jpg",
    },
    {
      id: 2,
      title: "Aclame ao Senhor",
      artist: "Shout to the Lord",
      key: "A",
      typeTag: "LOUVOR",
      coverImageUrl: "/path-to-aclame-ao-senhor-cover.jpg",
    },
    {
      id: 3,
      title: "Vem Me Buscar",
      artist: "Jefferson & Suellen",
      key: "E",
      typeTag: "ADORAÇÃO",
      coverImageUrl: "/path-to-vem-me-buscar-cover.jpg",
    },
  ];

  return (
    <div className="music-page-container">
      {/* Seção do Cabeçalho do Evento */}
      <div style={{ flexDirection: "column", display: "flex", gap: 20 }}>
        <button className="back-button" onClick={() => navigateTo("main")}>
          <FiChevronLeft size={24} />
        </button>

        <header className="event-header-box">
          <p className="event-label text-label-caps">CULTO</p>
          <h1 className="event-title text-headline-large">
            {worship.description}
          </h1>
          <div className="event-meta">
            <div className="event-date">
              <PiCalendarFill className="meta-icon" size={18} />
              <span className="text-body">{worship.day}</span>
            </div>
            <div className="event-time">
              <PiClockFill className="meta-icon" size={18} />
              <span className="text-body">{worship.hour}</span>
            </div>
          </div>
        </header>
      </div>

      {/* Seção das Vozes Escaladas */}
      <section className="members-section">
        <div className="section-header">
          <h2 className="section-title text-headline-small">Vozes Escaladas</h2>
          <span className="section-subtitle text-label-small">
            {singers.length} Integrantes
          </span>
        </div>

        <div className="members-grid">
          {singers.map((member) => (
            <MemberCard
              key={member.id}
              id={member.id}
              name={member.name}
              gender={member.gender}
            />
          ))}
        </div>
      </section>

      {/* Seção do Setlist do Culto */}
      <section className="setlist-section">
        <h2 className="section-title text-headline-small">Setlist do Culto</h2>

        <div className="setlist-list">
          {setlistData.map((music) => (
            <SetlistMusicCard
              key={music.id}
              title={music.title}
              artist={music.artist}
              key={music.key}
              typeTag={music.typeTag}
              coverImageUrl={music.coverImageUrl}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Music;
