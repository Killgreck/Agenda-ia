import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import WeeklyView from "./pages/WeeklyView";
import AddEvent from "./pages/AddEvent";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import TrainAI from "./pages/TrainAI";
import Preferences from "./pages/Preferences";
import "./japan.css";
import "./index.css";

function App() {
  return (
    <Router>
      <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#1b1b1b", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route path="/settings" element={<Settings />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/weekly" element={<WeeklyView />} />
          <Route path="/add-event" element={<AddEvent />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/train-ai" element={<TrainAI />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;








