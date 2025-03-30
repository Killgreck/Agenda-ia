import SwiftUI

struct CalendarGrid: View {
    let events: [Event]
    let days: [String] = ["L", "M", "Mi", "J", "V", "S", "D"]
    let hours: [String]
    let onEventTap: (Event) -> Void
    
    @State private var selectedEvent: Event? = nil
    @State private var gridWidth: CGFloat = 0
    
    init(events: [Event], onEventTap: @escaping (Event) -> Void, startHour: Int = 1, endHour: Int = 24) {
        self.events = events
        self.onEventTap = onEventTap
        
        // Crear horas entre inicio y fin
        self.hours = Array(startHour...endHour).map { "\($0):00" }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Cabecera con los días
            dayHeaderRow
            
            // Filas de horas y eventos
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 0) {
                    ForEach(hours, id: \.self) { hour in
                        hourRow(hour: hour)
                    }
                }
            }
        }
        .background(Color("BackgroundMedium").opacity(0.3))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color("DarkRed"), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.2), radius: 4)
        .padding(.horizontal)
    }
    
    // Vista para la fila de cabecera con los días
    var dayHeaderRow: some View {
        HStack(spacing: 0) {
            // Celda de esquina vacía
            Text("")
                .frame(width: 60, height: 50)
                .background(Color("BackgroundDark"))
                .overlay(
                    Rectangle()
                        .stroke(Color("DarkRed"), lineWidth: 0.5)
                )
            
            // Celdas de días
            ForEach(days, id: \.self) { day in
                Text(day)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(minWidth: 0, maxWidth: .infinity, height: 50)
                    .background(Color("BackgroundDark"))
                    .overlay(
                        Rectangle()
                            .stroke(Color("DarkRed"), lineWidth: 0.5)
                    )
            }
        }
        .background(
            GeometryReader { geo in
                Color.clear.preference(key: WidthPreferenceKey.self, value: geo.size.width)
            }
        )
        .onPreferenceChange(WidthPreferenceKey.self) { width in
            self.gridWidth = width
        }
    }
    
    // Vista para cada fila de hora
    func hourRow(hour: String) -> some View {
        HStack(spacing: 0) {
            // Celda de hora
            Text(hour)
                .font(.system(size: 14))
                .foregroundColor(.gray)
                .frame(width: 60, height: 70)
                .background(Color("BackgroundDark"))
                .overlay(
                    Rectangle()
                        .stroke(Color("DarkRed"), lineWidth: 0.5)
                )
            
            // Celdas de eventos para cada día
            ForEach(days, id: \.self) { day in
                ZStack {
                    // Fondo de la celda
                    Rectangle()
                        .fill(Color("BackgroundDark").opacity(0.8))
                        .overlay(
                            Rectangle()
                                .stroke(Color("DarkRed"), lineWidth: 0.5)
                        )
                    
                    // Eventos para esta hora y día
                    VStack(spacing: 4) {
                        ForEach(eventsFor(day: day, hour: hour), id: \.id) { event in
                            eventBadge(event: event)
                        }
                    }
                    .padding(.horizontal, 4)
                    .padding(.vertical, 2)
                }
                .frame(minWidth: 0, maxWidth: .infinity, height: 70)
            }
        }
    }
    
    // Vista para cada distintivo de evento
    func eventBadge(event: Event) -> some View {
        Text(event.title)
            .font(.system(size: 12))
            .lineLimit(1)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(isSelected(event: event) ? Color("AccentRed") : Color("DarkRed"))
            )
            .onTapGesture {
                withAnimation {
                    if isSelected(event: event) {
                        selectedEvent = nil
                    } else {
                        selectedEvent = event
                    }
                    onEventTap(event)
                }
            }
    }
    
    // Filtra eventos para una hora y día específicos
    func eventsFor(day: String, hour: String) -> [Event] {
        return events.filter { $0.day == day && $0.hour == hour }
    }
    
    // Verifica si un evento está seleccionado
    func isSelected(event: Event) -> Bool {
        return selectedEvent?.id == event.id
    }
}

// Clave de preferencia para obtener el ancho
struct WidthPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

// Vista de previsualización
struct CalendarGrid_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color("BackgroundDark").edgesIgnoringSafeArea(.all)
            
            CalendarGrid(
                events: [
                    Event(title: "Reunión", day: "L", hour: "10:00"),
                    Event(title: "Almuerzo", day: "M", hour: "14:00"),
                    Event(title: "Gimnasio", day: "Mi", hour: "18:00"),
                    Event(title: "Cena", day: "L", hour: "20:00")
                ],
                onEventTap: { _ in }
            )
        }
        .preferredColorScheme(.dark)
    }
}