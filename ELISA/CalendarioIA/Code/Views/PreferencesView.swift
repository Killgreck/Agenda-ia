import SwiftUI

struct PreferencesView: View {
    @AppStorage("theme") private var theme: String = "Dark"
    @AppStorage("notificationsEnabled") private var notificationsEnabled: Bool = true
    @AppStorage("notificationTime") private var notificationTime: Int = 30 // minutos antes
    @AppStorage("defaultView") private var defaultView: String = "Semanal"
    @Environment(\.presentationMode) var presentationMode
    
    let themeOptions = ["Dark", "Light", "Sistema"]
    let notificationTimeOptions = [5, 10, 15, 30, 60, 120]
    let viewOptions = ["Diario", "Semanal", "Mensual"]
    
    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [Color("BackgroundDark"), Color("BackgroundMedium")]), 
                          startPoint: .topLeading, 
                          endPoint: .bottomTrailing)
                .edgesIgnoringSafeArea(.all)
            
            VStack {
                Text("🔧 Preferencias")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.top, 30)
                
                Form {
                    Section(header: Text("Apariencia").foregroundColor(Color("AccentRed"))) {
                        Picker("Tema", selection: $theme) {
                            ForEach(themeOptions, id: \.self) { option in
                                Text(option).tag(option)
                            }
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                    
                    Section(header: Text("Notificaciones").foregroundColor(Color("AccentRed"))) {
                        Toggle("Activar notificaciones", isOn: $notificationsEnabled)
                            .toggleStyle(SwitchToggleStyle(tint: Color("AccentRed")))
                        
                        if notificationsEnabled {
                            HStack {
                                Text("Notificar")
                                Spacer()
                                Picker("", selection: $notificationTime) {
                                    ForEach(notificationTimeOptions, id: \.self) { time in
                                        Text("\(time) min antes").tag(time)
                                    }
                                }
                                .pickerStyle(MenuPickerStyle())
                            }
                        }
                    }
                    
                    Section(header: Text("Vista predeterminada").foregroundColor(Color("AccentRed"))) {
                        Picker("Vista inicial", selection: $defaultView) {
                            ForEach(viewOptions, id: \.self) { option in
                                Text(option).tag(option)
                            }
                        }
                        .pickerStyle(SegmentedPickerStyle())
                    }
                }
                .scrollContentBackground(.hidden)
                
                Button(action: {
                    presentationMode.wrappedValue.dismiss()
                }) {
                    Text("Guardar cambios")
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
                .padding()
            }
        }
        .navigationBarTitle("Preferencias", displayMode: .inline)
    }
}

extension View {
    func formSectionStyle() -> some View {
        self
            .listRowBackground(Color("BackgroundDark"))
            .foregroundColor(.white)
    }
}