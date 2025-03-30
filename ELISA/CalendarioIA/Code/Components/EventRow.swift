import SwiftUI

struct EventRow: View {
    let event: Event
    var isSelected: Bool = false
    let onEdit: () -> Void
    let onDelete: () -> Void
    var onTap: (() -> Void)? = nil
    
    @State private var offset: CGFloat = 0
    @State private var isSwiped = false
    
    var body: some View {
        ZStack {
            // Botones de acciones revelados al deslizar
            HStack(spacing: 0) {
                Spacer()
                
                Button(action: onEdit) {
                    VStack {
                        Image(systemName: "pencil")
                            .font(.title3)
                        Text("Editar")
                            .font(.caption)
                    }
                    .foregroundColor(.white)
                    .frame(width: 60, height: 80)
                    .background(Color.blue)
                }
                
                Button(action: onDelete) {
                    VStack {
                        Image(systemName: "trash")
                            .font(.title3)
                        Text("Eliminar")
                            .font(.caption)
                    }
                    .foregroundColor(.white)
                    .frame(width: 60, height: 80)
                    .background(Color.red)
                }
            }
            .cornerRadius(isSwiped ? 12 : 0)
            
            // Contenido principal
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.title)
                        .font(.headline)
                        .foregroundColor(.white)
                        .lineLimit(1)
                    
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundColor(Color("AccentRed"))
                            .font(.caption)
                        
                        Text("\(event.day) a las \(event.hour)")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                
                Spacer()
                
                if !isSwiped {
                    Image(systemName: "chevron.left")
                        .foregroundColor(.gray)
                        .padding(.trailing, 10)
                        .opacity(0.7)
                }
            }
            .padding(.vertical, 8)
            .padding(.horizontal, 4)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color("DarkRed").opacity(0.6) : Color("BackgroundDark"))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color("AccentRed") : Color("DarkRed"), lineWidth: isSelected ? 2 : 1)
            )
            .offset(x: offset)
            .gesture(
                DragGesture()
                    .onChanged { value in
                        if value.translation.width < 0 {
                            // Solo permite deslizar hacia la izquierda hasta -120
                            self.offset = max(value.translation.width, -120)
                        }
                    }
                    .onEnded { value in
                        if value.translation.width < -50 {
                            // Si desliza más de 50 puntos, mantiene abierto
                            withAnimation {
                                self.offset = -120
                                self.isSwiped = true
                            }
                        } else {
                            // Vuelve a la posición original
                            withAnimation {
                                self.offset = 0
                                self.isSwiped = false
                            }
                        }
                    }
            )
            .onTapGesture {
                // Si está deslizado, cierra al tocar
                if isSwiped {
                    withAnimation {
                        self.offset = 0
                        self.isSwiped = false
                    }
                } else {
                    // De lo contrario, ejecuta la acción de toque si existe
                    onTap?()
                }
            }
        }
        .frame(height: 80)
    }
}

// Vista de previsualización
struct EventRow_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color("BackgroundDark").edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 20) {
                EventRow(
                    event: Event(title: "Reunión de trabajo", day: "L", hour: "10:00"),
                    onEdit: {},
                    onDelete: {}
                )
                
                EventRow(
                    event: Event(title: "Cita médica", day: "Mi", hour: "15:30"),
                    isSelected: true,
                    onEdit: {},
                    onDelete: {}
                )
            }
            .padding()
        }
        .preferredColorScheme(.dark)
    }
}