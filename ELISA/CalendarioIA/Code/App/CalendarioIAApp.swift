import SwiftUI

@main
struct CalendarioIAApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @AppStorage("isLoggedIn") private var isLoggedIn: Bool = false
    
    var body: some Scene {
        WindowGroup {
            if isLoggedIn {
                WeeklyView()
            } else {
                LoginView()
                    .onAppear {
                        // Verificar si el usuario ya tiene credenciales guardadas
                        if UserDefaults.standard.string(forKey: "userId") != nil {
                            isLoggedIn = true
                        }
                    }
            }
        }
    }
}