import Foundation
import SwiftUI

class User: ObservableObject, Codable {
    @Published var id: String
    @Published var username: String
    @Published var email: String?
    @Published var profileImageName: String?
    @Published var preferences: Preferences
    @Published var statistics: Statistics
    @Published var lastLogin: Date
    
    enum CodingKeys: String, CodingKey {
        case id, username, email, profileImageName, preferences, statistics, lastLogin
    }
    
    init(id: String = UUID().uuidString,
         username: String,
         email: String? = nil,
         profileImageName: String? = nil,
         preferences: Preferences = Preferences(),
         statistics: Statistics = Statistics(),
         lastLogin: Date = Date()) {
        self.id = id
        self.username = username
        self.email = email
        self.profileImageName = profileImageName
        self.preferences = preferences
        self.statistics = statistics
        self.lastLogin = lastLogin
    }
    
    // Codable conformance
    required init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        username = try container.decode(String.self, forKey: .username)
        email = try container.decodeIfPresent(String.self, forKey: .email)
        profileImageName = try container.decodeIfPresent(String.self, forKey: .profileImageName)
        preferences = try container.decode(Preferences.self, forKey: .preferences)
        statistics = try container.decode(Statistics.self, forKey: .statistics)
        lastLogin = try container.decode(Date.self, forKey: .lastLogin)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(username, forKey: .username)
        try container.encodeIfPresent(email, forKey: .email)
        try container.encodeIfPresent(profileImageName, forKey: .profileImageName)
        try container.encode(preferences, forKey: .preferences)
        try container.encode(statistics, forKey: .statistics)
        try container.encode(lastLogin, forKey: .lastLogin)
    }
    
    // Actualiza el tiempo de login
    func updateLoginTime() {
        self.lastLogin = Date()
    }
    
    // Métodos para guardar/cargar el usuario desde UserDefaults
    func save() {
        if let encoded = try? JSONEncoder().encode(self) {
            UserDefaults.standard.set(encoded, forKey: "user")
        }
    }
    
    static func load() -> User? {
        if let userData = UserDefaults.standard.data(forKey: "user"),
           let user = try? JSONDecoder().decode(User.self, from: userData) {
            return user
        }
        return nil
    }
    
    // Migración desde el formato antiguo
    static func migrateFromLegacy() -> User? {
        if let userId = UserDefaults.standard.string(forKey: "userId") {
            return User(username: userId)
        }
        return nil
    }
}

// Estructura para preferencias de usuario
struct Preferences: Codable {
    var theme: Theme
    var notificationsEnabled: Bool
    var defaultNotificationTime: Int // minutos antes
    var defaultView: ViewType
    var weekStartsOn: WeekDay
    var colorScheme: ColorSchemePreference
    var aiAssistEnabled: Bool
    var hapticFeedbackEnabled: Bool
    var language: String
    
    enum Theme: String, Codable, CaseIterable {
        case samurai = "samurai"
        case modern = "modern"
        case light = "light"
        case system = "system"
        
        var displayName: String {
            switch self {
            case .samurai: return "Samurai (Oscuro)"
            case .modern: return "Moderno"
            case .light: return "Claro"
            case .system: return "Sistema"
            }
        }
    }
    
    enum ViewType: String, Codable, CaseIterable {
        case daily = "daily"
        case weekly = "weekly"
        case monthly = "monthly"
        
        var displayName: String {
            switch self {
            case .daily: return "Diaria"
            case .weekly: return "Semanal"
            case .monthly: return "Mensual"
            }
        }
    }
    
    enum WeekDay: Int, Codable, CaseIterable {
        case sunday = 0
        case monday = 1
        
        var displayName: String {
            switch self {
            case .sunday: return "Domingo"
            case .monday: return "Lunes"
            }
        }
    }
    
    enum ColorSchemePreference: String, Codable, CaseIterable {
        case dark = "dark"
        case light = "light"
        case system = "system"
        
        var displayName: String {
            switch self {
            case .dark: return "Oscuro"
            case .light: return "Claro"
            case .system: return "Sistema"
            }
        }
        
        var colorScheme: ColorScheme? {
            switch self {
            case .dark: return .dark
            case .light: return .light
            case .system: return nil
            }
        }
    }
    
    init(theme: Theme = .samurai,
         notificationsEnabled: Bool = true,
         defaultNotificationTime: Int = 30,
         defaultView: ViewType = .weekly,
         weekStartsOn: WeekDay = .monday,
         colorScheme: ColorSchemePreference = .dark,
         aiAssistEnabled: Bool = true,
         hapticFeedbackEnabled: Bool = true,
         language: String = "es") {
        self.theme = theme
        self.notificationsEnabled = notificationsEnabled
        self.defaultNotificationTime = defaultNotificationTime
        self.defaultView = defaultView
        self.weekStartsOn = weekStartsOn
        self.colorScheme = colorScheme
        self.aiAssistEnabled = aiAssistEnabled
        self.hapticFeedbackEnabled = hapticFeedbackEnabled
        self.language = language
    }
}

// Estructura para estadísticas de usuario
struct Statistics: Codable {
    var totalEvents: Int
    var completedEvents: Int
    var missedEvents: Int
    var streakDays: Int
    var mostProductiveDay: String?
    var lastActivity: Date?
    
    init(totalEvents: Int = 0,
         completedEvents: Int = 0,
         missedEvents: Int = 0,
         streakDays: Int = 0,
         mostProductiveDay: String? = nil,
         lastActivity: Date? = nil) {
        self.totalEvents = totalEvents
        self.completedEvents = completedEvents
        self.missedEvents = missedEvents
        self.streakDays = streakDays
        self.mostProductiveDay = mostProductiveDay
        self.lastActivity = lastActivity
    }
    
    // Método para calcular la tasa de finalización
    var completionRate: Double {
        guard totalEvents > 0 else { return 0.0 }
        return Double(completedEvents) / Double(totalEvents)
    }
    
    // Actualiza las estadísticas al completar un evento
    mutating func eventCompleted() {
        completedEvents += 1
        lastActivity = Date()
    }
    
    // Actualiza las estadísticas al crear un evento
    mutating func eventCreated() {
        totalEvents += 1
        lastActivity = Date()
    }
    
    // Actualiza las estadísticas al perder un evento
    mutating func eventMissed() {
        missedEvents += 1
        lastActivity = Date()
    }
}