import SwiftUI

struct DashboardView: View {
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        ZStack {
            LinearGradient(gradient: Gradient(colors: [Color("BackgroundDark"), Color("BackgroundMedium")]), 
                          startPoint: .topLeading, 
                          endPoint: .bottomTrailing)
                .edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 30) {
                Text("👋 ¡Bienvenido al Calendario IA!")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .padding(.top, 50)
                    .padding(.horizontal, 20)
                
                Spacer()
                
                NavigationLink(destination: WeeklyView()) {
                    HStack {
                        Image(systemName: "calendar")
                            .font(.title2)
                        Text("📅 Ir a la Vista Semanal")
                            .font(.headline)
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
                    .shadow(color: Color("ShadowRed").opacity(0.5), radius: 5, x: 0, y: 3)
                    .padding(.horizontal, 20)
                }
                
                Spacer()
            }
            .navigationBarTitle("Dashboard", displayMode: .inline)
            .navigationBarHidden(true)
        }
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
            .preferredColorScheme(.dark)
    }
}