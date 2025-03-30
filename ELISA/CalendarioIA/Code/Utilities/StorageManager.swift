import Foundation
import Combine

/// Gestor centralizado para la persistencia de datos en la aplicación
class StorageManager: ObservableObject {
    static let shared = StorageManager()
    
    // Publishers para notificar cambios en los datos
    @Published var currentUser: User?
    @Published var events: [Event] = []
    
    // Claves para UserDefaults
    private enum StorageKeys {
        static let events = "events"
        static let user = "user"
        static let trainingData = "aiTrainingData"
        static let isLoggedIn = "isLoggedIn"
        static let userId = "userId"  // Clave legacy
    }
    
    private init() {
        loadUser()
        loadEvents()
    }
    
    // MARK: - Métodos de Usuario
    
    /// Carga el usuario actual desde el almacenamiento
    func loadUser() {
        // Intentar cargar del formato nuevo
        if let user = User.load() {
            self.currentUser = user
            return
        }
        
        // Intentar migrar desde formato antiguo
        if let legacyUser = User.migrateFromLegacy() {
            self.currentUser = legacyUser
            saveUser()
        }
    }
    
    /// Guarda el usuario actual en el almacenamiento
    func saveUser() {
        currentUser?.save()
        UserDefaults.standard.set(currentUser != nil, forKey: StorageKeys.isLoggedIn)
    }
    
    /// Crea un nuevo usuario
    func createUser(username: String, email: String? = nil) -> User {
        let newUser = User(username: username, email: email)
        self.currentUser = newUser
        saveUser()
        return newUser
    }
    
    /// Actualiza las preferencias del usuario
    func updateUserPreferences(_ preferences: Preferences) {
        guard var user = currentUser else { return }
        user.preferences = preferences
        currentUser = user
        saveUser()
    }
    
    /// Cierra la sesión del usuario actual
    func logout() {
        UserDefaults.standard.set(false, forKey: StorageKeys.isLoggedIn)
    }
    
    /// Elimina la cuenta del usuario actual y todos sus datos
    func deleteAccount() {
        UserDefaults.standard.removeObject(forKey: StorageKeys.user)
        UserDefaults.standard.removeObject(forKey: StorageKeys.events)
        UserDefaults.standard.removeObject(forKey: StorageKeys.userId)  // Eliminar también formato legacy
        UserDefaults.standard.set(false, forKey: StorageKeys.isLoggedIn)
        
        self.currentUser = nil
        self.events = []
    }
    
    // MARK: - Métodos de Eventos
    
    /// Carga todos los eventos desde el almacenamiento
    func loadEvents() {
        if let data = UserDefaults.standard.data(forKey: StorageKeys.events) {
            do {
                let decodedEvents = try JSONDecoder().decode([Event].self, from: data)
                self.events = decodedEvents
            } catch {
                print("Error decodificando eventos: \(error.localizedDescription)")
                self.events = []
                
                // Intenta migrar desde formato antiguo si hay un error
                migrateEventsFromLegacy()
            }
        } else {
            // No hay eventos guardados, intenta migrar del formato antiguo
            migrateEventsFromLegacy()
        }
    }
    
    /// Guarda todos los eventos en el almacenamiento
    func saveEvents() {
        do {
            let encodedData = try JSONEncoder().encode(events)
            UserDefaults.standard.set(encodedData, forKey: StorageKeys.events)
        } catch {
            print("Error codificando eventos: \(error.localizedDescription)")
        }
    }
    
    /// Agrega un nuevo evento
    func addEvent(_ event: Event) {
        events.append(event)
        
        // Actualizar estadísticas
        if var user = currentUser {
            user.statistics.eventCreated()
            currentUser = user
            saveUser()
        }
        
        saveEvents()
    }
    
    /// Actualiza un evento existente
    func updateEvent(_ event: Event) {
        if let index = events.firstIndex(where: { $0.id == event.id }) {
            events[index] = event
            saveEvents()
        }
    }
    
    /// Elimina un evento
    func deleteEvent(id: UUID) {
        events.removeAll { $0.id == id }
        saveEvents()
    }
    
    /// Marca un evento como completado
    func completeEvent(id: UUID) {
        if let index = events.firstIndex(where: { $0.id == id }) {
            var updatedEvent = events[index]
            updatedEvent.isCompleted = true
            updatedEvent.updatedAt = Date()
            events[index] = updatedEvent
            
            // Actualizar estadísticas
            if var user = currentUser {
                user.statistics.eventCompleted()
                currentUser = user
                saveUser()
            }
            
            saveEvents()
        }
    }
    
    // MARK: - Entrenamiento IA
    
    /// Guarda datos de entrenamiento para la IA
    func saveTrainingData(_ data: String) {
        UserDefaults.standard.set(data, forKey: StorageKeys.trainingData)
    }
    
    /// Recupera datos de entrenamiento para la IA
    func getTrainingData() -> String {
        return UserDefaults.standard.string(forKey: StorageKeys.trainingData) ?? ""
    }
    
    // MARK: - Métodos de Migración
    
    /// Migra eventos desde el formato antiguo
    private func migrateEventsFromLegacy() {
        // Formato antiguo en localStorage de React
        if let legacyEventsData = UserDefaults.standard.array(forKey: "events") as? [[String: Any]] {
            var migratedEvents: [Event] = []
            
            for legacyEvent in legacyEventsData {
                if let event = Event.fromLegacyFormat(legacyEvent) {
                    migratedEvents.append(event)
                }
            }
            
            if !migratedEvents.isEmpty {
                self.events = migratedEvents
                saveEvents()
                print("Migrados \(migratedEvents.count) eventos del formato antiguo")
            }
        }
    }
    
    // MARK: - Métodos de Utilidad
    
    /// Limpia todos los datos guardados (para desarrollo y pruebas)
    func clearAllData() {
        UserDefaults.standard.removeObject(forKey: StorageKeys.events)
        UserDefaults.standard.removeObject(forKey: StorageKeys.user)
        UserDefaults.standard.removeObject(forKey: StorageKeys.trainingData)
        UserDefaults.standard.removeObject(forKey: StorageKeys.userId)
        UserDefaults.standard.removeObject(forKey: StorageKeys.isLoggedIn)
        
        self.currentUser = nil
        self.events = []
    }
    
    /// Obtiene eventos filtrados según los criterios especificados
    func getFilteredEvents(day: String? = nil, 
                          hour: String? = nil,
                          completed: Bool? = nil,
                          priority: Event.Priority? = nil) -> [Event] {
        return events.filtered(byDay: day, byHour: hour, completed: completed, priority: priority)
    }
    
    /// Obtiene eventos para un día y hora específicos
    func getEventsFor(day: String, hour: String) -> [Event] {
        return events.filter { $0.day == day && $0.hour == hour }
    }
}