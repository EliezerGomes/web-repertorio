import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import Main from "./Index";
import Modal from "../../components/Modal/Index";
import { useNavigation } from "../../context/NavigationContext";
import { fetchWorships } from "../../services/monthlySchedule";
import { addDoc, getDocs } from "firebase/firestore";
import { SINGER_IDS } from "../../constants/singers";
import { singerImages } from "../../constants/singerImages";

jest.mock("../../context/NavigationContext", () => ({ useNavigation: jest.fn() }));
jest.mock("../../services/monthlySchedule", () => ({ fetchWorships: jest.fn(), fetchGeneratedMonth: jest.fn(async () => "2026-11") }));
jest.mock("../../services/firebase", () => ({ db: {} }));
jest.mock("react-toastify", () => ({ toast: { success: jest.fn(), warning: jest.fn() } }));
jest.mock("firebase/firestore", () => ({
  collection: (_db, name) => name, getDocs: jest.fn(), addDoc: jest.fn(async () => ({})),
  doc: jest.fn(), updateDoc: jest.fn(), serverTimestamp: jest.fn(),
}));

const morning = { id: "2026-11-01-gloria", date: "2026-11-01", day: "Domingo", hour: "09:00", description: "Manhã de Glória", enable: true, singers: ["thalia"] };
const evening = { ...morning, id: "2026-11-01-familia", hour: "19:00", description: "Culto da Família" };

test("entry on November 12 waits for the GET and displays only the current calendar week", async () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 10, 12, 12));
  try {
    sessionStorage.setItem("scheduleTab", "weekly");
    useNavigation.mockReturnValue({ navigateTo: jest.fn() });
    let finishLoading;
    fetchWorships.mockReturnValueOnce(new Promise((resolve) => { finishLoading = resolve; }));
    getDocs.mockResolvedValue({ docs: [] });
    render(<Main />);
    expect(screen.getByRole("status", { name: "Carregando escala" })).toBeInTheDocument();
    expect(screen.queryByText("Nenhum culto escalado nesta semana.")).not.toBeInTheDocument();
    await act(async () => finishLoading([
      { ...morning, id: "previous", date: "2026-11-08", description: "Semana anterior" },
      { ...morning, id: "current", date: "2026-11-15", description: "Culto desta semana" },
      { ...morning, id: "next", date: "2026-11-22", description: "Próxima semana" },
    ]));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("09/11/2026 a 15/11/2026")).toBeInTheDocument();
    expect(screen.getByText("Culto desta semana")).toBeInTheDocument();
    expect(screen.queryByText("Semana anterior")).not.toBeInTheDocument();
    expect(screen.queryByText("Próxima semana")).not.toBeInTheDocument();
  } finally { jest.useRealTimers(); }
});

test("calendar shows every day and opens the precise selected service", async () => {
  sessionStorage.setItem("scheduleMonth", "2025-01");
  sessionStorage.setItem("scheduleTab", "weekly");
  const navigateTo = jest.fn();
  useNavigation.mockReturnValue({ navigateTo });
  fetchWorships.mockResolvedValue([morning, evening, { ...morning, id: "wednesday", date: "2026-11-04", description: "Culto do Alinhamento e Avivamento", singers: [SINGER_IDS.INGRID] }]);
  getDocs.mockResolvedValue({ docs: [{ id: "thalia", data: () => ({ name: "Thalia" }) }, { id: SINGER_IDS.INGRID, data: () => ({ name: "Ingrid" }) }] });
  const { container } = render(<Main />);
  fireEvent.click(screen.getByRole("tab", { name: "Mensal" }));
  const button = await screen.findByRole("button", { name: /01\/11\/2026, Culto da Família, 19:00/ });
  expect(container.querySelectorAll("time")).toHaveLength(30);
  expect(screen.getAllByLabelText("Thalia")).toHaveLength(2);
  fireEvent.click(button);
  expect(navigateTo).toHaveBeenCalledWith("music", evening);
  expect(screen.queryByRole("button", { name: /mês/i })).not.toBeInTheDocument();
  expect(container.querySelector(".calendar-service-label")).toBeInTheDocument();
  expect(screen.getByText("Alinhamento e Avivamento")).toHaveClass("calendar-service-label");
  expect(screen.getByRole("img", { name: "Ingrid" })).toHaveAttribute("src", singerImages[SINGER_IDS.INGRID]);
});

test("adding songs to two services keeps their distinct worship IDs", async () => {
  addDoc.mockClear();
  const onClose = jest.fn();
  useNavigation.mockReturnValue({ worship: morning });
  const first = render(<Modal idSinger="thalia" isOpen onClose={onClose} repertories={[]} getRepertories={() => {}} />);
  fireEvent.change(screen.getByPlaceholderText("Ex: Bondade de Deus"), { target: { value: "Louvor da manhã" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  first.unmount();
  useNavigation.mockReturnValue({ worship: evening });
  render(<Modal idSinger="thalia" isOpen onClose={onClose} repertories={[]} getRepertories={() => {}} />);
  fireEvent.change(screen.getByPlaceholderText("Ex: Bondade de Deus"), { target: { value: "Louvor da noite" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(addDoc).toHaveBeenCalledTimes(2));
  expect(addDoc.mock.calls.map(([collection, data]) => [collection, data.id_worship])).toEqual([
    ["repertoire", morning.id], ["repertoire", evening.id],
  ]);
});
