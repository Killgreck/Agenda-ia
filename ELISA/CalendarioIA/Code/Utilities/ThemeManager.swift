import SwiftUI

/// Gestor central para los temas y estilos visuales de la aplicación
class ThemeManager: ObservableObject {
    static let shared = ThemeManager()
    
    // Configuración actual
    @Published var currentTheme: ThemeType
    @Published var prefersDarkMode: Bool
    
    // Define los tipos de temas disponibles
    enum ThemeType: String, CaseIterable {
        case samurai = "samurai"
        case modern = "modern"
        case light = "light"
        
        var displayName: String {
            switch self {
            case .samurai: return "Samurai"
            case .modern: return "Moderno"
            case .light: return "Claro"
            }
        }
    }
    
    // Inicializa con valores predeterminados
    private init() {
        if let themeName = UserDefaults.standard.string(forKey: "theme"),
           let theme = ThemeType(rawValue: themeName) {
            self.currentTheme = theme
        } else {
            self.currentTheme = .samurai
        }
        
        self.prefersDarkMode = UserDefaults.standard.bool(forKey: "darkMode")
        
        // En ausencia de ajuste explícito, usa el tema Samurai con modo oscuro
        if !UserDefaults.standard.contains(key: "darkMode") {
            self.prefersDarkMode = true
        }
    }
    
    // MARK: - Métodos para cambiar el tema
    
    /// Cambia al tema especificado
    func setTheme(_ theme: ThemeType) {
        self.currentTheme = theme
        UserDefaults.standard.set(theme.rawValue, forKey: "theme")
    }
    
    /// Cambia preferencia de modo oscuro/claro
    func setDarkMode(_ enabled: Bool) {
        self.prefersDarkMode = enabled
        UserDefaults.standard.set(enabled, forKey: "darkMode")
    }
    
    // MARK: - Colores
    
    /// Obtiene el esquema de colores para el tema actual
    var colorScheme: ColorScheme? {
        if currentTheme == .light {
            return .light
        } else if prefersDarkMode {
            return .dark
        }
        return nil // Usar la configuración del sistema
    }
    
    /// Define los colores para el tema Samurai
    struct SamuraiColors {
        // Fondos
        static let backgroundDark = Color("BackgroundDark", bundle: nil)
        static let backgroundMedium = Color("BackgroundMedium", bundle: nil)
        
        // Acentos
        static let accentRed = Color("AccentRed", bundle: nil)
        static let darkRed = Color("DarkRed", bundle: nil)
        static let brightRed = Color("BrightRed", bundle: nil)
        
        // Utilitarios
        static let shadowRed = Color("ShadowRed", bundle: nil)
        
        // Otros colores
        static let success = Color("GreenAccent", bundle: nil)
        static let warning = Color("YellowAccent", bundle: nil)
        static let error = Color("AccentRed", bundle: nil)
        
        // Texto
        static let textPrimary = Color.white
        static let textSecondary = Color.gray
        
        // Gradientes
        static func primaryGradient() -> LinearGradient {
            LinearGradient(
                gradient: Gradient(colors: [darkRed, brightRed]),
                startPoint: .leading,
                endPoint: .trailing
            )
        }
        
        static func backgroundGradient() -> LinearGradient {
            LinearGradient(
                gradient: Gradient(colors: [backgroundDark, backgroundMedium]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
    
    // MARK: - Dimensiones y Espaciados
    
    struct Spacing {
        static let small: CGFloat = 8
        static let medium: CGFloat = 16
        static let large: CGFloat = 24
        static let xlarge: CGFloat = 32
    }
    
    struct CornerRadius {
        static let small: CGFloat = 8
        static let medium: CGFloat = 12
        static let large: CGFloat = 16
    }
    
    struct FontSize {
        static let caption: CGFloat = 12
        static let body: CGFloat = 16
        static let title3: CGFloat = 20
        static let title2: CGFloat = 24
        static let title1: CGFloat = 28
        static let largeTitle: CGFloat = 34
    }
    
    // MARK: - Animaciones
    
    struct Animation {
        static let standard = SwiftUI.Animation.easeInOut(duration: 0.2)
        static let slow = SwiftUI.Animation.easeInOut(duration: 0.4)
        static let spring = SwiftUI.Animation.spring(response: 0.4, dampingFraction: 0.7)
    }
    
    // MARK: - Utilidades
    
    /// Genera un color aleatorio con la estética samurai
    func randomSamuraiColor() -> Color {
        let colors = [
            SamuraiColors.darkRed,
            SamuraiColors.brightRed,
            SamuraiColors.accentRed
        ]
        return colors.randomElement() ?? SamuraiColors.accentRed
    }
    
    /// Devuelve una imagen de sistema con el color apropiado para el tema
    func systemIcon(_ name: String) -> some View {
        Image(systemName: name)
            .foregroundColor(SamuraiColors.accentRed)
    }
    
    /// Aplica el estilo visual base a una vista
    func applySamuraiStyle<T: View>(_ content: T) -> some View {
        content
            .preferredColorScheme(colorScheme)
            .accentColor(SamuraiColors.accentRed)
    }
}

// MARK: - Extensiones para ViewModifiers
extension View {
    /// Aplica el fondo del tema samurai a una vista
    func samuraiBackground() -> some View {
        self.background(ThemeManager.SamuraiColors.backgroundGradient().edgesIgnoringSafeArea(.all))
    }
    
    /// Aplica un borde al estilo samurai
    func samuraiBorder() -> some View {
        self.overlay(
            RoundedRectangle(cornerRadius: ThemeManager.CornerRadius.medium)
                .stroke(ThemeManager.SamuraiColors.darkRed, lineWidth: 1)
        )
    }
    
    /// Aplica estilo de tarjeta samurai
    func samuraiCard() -> some View {
        self
            .padding()
            .background(ThemeManager.SamuraiColors.backgroundDark)
            .cornerRadius(ThemeManager.CornerRadius.medium)
            .samuraiBorder()
            .shadow(color: Color.black.opacity(0.2), radius: 5)
    }
    
    /// Aplica estilo de texto primario
    func samuraiTextPrimary() -> some View {
        self.foregroundColor(ThemeManager.SamuraiColors.textPrimary)
    }
    
    /// Aplica estilo de texto secundario
    func samuraiTextSecondary() -> some View {
        self.foregroundColor(ThemeManager.SamuraiColors.textSecondary)
    }
}