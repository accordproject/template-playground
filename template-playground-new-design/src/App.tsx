import { useState } from "react";
import MainContainer from "./components/MainContainer";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import "./styles/App.css";

const App: React.FC = () => {
  //states for toggling from sidebar
  const [showEditor, setShowEditor] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  return (
    <>
      <Navbar />
      <div className="main-section">
        <Sidebar showEditor={showEditor} showConsole={showConsole} showPreview={showPreview} setShowEditor={setShowEditor} setShowConsole={setShowConsole} setShowPreview={setShowPreview} />
        <MainContainer showEditor={showEditor} showConsole={showConsole} showPreview={showPreview} setShowEditor={setShowEditor} setShowConsole={setShowConsole} setShowPreview={setShowPreview} />
      </div>
    </>
  );
};

export default App;
