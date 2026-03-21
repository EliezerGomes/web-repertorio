import Header from "./components/Header/Index";
import Main from "./pages/Main/Index";
import Music from "./pages/Music/Index";
import { useNavigation } from "./context/NavigationContext";

import "./App.css";
import { useEffect } from "react";

function App() {
  const { showPage } = useNavigation()

  const renderPage = () => {
    switch (showPage) {
      case "music":
        return <Music />; 
      case "main":
      default:
        return <Main />;
    }
  };


  return (
    <div className="container-principal" style={{flexDirection: 'column', display: "flex", background: "#0F172A"}}>
      <Header />

      {renderPage()}
    </div>
  );
}

export default App;
