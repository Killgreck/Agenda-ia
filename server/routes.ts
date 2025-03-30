import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTaskSchema, 
  insertCheckInSchema, 
  insertChatMessageSchema, 
  insertAiSuggestionSchema, 
  insertStatisticsSchema 
} from "@shared/schema";
import axios from "axios";
import { WebSocketServer } from "ws";
import schedule from "node-schedule";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket for real-time communications
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'  // Use a specific path for our websocket to avoid conflicts with Vite's HMR
  });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send a welcome message to confirm connection is working
    ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to AI Calendar WebSocket server' }));
    
    ws.on('message', (message) => {
      try {
        // Handle incoming websocket messages
        console.log('Received message:', message.toString());
        
        // Echo the message back to confirm receipt
        ws.send(JSON.stringify({ type: 'ECHO', message: message.toString() }));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`Client disconnected from WebSocket. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    });
  });
  
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  // Broadcast a message to all connected clients
  const broadcastMessage = (message: any) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(message));
      }
    });
  };
  
  // Tasks API
  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      // Parse and validate the request body
      const parseResult = insertTaskSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        // Detailed validation error response with format errors
        return res.status(400).json({
          message: "Invalid task data",
          details: parseResult.error.format()
        });
      }
      
      const taskData = parseResult.data;
      
      // Additional validations
      if (taskData.isRecurring) {
        if (!taskData.recurrenceType) {
          return res.status(400).json({ message: "Recurrence type is required for recurring events" });
        }
        
        if (taskData.recurrenceType === "weekly" && (!taskData.recurringDays || taskData.recurringDays.length === 0)) {
          return res.status(400).json({ message: "At least one recurring day must be selected for weekly events" });
        }
        
        if (!taskData.recurrenceStartDate) {
          return res.status(400).json({ message: "Recurrence start date is required" });
        }
        
        if (!taskData.recurrenceEndDate) {
          return res.status(400).json({ message: "Recurrence end date is required" });
        }
        
        // Validate dates
        const startDate = new Date(taskData.recurrenceStartDate);
        const endDate = new Date(taskData.recurrenceEndDate);
        if (startDate > endDate) {
          return res.status(400).json({ message: "Start date must be before end date" });
        }
      }
      
      // Create the task
      const createdTask = await storage.createTask(taskData);
      
      // Broadcast new task to connected clients
      broadcastMessage({ type: 'NEW_TASK', task: createdTask });
      
      // Schedule reminder if applicable
      if (createdTask.reminder && createdTask.reminder.length > 0) {
        createdTask.reminder.forEach(minutes => {
          const reminderTime = new Date(createdTask.date);
          reminderTime.setMinutes(reminderTime.getMinutes() - minutes);
          
          // Only schedule if the reminder time is in the future
          if (reminderTime > new Date()) {
            schedule.scheduleJob(reminderTime, () => {
              broadcastMessage({ 
                type: 'REMINDER', 
                taskId: createdTask.id,
                title: createdTask.title,
                date: createdTask.date,
                minutesBefore: minutes
              });
            });
          }
        });
      }
      
      res.status(201).json(createdTask);
    } catch (error: any) {
      console.error("Error creating task:", error);
      
      // More detailed error handling
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else if (typeof error === 'string') {
        res.status(400).json({ message: error });
      } else {
        res.status(500).json({ 
          message: "An unexpected error occurred",
          error: String(error)
        });
      }
    }
  });
  
  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const tasks = await storage.getTasks({ startDate, endDate });
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const taskUpdate = req.body;
      
      const updatedTask = await storage.updateTask(taskId, taskUpdate);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Broadcast task update
      broadcastMessage({ type: 'UPDATE_TASK', task: updatedTask });
      
      res.json(updatedTask);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      const success = await storage.deleteTask(taskId);
      
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Broadcast task deletion
      broadcastMessage({ type: 'DELETE_TASK', taskId });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Check-ins API
  app.post("/api/check-ins", async (req: Request, res: Response) => {
    try {
      const checkInData = insertCheckInSchema.parse(req.body);
      const createdCheckIn = await storage.createCheckIn(checkInData);
      
      // Broadcast new check-in
      broadcastMessage({ type: 'NEW_CHECK_IN', checkIn: createdCheckIn });
      
      res.status(201).json(createdCheckIn);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/check-ins", async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string) 
        : new Date(new Date().setDate(new Date().getDate() - 30)); // Default to last 30 days
      
      const endDate = req.query.endDate 
        ? new Date(req.query.endDate as string) 
        : new Date();
      
      const checkIns = await storage.getCheckIns(startDate, endDate);
      res.json(checkIns);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/check-ins/latest", async (req: Request, res: Response) => {
    try {
      const latestCheckIn = await storage.getLatestCheckIn();
      
      if (!latestCheckIn) {
        return res.status(404).json({ message: "No check-ins found" });
      }
      
      res.json(latestCheckIn);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Chat API
  app.post("/api/chat-messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const createdMessage = await storage.createChatMessage(messageData);
      
      // If the message is from the user, generate AI response
      if (messageData.sender === 'user') {
        // Broadcast user message to connected clients
        broadcastMessage({ type: 'NEW_CHAT_MESSAGE', message: createdMessage });
        
        try {
          // Simulate API call to Deepsek AI
          // In production, replace this with actual API call to Deepsek
          setTimeout(async () => {
            // Create AI response
            const aiResponseData = {
              content: generateAIResponse(messageData.content),
              timestamp: new Date(),
              sender: 'ai'
            };
            
            const aiResponseMessage = await storage.createChatMessage(aiResponseData);
            
            // Broadcast AI response
            broadcastMessage({ type: 'NEW_CHAT_MESSAGE', message: aiResponseMessage });
          }, 1000);
        } catch (aiError) {
          console.error('Error generating AI response:', aiError);
        }
      }
      
      res.status(201).json(createdMessage);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/chat-messages", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const messages = await storage.getChatMessages(limit);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // AI Suggestions API
  app.post("/api/ai-suggestions", async (req: Request, res: Response) => {
    try {
      const suggestionData = insertAiSuggestionSchema.parse(req.body);
      const createdSuggestion = await storage.createAiSuggestion(suggestionData);
      
      // Broadcast new suggestion
      broadcastMessage({ type: 'NEW_AI_SUGGESTION', suggestion: createdSuggestion });
      
      res.status(201).json(createdSuggestion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.patch("/api/ai-suggestions/:id", async (req: Request, res: Response) => {
    try {
      const suggestionId = parseInt(req.params.id);
      const { accepted } = req.body;
      
      if (typeof accepted !== 'boolean') {
        return res.status(400).json({ message: "Accepted field must be a boolean" });
      }
      
      const updatedSuggestion = await storage.updateAiSuggestion(suggestionId, accepted);
      
      if (!updatedSuggestion) {
        return res.status(404).json({ message: "AI suggestion not found" });
      }
      
      // Broadcast suggestion update
      broadcastMessage({ type: 'UPDATE_AI_SUGGESTION', suggestion: updatedSuggestion });
      
      res.json(updatedSuggestion);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/ai-suggestions", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const suggestions = await storage.getAiSuggestions(limit);
      res.json(suggestions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Statistics API
  app.post("/api/statistics", async (req: Request, res: Response) => {
    try {
      const statisticsData = insertStatisticsSchema.parse(req.body);
      const createdStatistics = await storage.createStatistics(statisticsData);
      
      // Broadcast new statistics
      broadcastMessage({ type: 'NEW_STATISTICS', statistics: createdStatistics });
      
      res.status(201).json(createdStatistics);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get("/api/statistics", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const statistics = await storage.getLatestStatistics(limit);
      res.json(statistics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/statistics/week", async (req: Request, res: Response) => {
    try {
      if (!req.query.start || !req.query.end) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      
      const weekStart = new Date(req.query.start as string);
      const weekEnd = new Date(req.query.end as string);
      
      const weekStatistics = await storage.getStatisticsForWeek(weekStart, weekEnd);
      
      if (!weekStatistics) {
        return res.status(404).json({ message: "No statistics found for the specified week" });
      }
      
      res.json(weekStatistics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Generate AI weekly report
  app.post("/api/generate-weekly-report", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      
      // Get tasks for the week
      const start = new Date(startDate);
      const end = new Date(endDate);
      const tasks = await storage.getTasks({ startDate: start, endDate: end });
      
      // Get check-ins for the week
      const checkIns = await storage.getCheckIns(start, end);
      
      // Calculate statistics
      const completedTasks = tasks.filter(task => task.completed);
      const avgProductivity = checkIns.length > 0 
        ? Math.round(checkIns.reduce((sum, ci) => sum + ci.productivityRating, 0) / checkIns.length)
        : 0;
      
      // Get AI suggestions for the week
      const allSuggestions = await storage.getAiSuggestions();
      const weekSuggestions = allSuggestions.filter(
        s => new Date(s.timestamp) >= start && new Date(s.timestamp) <= end
      );
      const acceptedSuggestions = weekSuggestions.filter(s => s.accepted);
      
      // Create or update weekly statistics
      const existingStats = await storage.getStatisticsForWeek(start, end);
      
      let statistics;
      const statsData = {
        weekStart: start,
        weekEnd: end,
        tasksCompleted: completedTasks.length,
        tasksTotal: tasks.length,
        avgProductivity,
        aiSuggestionsAccepted: acceptedSuggestions.length,
        aiSuggestionsTotal: weekSuggestions.length
      };
      
      if (existingStats) {
        statistics = await storage.updateAiSuggestion(existingStats.id, true);
      } else {
        statistics = await storage.createStatistics(statsData);
      }
      
      res.json({ 
        statistics,
        report: generateWeeklyReport(statsData)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}

// Helper function to generate a simple AI response
// This would be replaced with a real AI API call in production
function generateAIResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! How can I assist you with your calendar and tasks today?";
  } else if (lowerMessage.includes('task') && (lowerMessage.includes('today') || lowerMessage.includes('remind'))) {
    return "Here are your tasks for today:\n- Team standup at 10:00 AM\n- 1:1 meeting with manager at 2:00 PM\n- Project deadline preparation (suggested: 3:00-5:00 PM)\n\nWould you like me to schedule focused work time for your project preparation?";
  } else if (lowerMessage.includes('schedule') || lowerMessage.includes('create')) {
    return "I'd be happy to help you schedule that. What's the title of the event, and when would you like to schedule it?";
  } else if (lowerMessage.includes('productivity') || lowerMessage.includes('progress')) {
    return "Your productivity has been trending upward this week! You've completed 65% of your tasks, which is 10% better than last week.";
  } else if (lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
    return "Based on your calendar, I recommend scheduling deep work blocks in the morning when you're most productive. Would you like me to add those to your calendar?";
  } else {
    return "I'm here to help you manage your calendar and tasks. You can ask me to create events, check your schedule, or provide productivity insights.";
  }
}

// Helper function to generate a weekly report
function generateWeeklyReport(stats: any): string {
  const productivityLevel = stats.avgProductivity <= 2 ? 'low' :
    stats.avgProductivity <= 3 ? 'moderate' : 'high';
    
  const completionRate = stats.tasksTotal > 0 
    ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100)
    : 0;
    
  const suggestionRate = stats.aiSuggestionsTotal > 0
    ? Math.round((stats.aiSuggestionsAccepted / stats.aiSuggestionsTotal) * 100)
    : 0;
    
  return `
    ## Weekly Report: ${new Date(stats.weekStart).toLocaleDateString()} - ${new Date(stats.weekEnd).toLocaleDateString()}
    
    ### Task Completion
    You completed ${stats.tasksCompleted} out of ${stats.tasksTotal} tasks (${completionRate}%).
    
    ### Productivity
    Your average productivity rating was ${stats.avgProductivity}/5, indicating ${productivityLevel} productivity.
    
    ### AI Assistant Usage
    You accepted ${stats.aiSuggestionsAccepted} out of ${stats.aiSuggestionsTotal} AI suggestions (${suggestionRate}%).
    
    ### Recommendations
    ${generateRecommendations(stats)}
  `;
}

// Helper function to generate recommendations based on stats
function generateRecommendations(stats: any): string {
  const recommendations = [];
  
  if (stats.tasksCompleted / stats.tasksTotal < 0.7) {
    recommendations.push("Consider breaking down larger tasks into smaller, more manageable ones to improve completion rate.");
  }
  
  if (stats.avgProductivity < 3) {
    recommendations.push("Your productivity rating is below average. Try using the Pomodoro technique or scheduling focused work blocks.");
  }
  
  if (stats.aiSuggestionsAccepted / stats.aiSuggestionsTotal < 0.5) {
    recommendations.push("You're not utilizing many AI suggestions. Consider reviewing them more carefully as they're designed to optimize your schedule.");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Great job this week! Keep up the good work and maintain your current productivity strategies.");
  }
  
  return recommendations.join("\n\n");
}
