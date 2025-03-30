import SwiftUI

// Estilos de botones personalizados para el tema Samurai

// Botón principal rojo con gradiente
struct SamuraiButtonStyle: ButtonStyle {
    var isDisabled: Bool = false
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.vertical, 14)
            .padding(.horizontal, 20)
            .frame(maxWidth: .infinity)
            .background(
                Group {
                    if isDisabled {
                        LinearGradient(gradient: Gradient(colors: [Color.gray.opacity(0.6), Color.gray.opacity(0.4)]),
                                      startPoint: .leading,
                                      endPoint: .trailing)
                    } else {
                        LinearGradient(gradient: Gradient(colors: [Color("DarkRed"), Color("BrightRed")]),
                                      startPoint: .leading,
                                      endPoint: .trailing)
                        .opacity(configuration.isPressed ? 0.8 : 1)
                    }
                }
            )
            .foregroundColor(.white)
            .cornerRadius(12)
            .shadow(color: isDisabled ? Color.black.opacity(0) : Color("ShadowRed").opacity(0.5),
                   radius: configuration.isPressed ? 2 : 5,
                   x: 0,
                   y: configuration.isPressed ? 1 : 3)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
            .opacity(isDisabled ? 0.6 : 1)
    }
}

// Botón con contorno
struct SamuraiOutlineButtonStyle: ButtonStyle {
    var isDisabled: Bool = false
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.vertical, 14)
            .padding(.horizontal, 20)
            .frame(maxWidth: .infinity)
            .background(Color.clear)
            .foregroundColor(isDisabled ? Color.gray : Color("AccentRed"))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isDisabled ? Color.gray : Color("AccentRed"), lineWidth: 2)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .opacity(configuration.isPressed ? 0.9 : 1)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
            .opacity(isDisabled ? 0.6 : 1)
    }
}

// Botón de icono pequeño
struct SamuraiIconButtonStyle: ButtonStyle {
    var bgColor: Color = Color("DarkRed")
    var size: CGFloat = 44
    
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(width: size, height: size)
            .background(
                Circle()
                    .fill(bgColor)
                    .opacity(configuration.isPressed ? 0.8 : 1)
            )
            .foregroundColor(.white)
            .scaleEffect(configuration.isPressed ? 0.9 : 1)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
    }
}

// Botón de texto
struct SamuraiTextButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(Color("AccentRed"))
            .opacity(configuration.isPressed ? 0.7 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeInOut(duration: 0.2), value: configuration.isPressed)
    }
}

// Componente de botón reutilizable con varios estilos
struct CustomButton: View {
    enum ButtonType {
        case primary
        case outline
        case icon
        case text
    }
    
    let title: String
    let icon: String?
    let type: ButtonType
    let action: () -> Void
    let isDisabled: Bool
    
    init(title: String, icon: String? = nil, type: ButtonType = .primary, isDisabled: Bool = false, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.type = type
        self.isDisabled = isDisabled
        self.action = action
    }
    
    var body: some View {
        Button(action: isDisabled ? {} : action) {
            HStack {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: type == .icon ? 20 : 16))
                }
                
                if type != .icon {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                }
            }
        }
        .buttonStyle(buttonStyle)
        .disabled(isDisabled)
    }
    
    // Selecciona el estilo de botón adecuado
    private var buttonStyle: some ButtonStyle {
        switch type {
        case .primary:
            return SamuraiButtonStyle(isDisabled: isDisabled)
        case .outline:
            return SamuraiOutlineButtonStyle(isDisabled: isDisabled)
        case .icon:
            return SamuraiIconButtonStyle()
        case .text:
            return SamuraiTextButtonStyle()
        }
    }
}

// Vista de previsualización
struct CustomButton_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            Color("BackgroundDark").edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 20) {
                CustomButton(
                    title: "Botón Principal",
                    icon: "calendar",
                    type: .primary,
                    action: {}
                )
                
                CustomButton(
                    title: "Botón Outline",
                    icon: "gear",
                    type: .outline,
                    action: {}
                )
                
                CustomButton(
                    title: "Botón de Icono",
                    icon: "plus",
                    type: .icon,
                    action: {}
                )
                
                CustomButton(
                    title: "Botón de Texto",
                    icon: "arrow.right",
                    type: .text,
                    action: {}
                )
                
                CustomButton(
                    title: "Botón Deshabilitado",
                    icon: "xmark",
                    type: .primary,
                    isDisabled: true,
                    action: {}
                )
            }
            .padding()
        }
        .preferredColorScheme(.dark)
    }
}