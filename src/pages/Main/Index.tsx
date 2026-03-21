import "./index.css";
import Card from "../../components/Card/Index";
import { PiMoonFill, PiSunFill } from "react-icons/pi";
import { db } from "../../services/firebase";
import { collection, getDocs } from "firebase/firestore";
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
        const result = await getDocs(collection(db, "worship"));
        const aux: WorshipType[] = result.docs.map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            }) as WorshipType,
        );

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
