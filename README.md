# Agenda-IA: Intelligent Productivity Platform

An intelligent productivity platform leveraging advanced AI technologies to transform task management and user engagement, with a focus on intuitive design and adaptive user experience.

## 🌟 Key Features

- **AI-Powered Task Optimization**: Intelligent scheduling and prioritization
- **Real-Time Productivity Tracking**: Adaptive insights based on your work patterns
- **Personalized Task Suggestions**: AI-generated recommendations to improve productivity
- **Dynamic Calendar Management**: Flexible event scheduling with recurrence support
- **Comprehensive Analytics**: Track and visualize your productivity trends
- **User-Friendly Interface**: Intuitive design for seamless interaction

## 🔧 Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn UI components
- **Backend**: Node.js with Express
- **Database**: MongoDB for flexible document storage
- **Real-Time Communication**: WebSockets for instant updates
- **AI Integration**: Advanced AI-powered suggestions and productivity insights
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React Query for server state, Zustand for client state

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Killgreck/Agenda-ia.git
   cd Agenda-ia
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5000`

## 📊 Project Structure

```
/
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Application pages
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
├── server/                # Backend server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── db.ts              # Database connection
│   ├── mongodb.ts         # MongoDB configuration
│   ├── mongoModels.ts     # MongoDB schema models
│   └── mongoStorage.ts    # MongoDB storage interface
├── shared/                # Shared code between frontend and backend
│   └── schema.ts          # Data models and validation schemas
└── public/                # Static assets
```

## 🛠️ Development

- **Running the app**: `npm run dev`
- **Building for production**: `npm run build`
- **Starting production server**: `npm run start`

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Contact

- Developer: [Killgreck](https://github.com/Killgreck)
- Project Link: [https://github.com/Killgreck/Agenda-ia](https://github.com/Killgreck/Agenda-ia)