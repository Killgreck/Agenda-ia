import SwiftUI

struct AddEventView: View {
    @Binding var events: [Event]
    @State private var eventTitle = ""
    @State private var selectedDay = "L"
    @State private var selectedHour = "1:00"
    @State private var editingEventIndex: Int? = nil
    @Environment(\.presentationMode) var presentationMode
    
    let days = ["L", "M", "Mi", "J", "V", "S", "D"]
    let hours = Array(1...24).map { "\($0):00" }
    
    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [Color("BackgroundDark"), Color("BackgroundMedium")]), 
                          startPoint: .topLeading, 
                          endPoint: .bottomTrailing)
                .edgesIgnoringSafeArea(.all)
            
            ScrollView {
                VStack(spacing: 20) {
                    Text("📌 ¿Qué quieres añadir a tu itinerario?")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding(.top)
                        .padding(.horizontal)
                    
                    TextField("Describe tu evento...", text: $eventTitle)
                        .textFieldStyle(SamuraiTextFieldStyle())
                        .padding(.horizontal)
                    
                    HStack {
                        Picker("Día", selection: $selectedDay) {
                            ForEach(days, id: \.self) { day in
                                Text(day).tag(day)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color("BackgroundDark"))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color("DarkRed"), lineWidth: 2)
                        )
                        
                        Picker("Hora", selection: $selectedHour) {
                            ForEach(hours, id: \.self) { hour in
                                Text(hour).tag(hour)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color("BackgroundDark"))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color("DarkRed"), lineWidth: 2)
                        )
                    }
                    .padding(.horizontal)
                    
                    HStack(spacing: 15) {
                        Button(action: handleAddOrEditEvent) {
                            HStack {
                                Image(systemName: editingEventIndex != nil ? "pencil" : "plus")
                                Text(editingEventIndex != nil ? "✏️ Editar" : "➕ Agregar")
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
                        }
                        
                        Button(action: {
                            presentationMode.wrappedValue.dismiss()
                        }) {
                            HStack {
                                Image(systemName: "arrow.left")
                                Text("⬅️ Salir")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.clear)
                            .foregroundColor(Color("AccentRed"))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color("AccentRed"), lineWidth: 2)
                            )
                        }
                    }
                    .padding(.horizontal)
                    
                    Text("🗓️ Eventos Programados")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.top, 20)
                    
                    LazyVStack(spacing: 12) {
                        ForEach(events.indices, id: \.self) { index in
                            EventRow(event: events[index], 
                                    onEdit: { handleEventEdit(index: index) }, 
                                    onDelete: { handleEventDelete(index: index) })
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.bottom, 30)
            }
        }
        .navigationBarTitle("Agregar Evento", displayMode: .inline)
        .onDisappear {
            saveEvents()
        }
    }
    
    private func handleAddOrEditEvent() {
        guard !eventTitle.isEmpty else {
            // Mostrar alerta
            return
        }
        
        let newEvent = Event(title: eventTitle, day: selectedDay, hour: selectedHour)
        
        if let index = editingEventIndex {
            events[index] = newEvent
            editingEventIndex = nil
        } else {
            events.append(newEvent)
        }
        
        // Limpiar campos
        eventTitle = ""
        selectedDay = "L"
        selectedHour = "1:00"
        
        saveEvents()
    }
    
    private func handleEventEdit(index: Int) {
        let event = events[index]
        eventTitle = event.title
        selectedDay = event.day
        selectedHour = event.hour
        editingEventIndex = index
    }
    
    private func handleEventDelete(index: Int) {
        events.remove(at: index)
        saveEvents()
    }
    
    private func saveEvents() {
        if let encoded = try? JSONEncoder().encode(events) {
            UserDefaults.standard.set(encoded, forKey: "events")
        }
    }
}

struct EventRow: View {
    let event: Event
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(event.title)
                    .foregroundColor(.white)
                    .fontWeight(.medium)
                
                Text("\(event.day) a las \(event.hour)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Button(action: onEdit) {
                Image(systemName: "pencil")
                    .foregroundColor(Color("AccentRed"))
                    .frame(width: 44, height: 44)
            }
            
            Button(action: onDelete) {
                Image(systemName: "trash")
                    .foregroundColor(Color("AccentRed"))
                    .frame(width: 44, height: 44)
            }
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