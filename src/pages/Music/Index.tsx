import React, { useLayoutEffect, useState } from "react";
import "./index.css";
import { PiCalendarFill, PiClockFill } from "react-icons/pi";
import MemberCard from "../../components/MemberCard/Index";
import SetlistMusicCard from "../../components/SetListMusicCard/Index";
import { FiChevronLeft } from "react-icons/fi"; // Um chevron mais fino e moderno
import { useNavigation } from "../../context/NavigationContext";
import { db } from "../../services/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import Loading from "../../components/Loading/Index";
import Modal from "../../components/Modal/Index";

type SingerType = {
  id: string;
  name: string;
};

type RepertoriesType = {
  id_singer: string;
  id_worship: string;
  link: string;
  name_music: string;
  name_singer: string;
};

const Music: React.FC = () => {
  const { navigateTo, worship, loading, setLoading } = useNavigation();
  const [singers, setSingers] = useState<SingerType[] | []>([]);
  const [repertories, setRepertories] = useState<RepertoriesType[] | []>([]);
  const [musicToEdit, setMusicToEdit] = useState<RepertoriesType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleOpenEdit = (music: RepertoriesType) => {
    setMusicToEdit(music);
    setIsModalOpen(true);
  };

useLayoutEffect(() => {
  const getSingers = async () => {
    setLoading(true);
    try {
      const result = await getDocs(collection(db, "singers"));
      
      const allSingers = result.docs.map(
        (item) => ({ id: item.id, ...item.data() } as SingerType)
      );

      const aux: SingerType[] = worship.singers
        .map((id) => allSingers.find((s) => s.id === id))
        .filter((s): s is SingerType => !!s);
      setSingers(aux);
    } catch (error) {
      console.error("Erro ao buscar cantores:", error);
    } finally {
      setLoading(false);
    }
  };

  getSingers();
}, []);

  useLayoutEffect(() => {
    getRepertories();
  }, []);

  useLayoutEffect(() => {
    const adminStatus = localStorage.getItem("admin") === "true";
    setIsAdmin(adminStatus);
  }, []);

  const getRepertories = async () => {
    if (!worship?.id) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, "repertoire"),
        where("id_worship", "==", worship.id),
      );

      const result = await getDocs(q);
      const aux = result.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as RepertoriesType[];

      const sortedRepertories = aux.sort((a, b) => {
        // 1. Encontramos a posição de cada cantor no array original da escala
        const indexA = worship.singers.indexOf(a.id_singer);
        const indexB = worship.singers.indexOf(b.id_singer);

        // 2. Se forem cantores diferentes, ordena pela posição na escala
        if (indexA !== indexB) {
          return indexA - indexB;
        }

        // 3. Se for o mesmo cantor, ordena pelo campo 'order' (1 ou 2)
        return a.order - b.order;
      });

      setRepertories(sortedRepertories);
    } catch (error) {
      console.error("Erro ao buscar repertório:", error);
    } finally {
      setLoading(false);
    }
  };

const handleGenerateWhatsAppMessage = () => {
  if (!worship || !repertories.length) return;

  // 1. Cabeçalho formatado
  let message = `*REPERTÓRIO - ${worship.day.toUpperCase()}*\n`;
  message += `\n`;
  worship.singers.forEach((singerId: string) => {
    const singerInfo = singers.find(s => s.id === singerId);
    const singerName = singerInfo ? singerInfo.name : "Cantor não encontrado";
    const singerMusics = repertories.filter(m => m.id_singer === singerId);

    if (singerMusics.length > 0) {
      message += `*${singerName.toUpperCase()}*\n`;
      message += `\n`;
      singerMusics.forEach((music, index) => {
        message += `- ${music.name_music} | _${music.artist || music.name_singer}_\n`;
        
        if (music.link) {
          message += `${music.link}\n`;
        }
      });
      
      message += `\n`;
    }
  });

  navigator.clipboard.writeText(message)
};

  return (
    <>
      {!loading ? (
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
              <h2 className="section-title text-headline-small">
                Vozes Escaladas
              </h2>
              <span className="section-subtitle text-label-small">
                {singers.length} Integrantes
              </span>
            </div>

            <div className="members-grid">
              {singers.map((member) => {
                const songsCount = repertories.filter(
                  (r) => r.id_singer === member.id,
                ).length;

                return (
                  <MemberCard
                    key={member.id}
                    id={member.id}
                    name={member.name}
                    isLimitReached={songsCount >= 2} // Nova prop
                    repertories={repertories}
                    getRepertories={getRepertories}
                  />
                );
              })}
            </div>
          </section>

          {/* Seção do Setlist do Culto */}
          <section className="setlist-section">
            <h2 className="section-title text-headline-small">
              Louvores do Culto
            </h2>

            <div className="setlist-list">
              {repertories.map((music) => (
                <SetlistMusicCard
                  key={music.id}
                  id={music.id}
                  title={music.name_music}
                  artist={music.name_singer}
                  id_singer={music.id_singer} // Passando o ID do cantor da música
                  singersList={singers}
                  onEdit={() => handleOpenEdit(music)}
                  getRepertories={getRepertories}
                />
              ))}
            </div>
          </section>

          {isAdmin && (
            <section className="admin-actions-section">
              <div className="admin-divider" />
              <button
                className="btn-generate-repertoire"
                onClick={handleGenerateWhatsAppMessage}
              >
                Gerar repertório
              </button>
            </section>
          )}
        </div>
      ) : (
        <Loading />
      )}

      {isModalOpen && (
        <Modal
          key={musicToEdit ? musicToEdit.id : "new-music"}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setMusicToEdit(null); // Limpa ao fechar
          }}
          getRepertories={getRepertories}
          idSinger={musicToEdit && musicToEdit.id_singer}
          musicData={musicToEdit} // Nova prop
          repertories={repertories}
        />
      )}
    </>
  );
};

export default Music;
