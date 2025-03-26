import { SettingsMenu } from "./SettingsMenu";

export function Settings() {
  return (
    <div
      style={{
        padding: "40px",
        backgroundColor: "#FAFAFA",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "36px", fontWeight: "300", color: "#2E2E2E" }}>
        ⚙️ Configuración
      </h1>
      <SettingsMenu />
    </div>
  );
}

export default Settings;



  