import UIKit
import UserNotifications

class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        // Configurar notificaciones
        requestNotificationAuthorization()
        
        // Configurar apariencia global
        setupAppearance()
        
        return true
    }
    
    func requestNotificationAuthorization() {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("Notificaciones autorizadas")
            } else if let error = error {
                print("Error al solicitar autorización: \(error.localizedDescription)")
            }
        }
    }
    
    func setupAppearance() {
        // Configurar apariencia de la barra de navegación
        let navigationBarAppearance = UINavigationBarAppearance()
        navigationBarAppearance.configureWithOpaqueBackground()
        navigationBarAppearance.backgroundColor = UIColor(named: "BackgroundDark")
        navigationBarAppearance.titleTextAttributes = [.foregroundColor: UIColor.white]
        navigationBarAppearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
        
        UINavigationBar.appearance().standardAppearance = navigationBarAppearance
        UINavigationBar.appearance().compactAppearance = navigationBarAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navigationBarAppearance
        UINavigationBar.appearance().tintColor = UIColor(named: "AccentRed")
        
        // Configurar tema oscuro para el estilo samurai
        if #available(iOS 13.0, *) {
            UIApplication.shared.windows.forEach { window in
                window.overrideUserInterfaceStyle = .dark
            }
        }
    }
    
    // Manejar notificaciones cuando la app está en primer plano
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
    
    // Manejar cuando el usuario interactúa con una notificación
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        // Navegar a un evento específico basado en la notificación
        if let eventId = response.notification.request.content.userInfo["eventId"] as? String {
            NotificationCenter.default.post(name: NSNotification.Name("OpenEvent"), object: nil, userInfo: ["eventId": eventId])
        }
        completionHandler()
    }
}