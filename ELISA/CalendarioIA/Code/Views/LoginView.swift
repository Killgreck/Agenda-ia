import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var showPassword = false
    @State private var isCreatingAccount = false
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [Color("BackgroundDark"), Color("BackgroundMedium")]), 
                          startPoint: .topLeading, 
                          endPoint: .bottomTrailing)
                .edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 25) {
                Text("Calendario IA")
                    .font(.system(size: 42, weight: .bold))
                    .foregroundColor(Color("AccentRed"))
                    .shadow(color: Color("ShadowRed"), radius: 6, x: 2, y: 2)
                
                VStack(spacing: 15) {
                    if isCreatingAccount {
                        TextField("Nombre de usuario", text: $username)
                            .textFieldStyle(SamuraiTextFieldStyle())
                    }
                    
                    TextField("Correo electrónico", text: $email)
                        .textFieldStyle(SamuraiTextFieldStyle())
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    HStack {
                        if showPassword {
                            TextField("Contraseña", text: $password)
                                .textFieldStyle(SamuraiTextFieldStyle())
                        } else {
                            SecureField("Contraseña", text: $password)
                                .textFieldStyle(SamuraiTextFieldStyle())
                        }
                        
                        Button(action: {
                            showPassword.toggle()
                        }) {
                            Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                                .foregroundColor(Color("AccentRed"))
                        }
                    }
                    
                    Button(action: handleLogin) {
                        Text(isCreatingAccount ? "Crear cuenta" : "Iniciar sesión")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                LinearGradient(gradient: Gradient(colors: [Color("DarkRed"), Color("BrightRed")]), 
                                              startPoint: .leading, 
                                              endPoint: .trailing)
                            )
                            .foregroundColor(.white)
                            .cornerRadius(12)
                            .shadow(color: Color("ShadowRed").opacity(0.5), radius: 5, x: 0, y: 3)
                    }
                }
                .padding(.horizontal, 25)
                
                Button(action: {
                    withAnimation {
                        isCreatingAccount.toggle()
                    }
                }) {
                    Text(isCreatingAccount ? "¿Ya tienes una cuenta? Inicia sesión" : "¿No tienes cuenta? Crea una")
                        .foregroundColor(Color("AccentRed"))
                        .underline()
                }
                
                if !isCreatingAccount {
                    Button(action: {
                        // Recuperar contraseña
                    }) {
                        Text("¿Olvidaste tu contraseña?")
                            .foregroundColor(Color("AccentRed"))
                            .underline()
                    }
                }
            }
            .padding(.vertical, 40)
        }
    }
    
    func handleLogin() {
        // Lógica de login similar a tu versión React
        if isCreatingAccount {
            // Guardar usuario
            UserDefaults.standard.set(username, forKey: "userId")
            isCreatingAccount = false
            username = ""
            email = ""
            password = ""
        } else {
            // Verificar login
            if UserDefaults.standard.string(forKey: "userId") != nil {
                // Navegar a WeeklyView
            }
        }
    }
}

struct SamuraiTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color("BackgroundDark"))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color("DarkRed"), lineWidth: 2)
            )
            .foregroundColor(.white)
    }
}