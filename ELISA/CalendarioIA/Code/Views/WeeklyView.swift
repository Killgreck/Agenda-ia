import SwiftUI

struct WeeklyView: View {
    @State private var events: [Event] = []
    @State private var showModal = false
    @State private var userId: String = "USER"
    
    let days = ["L", "M", "Mi", "J", "V", "S", "D"]
    let hours = Array(1...24).map { "\($0):00" }
    
    var body: some View {
        NavigationView {
            ZStack {
                LinearGradient(gradient: Gradient(colors: [Color("BackgroundDark"), Color("BackgroundMedium")]), 
                              startPoint: .topLeading, 
                              endPoint: .bottomTrailing)
                    .edgesIgnoringSafeArea(.all)
                
                VStack {
                    Text("Hola, \(userId) 👋")
                        .font(.title)
                        .foregroundColor(.white)
                        .padding(.top)
                    
                    ScrollView([.horizontal, .vertical], showsIndicators: true) {
                        VStack(alignment: .leading, spacing: 0) {
                            // Header row
                            HStack(spacing: 0) {
                                Text("Hora")
                                    .frame(width: 60, height: 40)
                                    .background(Color("BackgroundDark"))
                                    .foregroundColor(.white)
                                    .border(Color("DarkRed"), width: 1)
                                
                                ForEach(days, id: \.self) { day in
                                    Text(day)
                                        .frame(width: 80, height: 40)
                                        .background(Color("BackgroundDark"))
                                        .foregroundColor(.white)
                                        .border(Color("DarkRed"), width: 1)
                                }
                            }
                            
                            // Time slots
                            ForEach(hours, id: \.self) { hour in
                                HStack(spacing: 0) {
                                    Text(hour)
                                        .frame(width: 60, height: 60)
                                        .background(Color("BackgroundDark"))
                                        .foregroundColor(.white)
                                        .border(Color("DarkRed"), width: 1)
                                    
                                    ForEach(days, id: \.self) { day in
                                        ZStack {
                                            Rectangle()
                                                .fill(Color("BackgroundDark"))
                                                .frame(width: 80, height: 60)
                                                .border(Color("DarkRed"), width: 1)
                                            
                                            VStack {
                                                ForEach(eventsFor(day: day, hour: hour), id: \.id) { event in
                                                    Text(event.title)
                                                        .font(.caption)
                                                        .padding(4)
                                                        .background(Color("DarkRed"))
                                                        .foregroundColor(.white)
                                                        .cornerRadius(4)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    HStack(spacing: 10) {
                        NavigationLink(destination: AddEventView(events: $events)) {
                            HStack {
                                Image(systemName: "plus")
                                Text("Agregar Tarea")
                            }
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(
                                LinearGradient(gradient: Gradient(colors: [Color("DarkRed"), Color("BrightRed")]), 
                                              startPoint: .leading, 
                                              endPoint: .trailing)
                            )
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        
                        NavigationLink(destination: SettingsView()) {
                            HStack {
                                Image(systemName: "gear")
                                Text("Ajustes")
                            }
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(
                                LinearGradient(gradient: Gradient(colors: [Color("DarkRed"), Color("BrightRed")]), 
                                              startPoint: .leading, 
                                              endPoint: .trailing)
                            )
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }
                    .padding()
                    
                    HStack(spacing: 10) {
                        Button(action: {
                            showModal = true
                        }) {
                            HStack {
                                Image(systemName: "calendar")
                                Text("Periodo")
                            }
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.clear)
                            .foregroundColor(Color("AccentRed"))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color("AccentRed"), lineWidth: 2)
                            )
                        }
                        
                        NavigationLink(destination: PreferencesView()) {
                            HStack {
                                Image(systemName: "wrench")
                                Text("Preferencias")
                            }
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.clear)
                            .foregroundColor(Color("AccentRed"))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color("AccentRed"), lineWidth: 2)
                            )
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom)
                }
            }
            .navigationBarHidden(true)
            .onAppear {
                loadEvents()
                loadUserId()
            }
            .sheet(isPresented: $showModal) {
                PeriodSelectionView()
            }
        }
    }
    
    func eventsFor(day: String, hour: String) -> [Event] {
        return events.filter { $0.day == day && $0.hour == hour }
    }
    
    func loadEvents() {
        if let data = UserDefaults.standard.data(forKey: "events"),
           let savedEvents = try? JSONDecoder().decode([Event].self, from: data) {
            events = savedEvents
        }
    }
    
    func loadUserId() {
        if let id = UserDefaults.standard.string(forKey: "userId") {
            userId = id
        }
    }
}

struct PeriodSelectionView: View {
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        ZStack {
            Color("BackgroundDark").edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 20) {
                Text("Selecciona un periodo:")
                    .font(.title2)
                    .foregroundColor(.white)
                
                Button("Día") {
                    // Acción
                    presentationMode.wrappedValue.dismiss()
                }
                .buttonStyle(SamuraiButtonStyle())
                
                Button("Mes") {
                    // Acción
                    presentationMode.wrappedValue.dismiss()
                }
                .buttonStyle(SamuraiButtonStyle())
                
                Button("Año") {
                    // Acción
                    presentationMode.wrappedValue.dismiss()
                }
                .buttonStyle(SamuraiButtonStyle())
                
                Button("Cerrar") {
                    presentationMode.wrappedValue.dismiss()
                }
                .buttonStyle(SamuraiOutlineButtonStyle())
            }
            .padding(30)
            .background(Color("BackgroundMedium"))
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color("DarkRed"), lineWidth: 2)
            )
            .shadow(color: Color.black.opacity(0.5), radius: 20)
        }
    }
}

struct SamuraiButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding()
            .frame(width: 200)
            .background(
                LinearGradient(gradient: Gradient(colors: [Color("DarkRed"), Color("BrightRed")]), 
                              startPoint: .leading, 
                              endPoint: .trailing)
                    .opacity(configuration.isPressed ? 0.8 : 1)
            )
            .foregroundColor(.white)
            .cornerRadius(12)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct SamuraiOutlineButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding()
            .frame(width: 200)
            .background(Color.clear)
            .foregroundColor(Color("AccentRed"))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color("AccentRed"), lineWidth: 2)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct Event: Codable, Identifiable {
    var id = UUID()
    var title: String
    var day: String
    var hour: String
    
    enum CodingKeys: String, CodingKey {
        case title = "event"
        case day, hour
    }
}