import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isCreatingAccount) {
      // Guardar el username en localStorage
      localStorage.setItem("userId", username);
      alert("Cuenta creada con éxito. Por favor, inicia sesión.");
      setIsCreatingAccount(false);
      setUsername("");
      setEmail("");
      setPassword("");
    } else {
      // Verificar si el username está guardado
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        navigate("/weekly");
      } else {
        alert("Usuario no encontrado. Por favor, crea una cuenta.");
      }
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Calendario IA</h1>

      <form onSubmit={handleSubmit} className="login-form">
        {isCreatingAccount && (
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="input-japan"
          />
        )}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input-japan"
        />

        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-japan"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-toggle"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button type="submit" className="button-japan">
          {isCreatingAccount ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </form>

      <p className="toggle-account" onClick={() => setIsCreatingAccount(!isCreatingAccount)}>
        {isCreatingAccount
          ? "¿Ya tienes una cuenta? Inicia sesión"
          : "¿No tienes cuenta? Crea una"}
      </p>

      {!isCreatingAccount && (
        <p className="forgot-password" onClick={() => alert("Recuperar contraseña")}>¿Olvidaste tu contraseña?</p>
      )}
    </div>
  );
}

export default LoginPage;


