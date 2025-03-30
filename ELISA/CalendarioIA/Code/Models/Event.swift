import Foundation

struct Event: Identifiable, Codable, Equatable {
    var id: UUID
    var title: String
    var day: String
    var hour: String
    var description: String?
    var isCompleted: Bool
    var priority: Priority
    var color: String?
    var notifications: [NotificationTime]?
    var createdAt: Date
    var updatedAt: Date
    
    enum Priority: String, Codable, CaseIterable {
        case low = "low"
        case medium = "medium"
        case high = "high"
        
        var displayName: String {
            switch self {
            case .low: return "Baja"
            case .medium: return "Media"
            case .high: return "Alta"
            }
        }
        
        var color: String {
            switch self {
            case .low: return "GreenAccent"
            case .medium: return "YellowAccent"
            case .high: return "AccentRed"
            }
        }
    }
    
    struct NotificationTime: Codable, Equatable {
        var minutes: Int
        var isEnabled: Bool
    }
    
    // Inicializador completo
    init(id: UUID = UUID(), 
         title: String, 
         day: String, 
         hour: String, 
         description: String? = nil, 
         isCompleted: Bool = false, 
         priority: Priority = .medium,
         color: String? = nil,
         notifications: [NotificationTime]? = nil,
         createdAt: Date = Date(),
         updatedAt: Date = Date()) {
        self.id = id
        self.title = title
        self.day = day
        self.hour = hour
        self.description = description
        self.isCompleted = isCompleted
        self.priority = priority
        self.color = color
        self.notifications = notifications
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    // Inicializador simple para compatibilidad con versión anterior
    init(title: String, day: String, hour: String) {
        self.id = UUID()
        self.title = title
        self.day = day
        self.hour = hour
        self.description = nil
        self.isCompleted = false
        self.priority = .medium
        self.color = nil
        self.notifications = nil
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    // Para conversión desde el formato antiguo (para migración de datos)
    static func fromLegacyFormat(_ dict: [String: Any]) -> Event? {
        guard let title = dict["event"] as? String,
              let day = dict["day"] as? String,
              let hour = dict["hour"] as? String else {
            return nil
        }
        
        return Event(title: title, day: day, hour: hour)
    }
    
    // Métodos útiles
    mutating func markAsCompleted() {
        self.isCompleted = true
        self.updatedAt = Date()
    }
    
    mutating func updateTitle(_ newTitle: String) {
        self.title = newTitle
        self.updatedAt = Date()
    }
    
    mutating func addNotification(minutes: Int) {
        if self.notifications == nil {
            self.notifications = []
        }
        
        self.notifications?.append(NotificationTime(minutes: minutes, isEnabled: true))
        self.updatedAt = Date()
    }
    
    static func == (lhs: Event, rhs: Event) -> Bool {
        return lhs.id == rhs.id
    }
}

// Extiende Array para funciones auxiliares con Eventos
extension Array where Element == Event {
    func filtered(byDay day: String? = nil, 
                 byHour hour: String? = nil, 
                 completed: Bool? = nil,
                 priority: Event.Priority? = nil) -> [Event] {
        
        return self.filter { event in
            var shouldInclude = true
            
            if let day = day {
                shouldInclude = shouldInclude && event.day == day
            }
            
            if let hour = hour {
                shouldInclude = shouldInclude && event.hour == hour
            }
            
            if let completed = completed {
                shouldInclude = shouldInclude && event.isCompleted == completed
            }
            
            if let priority = priority {
                shouldInclude = shouldInclude && event.priority == priority
            }
            
            return shouldInclude
        }
    }
    
    func sortedByPriority() -> [Event] {
        return self.sorted { 
            if $0.priority == $1.priority {
                return $0.hour < $1.hour
            }
            
            if $0.priority == .high { return true }
            if $1.priority == .high { return false }
            if $0.priority == .medium { return true }
            
            return false
        }
    }
}