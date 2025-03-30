import SwiftUI

struct SettingsView: View {
    @AppStorage("isLoggedIn") private var isLoggedIn: Bool = true
    @AppStorage("userId") private var userId: String = ""
    @State private var showConfirmLogout = false
    @State private var showDeleteConfirmation = false
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [Color("BackgroundDark"), Color("BackgroundMedium")]), 
                          startPoint: .topLeading, 
                          endPoint: .bottomTrailing)
                .edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 20) {
                Text("⚙️ Ajustes")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.top, 30)
                
                Spacer()
                
                VStack(spacing: 20) {
                    NavigationLink(destination: PreferencesView()) {
                        SettingRow(icon: "sliders.horizontal", title: "Preferencias de usuario")
                    }
                    
                    NavigationLink(destination: Text("Perfil de Usuario").foregroundColor(.white)) {
                        SettingRow(icon: "person.fill", title: "Perfil de usuario")
                    }
                    
                    NavigationLink(destination: Text("Notificaciones").foregroundColor(.white)) {
                        SettingRow(icon: "bell.fill", title: "Notificaciones")
                    }
                    
                    NavigationLink(destination: TrainAIView()) {
                        SettingRow(icon: "brain", title: "Entrenar IA")
                    }
                    
                    Button(action: {
                        showConfirmLogout = true
                    }) {
                        SettingRow(icon: "arrow.right.square", title: "Cerrar sesión")
                    }
                    
                    Button(action: {
                        showDeleteConfirmation = true
                    }) {
                        SettingRow(icon: "trash.fill", title: "Eliminar cuenta")
                            .foregroundColor(Color.red)
                    }
                }
                .padding(.horizontal)
                
                Spacer()
                
                Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    HStack {
                        Image(systemName: "arrow.left")
                        Text("Volver")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(gradient: Gradient(colors: [Color("DarkRed"), Color("BrightRed")]), 
                                      startPoint: .leading, 
                                      endPoint: .trailing)
                    )
                    .foregroundColor(.white)
                    .cornerRadius(12)
                    .padding(.horizontal)
                    .padding(.bottom, 30)
                }
            }
        }
        .navigationBarTitle("Ajustes", displayMode: .inline)
        .navigationBarHidden(true)
        .alert(isPresented: $showConfirmLogout) {
            Alert(
                title: Text("Cerrar sesión"),
                message: Text("¿Estás seguro que deseas cerrar sesión?"),
                primaryButton: .destructive(Text("Sí, cerrar sesión")) {
                    logout()
                },
                secondaryButton: .cancel(Text("Cancelar"))
            )
        }
        .alert(isPresented: $showDeleteConfirmation) {
            Alert(
                title: Text("Eliminar cuenta"),
                message: Text("Esta acción no se puede deshacer. ¿Estás seguro?"),
                primaryButton: .destructive(Text("Sí, eliminar")) {
                    deleteAccount()
                },
                secondaryButton: .cancel(Text("Cancelar"))
            )
        }
    }
    
    private func logout() {
        isLoggedIn = false
    }
    
    private func deleteAccount() {
        // Eliminar toda la información del usuario
        UserDefaults.standard.removeObject(forKey: "userId")
        UserDefaults.standard.removeObject(forKey: "events")
        isLoggedIn = false
    }
}

struct SettingRow: View {
    let icon: String
    let title: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .frame(width: 36, height: 36)
                .foregroundColor(Color("AccentRed"))
            
            Text(title)
                .font(.headline)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(Color.gray)
        }
        .padding()
        .background(Color("BackgroundDark"))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color("DarkRed"), lineWidth: 1)
        )
    }
}

struct TrainAIView: View {
    @State private var trainingText = ""
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [Color("BackgroundDark"), Color("BackgroundMedium")]), 
                          startPoint: .topLeading, 
                          endPoint: .bottomTrailing)
                .edgesIgnoringSafeArea(.all)
            
            VStack {
                Text("🧠 Entrenar IA")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding()
                
                Text("Proporciona información sobre tus preferencias y rutinas para que la IA pueda adaptarse mejor a tus necesidades.")
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                TextEditor(text: $trainingText)
                    .padding()
                    .background(Color("BackgroundDark"))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color("DarkRed"), lineWidth: 1)
                    )
                    .padding()
                    .foregroundColor(.white)
                
                Button(action: {
                    // Guardar datos de entrenamiento
                    UserDefaults.standard.set(trainingText, forKey: "aiTrainingData")
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Enviar datos de entrenamiento")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            LinearGradient(gradient: Gradient(colors: [Color("DarkRed"), Color("BrightRed")]), 
                                          startPoint: .leading, 
                                          endPoint: .trailing)
                        )
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }
                .padding(.horizontal)
                .padding(.bottom)
            }
        }
        .navigationBarTitle("Entrenar IA", displayMode: .inline)
        .onAppear {
            // Cargar datos de entrenamiento existentes
            trainingText = UserDefaults.standard.string(forKey: "aiTrainingData") ?? ""
        }
    }
}