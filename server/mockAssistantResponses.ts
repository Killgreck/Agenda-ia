/**
 * Sistema de respuestas predefinidas para el asistente AI
 * Este archivo proporciona respuestas simuladas para uso en demostraciones
 * cuando no se puede conectar al servicio Gemini
 */

interface ResponseTemplate {
  keywords: string[];
  responses: string[];
}

// Respuestas específicas por categorías
const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  // Saludos y presentación
  {
    keywords: ['hola', 'buenos dias', 'buenas', 'saludos', 'que tal'],
    responses: [
      "¡Hola! Soy tu asistente de AgendaIA. ¿En qué puedo ayudarte hoy con tu calendario o tareas?",
      "¡Bienvenido! Estoy aquí para ayudarte a gestionar tu tiempo de manera más eficiente. ¿Necesitas ayuda con algo específico?",
      "¡Hola! Puedo ayudarte a organizar tus tareas, crear recordatorios o responder preguntas sobre tu agenda. ¿Qué necesitas?"
    ]
  },
  
  // Eventos y calendario
  {
    keywords: ['evento', 'calendario', 'cita', 'reunión', 'conferencia', 'recordatorio'],
    responses: [
      "Veo que hablas sobre eventos. Puedes crear un nuevo evento usando el botón + en la vista de calendario, o te puedo ayudar a optimizar tu agenda actual.",
      "Tu calendario es una herramienta poderosa para la gestión del tiempo. Te recomiendo agrupar reuniones similares en bloques para mayor productividad.",
      "Para eventos recurrentes, te sugiero configurarlos directamente en la aplicación para que puedas recibir recordatorios automáticos."
    ]
  },
  
  // Tareas y pendientes
  {
    keywords: ['tarea', 'pendiente', 'to-do', 'hacer', 'completar', 'terminar'],
    responses: [
      "Para gestionar mejor tus tareas, te recomiendo asignarles prioridades. Las más importantes deberían realizarse durante tus horas de mayor energía.",
      "Una técnica efectiva es dividir tareas grandes en subtareas más manejables de no más de 25-30 minutos cada una.",
      "Recuerda aplicar la regla 2-minutos: si una tarea toma menos de 2 minutos, hazla inmediatamente en lugar de programarla."
    ]
  },
  
  // Gestión del tiempo
  {
    keywords: ['tiempo', 'productividad', 'enfoque', 'concentración', 'pomodoro', 'eficiencia'],
    responses: [
      "La técnica Pomodoro puede ayudarte a mantener el enfoque: trabaja 25 minutos, descansa 5, y después de cuatro ciclos toma un descanso más largo.",
      "Para mayor productividad, planifica tus tareas más importantes durante tus horas de mayor energía y concentración.",
      "Considera bloquear tiempo en tu calendario para trabajo enfocado sin interrupciones - esto puede aumentar tu productividad hasta un 40%."
    ]
  },
  
  // Estadísticas y análisis
  {
    keywords: ['estadística', 'análisis', 'progreso', 'datos', 'informe', 'rendimiento'],
    responses: [
      "En la sección de análisis puedes ver tus patrones de productividad y completado de tareas para identificar tus mejores momentos del día.",
      "Los informes semanales te ayudarán a entender cómo inviertes tu tiempo y ajustar tu planificación en consecuencia.",
      "Para mejorar tu productividad, revisa regularmente tus estadísticas y ajusta tu planificación según los patrones que identifiques."
    ]
  },
  
  // Preguntas sobre la aplicación
  {
    keywords: ['aplicación', 'funciona', 'función', 'característica', 'uso', 'cómo'],
    responses: [
      "AgendaIA te permite gestionar eventos, tareas y recordatorios en una interfaz intuitiva. ¿Hay alguna función específica sobre la que quieras saber más?",
      "Para sacar el máximo provecho de la aplicación, prueba a usar etiquetas para categorizar tus tareas y eventos para una mejor organización.",
      "Una función poco conocida es la posibilidad de crear plantillas para eventos recurrentes, lo que te ahorrará tiempo en el futuro."
    ]
  },
  
  // Preguntas existenciales/filosóficas
  {
    keywords: ['vida', 'felicidad', 'propósito', 'significado', 'filosofía', 'existencia'],
    responses: [
      "Aunque soy un asistente de productividad, creo que una buena gestión del tiempo debe incluir espacio para actividades que te hagan feliz y te den propósito.",
      "La productividad no debería ser el único objetivo. Asegúrate de reservar tiempo para actividades que nutran tu bienestar y creatividad.",
      "En mi experiencia como asistente, he notado que las personas más realizadas equilibran sus responsabilidades con tiempo para reflexión y actividades significativas."
    ]
  },
  
  // Rechazo educado
  {
    keywords: ['política', 'religión', 'controversia', 'ilegal', 'hackear', 'invadir'],
    responses: [
      "Como asistente enfocado en productividad, puedo ayudarte mejor con la gestión de tu calendario y tareas. ¿Hay algo específico en lo que pueda asistirte?",
      "Entiendo tu consulta, pero me especializo en ayudarte con la planificación y organización de tu tiempo. ¿Puedo ayudarte con eso?",
      "Mi función principal es asistirte con la gestión de tu tiempo y tareas. ¿Hay algo en esa área en lo que pueda serte útil?"
    ]
  },
  
  // Agradecimientos
  {
    keywords: ['gracias', 'agradezco', 'te lo agradezco', 'excelente'],
    responses: [
      "¡De nada! Estoy aquí para ayudarte a optimizar tu tiempo y productividad. No dudes en consultar si necesitas algo más.",
      "Es un placer ayudarte. Si tienes más preguntas sobre tu agenda o tareas, estaré aquí para asistirte.",
      "Me alegra haber sido útil. Recuerda que estoy disponible para ayudarte con tu planificación y organización en cualquier momento."
    ]
  }
];

// Respuestas genéricas para cuando no se encuentra una coincidencia específica
const GENERIC_RESPONSES = [
  "Entiendo lo que mencionas. En cuanto a la gestión de tu tiempo, te recomendaría establecer bloques de tiempo específicos para tareas similares.",
  "Interesante planteamiento. Una estrategia que podría funcionarte es utilizar la técnica de Eisenhower para clasificar tus tareas según su urgencia e importancia.",
  "Basándome en lo que comentas, quizás te beneficiaría establecer revisiones periódicas de tus metas y tareas, ajustando tu calendario según sea necesario.",
  "Comprendo tu situación. Te sugiero considerar la aplicación de tiempos de buffer entre tus compromisos para evitar la sensación de estar siempre apurado.",
  "Como asistente de productividad, te recomendaría evaluar qué actividades te aportan mayor valor y enfocarte en ellas durante tus horas de mayor energía.",
  "Una estrategia que podría ayudarte es la planificación semanal, dedicando un tiempo específico cada semana para organizar tus próximos días.",
  "Algo que podrías probar es la técnica 'time-boxing', asignando períodos fijos de tiempo a tareas específicas para mejorar tu enfoque y resultados."
];

/**
 * Obtiene una respuesta simulada apropiada basada en el mensaje del usuario
 * @param userMessage Mensaje enviado por el usuario
 * @returns Una respuesta simulada apropiada para el mensaje del usuario
 */
export function getMockResponse(userMessage: string): string {
  const lowercaseMessage = userMessage.toLowerCase();
  
  // Buscar si alguna plantilla coincide con el mensaje del usuario
  for (const template of RESPONSE_TEMPLATES) {
    if (template.keywords.some(keyword => lowercaseMessage.includes(keyword))) {
      // Seleccionar una respuesta aleatoria de la categoría correspondiente
      const randomIndex = Math.floor(Math.random() * template.responses.length);
      return template.responses[randomIndex];
    }
  }
  
  // Si no hay coincidencias, devolver una respuesta genérica
  const randomIndex = Math.floor(Math.random() * GENERIC_RESPONSES.length);
  return GENERIC_RESPONSES[randomIndex];
}

/**
 * Función para generar una respuesta de análisis semanal simulada
 * @param stats Estadísticas del usuario
 * @returns Una respuesta simulada con análisis de las estadísticas
 */
export function getMockWeeklyReport(stats: any): string {
  return `
📊 **Análisis Semanal de Productividad**

Durante esta semana has completado ${stats.tasksCompleted || 12} tareas de ${stats.tasksCreated || 15} programadas, lo que representa un índice de completado del ${Math.round((stats.tasksCompleted || 12) / (stats.tasksCreated || 15) * 100)}%.

🔍 **Insights principales:**
- Tu día más productivo fue el ${['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'][Math.floor(Math.random() * 5)]}
- Tus horas de mayor rendimiento están entre ${Math.floor(Math.random() * 3) + 8}:00 y ${Math.floor(Math.random() * 3) + 11}:00
- Has dedicado más tiempo a tareas de categoría ${['Trabajo', 'Personal', 'Proyectos', 'Estudio'][Math.floor(Math.random() * 4)]}

💡 **Recomendaciones para la próxima semana:**
1. Considera programar tus tareas más importantes durante tus horas de mayor productividad
2. Agrupa reuniones similares para reducir el tiempo de transición entre actividades
3. Incluye pequeños descansos entre bloques de trabajo intenso para mantener tu energía

¿Te gustaría profundizar en algún aspecto específico de tu rendimiento semanal?
`;
}

/**
 * Función para generar sugerencias simuladas para tareas
 * @param title Título de la tarea
 * @param description Descripción de la tarea (opcional)
 * @returns Sugerencia simulada para la tarea
 */
export function getMockTaskSuggestion(title: string, description?: string): string {
  const timeSlots = [
    "entre 9:00 y 11:00 AM",
    "después del almuerzo, entre 2:00 y 4:00 PM",
    "a primera hora de la mañana, entre 7:00 y 9:00 AM",
    "al final de tu jornada laboral, entre 4:00 y 6:00 PM"
  ];
  
  const durationSuggestions = [
    "30 minutos",
    "1 hora",
    "45 minutos",
    "2 horas divididas en bloques de 30 minutos"
  ];
  
  const preparationTips = [
    "preparar todos los materiales necesarios con antelación",
    "revisar brevemente el contexto 5 minutos antes de comenzar",
    "eliminar posibles distracciones de tu entorno",
    "definir claramente qué resultado esperas obtener"
  ];
  
  const randomTimeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
  const randomDuration = durationSuggestions[Math.floor(Math.random() * durationSuggestions.length)];
  const randomTip = preparationTips[Math.floor(Math.random() * preparationTips.length)];
  
  let taskType = "";
  
  // Determinar el tipo de tarea basado en su título
  const lowercaseTitle = title.toLowerCase();
  if (lowercaseTitle.includes("reunión") || lowercaseTitle.includes("meeting") || lowercaseTitle.includes("llamada")) {
    taskType = "reunión";
  } else if (lowercaseTitle.includes("informe") || lowercaseTitle.includes("reporte") || lowercaseTitle.includes("documento")) {
    taskType = "trabajo de documentación";
  } else if (lowercaseTitle.includes("estudio") || lowercaseTitle.includes("aprender") || lowercaseTitle.includes("leer")) {
    taskType = "actividad de aprendizaje";
  } else if (lowercaseTitle.includes("proyecto") || lowercaseTitle.includes("desarrollar") || lowercaseTitle.includes("crear")) {
    taskType = "proyecto creativo";
  } else {
    taskType = "tarea";
  }
  
  return `
Para optimizar tu "${title}", te sugiero programarla ${randomTimeSlot}.

Basándome en el tipo de ${taskType}, recomendaría dedicarle ${randomDuration} y ${randomTip}.

¿Te gustaría que te ayude a dividir esta tarea en pasos más específicos o a encontrar el mejor momento en tu agenda actual?
`;
}