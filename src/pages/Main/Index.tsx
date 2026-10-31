import "./index.css";
import Card from "../../components/Card/Index";
import { PiMoonFill, PiSunFill } from "react-icons/pi";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { useNavigation } from "../../context/NavigationContext";
import { fetchWorships, fetchGeneratedMonth, type Worship } from "../../services/monthlySchedule";
import { singerImages } from "../../constants/singerImages";
import { formatWeekKey, getWeekDates } from "../../utils/schedule/calendar";
import { dateLabel, getNextScheduleMonth } from "../../utils/schedule/monthPlan";
import { selectWeeklyWorships } from "../../utils/schedule/views";
import Loading from "../../components/Loading/Index";
import type { WeekDates } from "../../utils/schedule/calendar";

export default function Main() {
  const { navigateTo } = useNavigation();
  const [tab, setTab] = useState(() => sessionStorage.getItem("scheduleTab") === "monthly" ? "monthly" : "weekly");
  const [month, setMonth] = useState(getNextScheduleMonth);
  const [worships, setWorships] = useState<Worship[]>([]);
  const [weekly, setWeekly] = useState<Worship[]>([]);
  const [week, setWeek] = useState<WeekDates | null>(null);
  const [singers, setSingers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = async () => {
    setLoading(true); setError(false);
    try {
      const [events, people] = await Promise.all([fetchWorships(), getDocs(collection(db, "singers"))]);
      const generatedMonth = await fetchGeneratedMonth(events);
      // Usa a mesma data para o intervalo exibido e o filtro, após concluir o GET.
      const today = new Date();
      const currentWeek = getWeekDates(today);
      const currentWeekWorships = selectWeeklyWorships(events, today);
      setWorships(events);
      setMonth(generatedMonth);
      setSingers(Object.fromEntries(people.docs.map((d) => [d.id, d.data().name])));
      setWeek(currentWeek);
      setWeekly(currentWeekWorships);
    } catch { setError(true); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const changeTab = (value: string) => { setTab(value); sessionStorage.setItem("scheduleTab", value); };
  const [year, number] = month.split("-").map(Number);
  const first = new Date(year, number - 1, 1);
  const days = new Date(year, number, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = Math.ceil((offset + days) / 7) * 7;
  const events = worships.filter((w) => w.enable && w.date?.startsWith(month));
  return <div className="main-container">
    <div className="schedule-tabs" role="tablist" aria-label="Visualização da escala">
      <button role="tab" aria-selected={tab === "weekly"} aria-controls="schedule-panel" onClick={() => changeTab("weekly")}>Semanal</button>
      <button role="tab" aria-selected={tab === "monthly"} aria-controls="schedule-panel" onClick={() => changeTab("monthly")}>Mensal</button>
    </div>
    <header className="page-header">
      <h1 className="text-headline text-primary">{tab === "weekly" ? "Cultos da semana" : "Calendário de cultos"}</h1>
      <p className="text-body text-secondary">Selecione um culto para adicionar músicas ao repertório daquela data.</p>
      {tab === "weekly" && week && !loading && !error && <p className="text-secondary">{dateLabel(formatWeekKey(week.monday))} a {dateLabel(formatWeekKey(week.sunday))}</p>}
    </header>
    <section id="schedule-panel" role="tabpanel" aria-label={tab === "weekly" ? "Semanal" : "Mensal"}>
      {loading ? <div role="status" aria-label="Carregando escala"><Loading /></div> : error ? <div role="alert" className="text-secondary">Não foi possível carregar a escala. <button onClick={load}>Tentar novamente</button></div> : tab === "weekly" ?
        <div className="weekly-events">{weekly.length ? weekly.map((w) => <Card key={w.id} {...w} Icon={w.Icon === "PiSunFill" ? PiSunFill : PiMoonFill} />) : <p className="text-secondary">Nenhum culto escalado nesta semana.</p>}</div> : <>
          <div className="calendar-toolbar">
            <h2>{first.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h2>
          </div>
          {!events.length && <p className="calendar-empty text-secondary">Nenhuma escala cadastrada neste mês.</p>}
          <div className="calendar-scroll"><div className="month-calendar">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
            {Array.from({ length: cells }, (_, index) => {
              const day = index - offset + 1;
              if (day < 1 || day > days) return <div key={index} className="calendar-day outside-month" />;
              const date = `${month}-${String(day).padStart(2, "0")}`;
              return <div key={date} className={`calendar-day ${date === formatWeekKey(new Date()) ? "calendar-today" : ""}`}>
                <time dateTime={date} className="calendar-date">{day}</time>
                {events.filter((w) => w.date === date).sort((a, b) => a.hour.localeCompare(b.hour)).map((w) => <button key={w.id} className="calendar-event" onClick={() => navigateTo("music", w)} aria-label={`${dateLabel(date)}, ${w.description}, ${w.hour}. ${w.singers.map((id) => singers[id] ?? "Cantor").join(", ")}. Abrir repertório`}>
                  <span className="calendar-hour">{w.hour}</span>
                  <span className="calendar-service-label">{w.description.replace(/^Culto (do |da |das |dos )?/i, "")}</span>
                  <span className="calendar-avatars">{w.singers.map((id) => singerImages[id] ? <img key={id} src={singerImages[id]} alt={singers[id] ?? "Cantor"} title={singers[id]} /> : <span key={id} className="calendar-avatar-placeholder" title={singers[id]} aria-label={singers[id]}>{(singers[id] ?? "?").charAt(0)}</span>)}</span>
                  {!w.singers.length && <span>Sem cantores</span>}
                </button>)}
              </div>;
            })}
          </div></div>
        </>}
    </section>
  </div>;
}
