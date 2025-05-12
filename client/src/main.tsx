import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Importar estilos forzados para corregir problemas de visualización
import "./force-styles.css";

createRoot(document.getElementById("root")!).render(<App />);
