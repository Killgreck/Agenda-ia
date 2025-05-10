import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import axios from "axios";

/**
 * Componente que muestra sugerencias de horarios generadas por la API de Gemini
 */
export default function ScheduleSuggestions() {
  const [suggestions, setSuggestions] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener sugerencias de horarios
  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get("/api/schedule-suggestions");
      
      if (response.data && response.data.success) {
        setSuggestions(response.data.suggestions);
      } else {
        setError("No se pudieron cargar las sugerencias. Intenta de nuevo más tarde.");
      }
    } catch (err) {
      console.error("Error al obtener sugerencias:", err);
      setError("Ocurrió un error al comunicarse con el servidor. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar sugerencias al montar el componente
  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Convertir el texto de las sugerencias a formato HTML para preservar saltos de línea
  const formattedSuggestions = suggestions
    .split("\n")
    .map((line, index) => (
      <p key={index} className={line.trim().length === 0 ? "my-2" : "my-1"}>
        {line}
      </p>
    ));

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Sugerencias para tu Agenda</CardTitle>
            <CardDescription>
              Recomendaciones personalizadas basadas en tu calendario
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchSuggestions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-destructive">{error}</div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Generando sugerencias...
            </p>
          </div>
        ) : (
          <div className="text-sm">{formattedSuggestions}</div>
        )}
      </CardContent>
    </Card>
  );
}