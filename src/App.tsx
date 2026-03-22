import Header from "./components/Header/Index";
import Main from "./pages/Main/Index";
import Music from "./pages/Music/Index";
import Footer from "./components/Footer/Index";
import Setting from "./pages/Settings/Index";
import { useNavigation } from "./context/NavigationContext";
import { ToastContainer } from "react-toastify";

import "./App.css";
import { useEffect, useState } from "react";

function App() {
  const { showPage } = useNavigation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get("admin");

    // Se vier na URL ou já estiver no storage, ativa o modo manager
    if (adminParam === "true" || localStorage.getItem("admin") === "true") {
      localStorage.setItem("admin", "true");
      setIsAdmin(true);
    }
  }, []);

  const renderPage = () => {
    switch (showPage) {
      case "music":
        return <Music />;
      case "settings":
        return <Setting />;
      case "main":
      default:
        return <Main />;
    }
  };

  return (
    <div
      className="container-principal"
      style={{
        flexDirection: "column",
        display: "flex",
        background: "#0F172A",
        paddingBottom: isAdmin ? "70px" : "0",
      }}
    >
      <Header />

      {renderPage()}
      {isAdmin && <Footer />}
      <ToastContainer />
    </div>
  );
}

export default App;
