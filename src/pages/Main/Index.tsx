import "./index.css";
import Card from "../../components/Card/Index";
import { PiMoonFill, PiSunFill } from "react-icons/pi";
import { db } from "../../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useLayoutEffect, useState } from "react";
import type { IconType } from "react-icons";
import { useNavigation } from "../../context/NavigationContext";
import Loading from "../../components/Loading/Index";

type WorshipType = {
  id: string;
  day: string;
  description: string;
  hour: string;
  Icon: string;
  enable: boolean;
  singers: string[];
};

const mapIcon: Record<string, IconType> = {
  PiMoonFill: PiMoonFill,
  PiSunFill: PiSunFill,
};

export default function Main() {
  const [worships, setWorships] = useState<WorshipType[] | []>([]);
  const { loading, setLoading } = useNavigation();

  useLayoutEffect(() => {
  const getWorships = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "worship"), where("enable", "==", true));
      const result = await getDocs(q);

      // 1. Mapeia os dados
      const aux: WorshipType[] = result.docs.map(
        (item) => ({ id: item.id, ...item.data() } as WorshipType)
      );

      // 2. Define o peso dos dias para ordenação
      const dayOrder: Record<string, number> = {
        "Quarta-feira": 1,
        "Sexta-feira": 2,
        "Domingo": 3,
      };

      // 3. Aplica a ordenação
      aux.sort((a, b) => {
        const orderA = dayOrder[a.day] || 99; // 99 para dias não mapeados ficarem por último
        const orderB = dayOrder[b.day] || 99;

        if (orderA !== orderB) {
          return orderA - orderB; // Ordena pelo dia da semana
        }

        // Se o dia for o mesmo, ordena pela hora (ex: "19:30" vs "20:00")
        return a.hour.localeCompare(b.hour);
      });

      setWorships(aux);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  getWorships();
}, []);

  if (loading) return <Loading />;

  return (
    <div className="main-container">
      <header className="page-header">
        <h1 className="text-headline text-primary">Cultos da semana</h1>
        <p className="text-body subdescription text-secondary">
          Selecione o dia do culto para adicionar músicas ao repertório.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {worships.map((item, idx) => (
          <Card
            id={item.id}
            key={idx}
            Icon={mapIcon[item.Icon]}
            day={item.day}
            description={item.description}
            hour={item.hour}
            singers={item.singers}
          />
        ))}
      </div>
    </div>
  );
}
