import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./storage";

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { 
  insertTaskSchema, 
  insertCheckInSchema, 
  insertChatMessageSchema, 
  insertAiSuggestionSchema, 
  insertStatisticsSchema,
  insertUserSchema,
  insertNotificationSchema
} from "@shared/schema";
import axios from "axios";
import { 
  sendEmail, 
  generateSecureToken, 
  getVerificationEmailTemplate, 
  getPasswordResetEmailTemplate 
} from "./email";
import { WebSocketServer } from "ws";
import schedule from "node-schedule";
import session from "express-session";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import MemoryStore from "memorystore";
import { callAbacusLLM, generateTaskSuggestion, generateWeeklyReportSummary } from "./abacusLLM";
import { addDays, format, isSameDay, getDay, isWithinInterval } from "date-fns";

// Extend express-session declarations
declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
  }
}

// Generate individual task instances for recurring events
// Helper function to schedule reminders for tasks
function scheduleTaskReminders(task: any, broadcastMessage: (message: any) => void) {
  if (task.reminder && task.reminder.length > 0) {
    task.reminder.forEach((minutes: number) => {
      const reminderTime = new Date(task.date);
      reminderTime.setMinutes(reminderTime.getMinutes() - minutes);
      
      // Only schedule if the reminder time is in the future
      if (reminderTime > new Date()) {
        schedule.scheduleJob(reminderTime, () => {
          broadcastMessage({ 
            type: 'REMINDER', 
            taskId: task.id,
            title: task.title,
            date: task.date,
            minutesBefore: minutes
          });
        });
      }
    });
  }
}

// Helper function to format dates in a way that preserves local day
function formatDateToPreserveLocalDay(date: Date): string {
  // If the date is already a UTC ISO string, return it as is
  if (date.toISOString().endsWith('Z')) {
    return date.toISOString();
  }
  
  // Otherwise, create a UTC ISO string to preserve the local date and time
  return date.toISOString();
}

function generateRecurringTasks(taskData: any): any[] {
  console.log("Generating recurring tasks from base task data, preserving date formats");
  const tasks: any[] = [];
  
  // Convert dates to Date objects for calculation
  const startDate = new Date(taskData.recurrenceStartDate);
  const endDate = new Date(taskData.recurrenceEndDate);
  
  // Get base task date objects
  const baseDate = new Date(taskData.date);
  const baseEndDate = taskData.endDate ? new Date(taskData.endDate) : null;
  
  // Calculate time portions to preserve in recurring instances
  const startTime = baseDate.toTimeString().substring(0, 8); // Extract HH:MM:SS
  const endTime = baseEndDate ? baseEndDate.toTimeString().substring(0, 8) : null;

  // For daily recurrence
  if (taskData.recurrenceType === "daily") {
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Create a new task instance
      const taskInstance = { ...taskData };
      
      // Set the date for this instance
      if (!taskData.isAllDay) {
        // Combine date and time
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const dateWithTime = new Date(`${dateStr}T${startTime}`);
        taskInstance.date = formatDateToPreserveLocalDay(dateWithTime); // Use the format that preserves local day
        
        if (endTime) {
          const endDateWithTime = new Date(`${dateStr}T${endTime}`);
          taskInstance.endDate = formatDateToPreserveLocalDay(endDateWithTime); // Use the format that preserves local day
        }
      } else {
        // All-day event
        taskInstance.date = formatDateToPreserveLocalDay(currentDate); // Use the format that preserves local day
      }
      
      // Add to task list
      tasks.push(taskInstance);
      
      // Move to next day
      currentDate = addDays(currentDate, 1);
    }
  }
  
  // For weekly recurrence
  else if (taskData.recurrenceType === "weekly") {
    const recurringDays = taskData.recurringDays || [];
    const dayMap: {[key: string]: number} = {
      "sunday": 0,
      "monday": 1,
      "tuesday": 2,
      "wednesday": 3,
      "thursday": 4,
      "friday": 5,
      "saturday": 6
    };
    
    // Convert recurring days to day numbers (0-6, Sunday-Saturday)
    const recurringDayNumbers = recurringDays.map((day: string) => dayMap[day]);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const currentDay = getDay(currentDate); // 0-6
      
      // Check if current day is in the recurring days
      if (recurringDayNumbers.includes(currentDay)) {
        // Create a new task instance
        const taskInstance = { ...taskData };
        
        // Set the date for this instance
        if (!taskData.isAllDay) {
          // Combine date and time
          const dateStr = format(currentDate, "yyyy-MM-dd");
          const dateWithTime = new Date(`${dateStr}T${startTime}`);
          taskInstance.date = formatDateToPreserveLocalDay(dateWithTime); // Use the format that preserves local day
          
          if (endTime) {
            const endDateWithTime = new Date(`${dateStr}T${endTime}`);
            taskInstance.endDate = formatDateToPreserveLocalDay(endDateWithTime); // Use the format that preserves local day
          }
        } else {
          // All-day event
          taskInstance.date = formatDateToPreserveLocalDay(currentDate); // Use the format that preserves local day
        }
        
        // Add to task list
        tasks.push(taskInstance);
      }
      
      // Move to next day
      currentDate = addDays(currentDate, 1);
    }
  }
  
  // For monthly recurrence
  else if (taskData.recurrenceType === "monthly") {
    let currentDate = new Date(startDate);
    const dayOfMonth = currentDate.getDate(); // Get the day of month from start date
    
    while (currentDate <= endDate) {
      // Create a new task instance
      const taskInstance = { ...taskData };
      
      // Set the date for this instance
      if (!taskData.isAllDay) {
        // Combine date and time
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const dateWithTime = new Date(`${dateStr}T${startTime}`);
        taskInstance.date = formatDateToPreserveLocalDay(dateWithTime);
        
        if (endTime) {
          const endDateWithTime = new Date(`${dateStr}T${endTime}`);
          taskInstance.endDate = formatDateToPreserveLocalDay(endDateWithTime);
        }
      } else {
        // All-day event
        taskInstance.date = formatDateToPreserveLocalDay(currentDate);
      }
      
      // Add to task list
      tasks.push(taskInstance);
      
      // Advance to next month
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      // Handle month with fewer days (e.g., trying to go from Jan 31 to Feb 31)
      // If the day doesn't exist in the next month, we'll get the last day of that month
      if (nextMonth.getDate() !== dayOfMonth) {
        // Go to the first day of the month
        nextMonth.setDate(1);
        // Then go back one day to get the last day of the previous month
        nextMonth.setDate(0);
      }
      
      currentDate = nextMonth;
    }
  }
  
  // For yearly recurrence
  else if (taskData.recurrenceType === "yearly") {
    let currentDate = new Date(startDate);
    const monthOfYear = currentDate.getMonth(); // Get month (0-11)
    const dayOfMonth = currentDate.getDate(); // Get day of month
    
    while (currentDate <= endDate) {
      // Create a new task instance
      const taskInstance = { ...taskData };
      
      // Set the date for this instance
      if (!taskData.isAllDay) {
        // Combine date and time
        const dateStr = format(currentDate, "yyyy-MM-dd");
        const dateWithTime = new Date(`${dateStr}T${startTime}`);
        taskInstance.date = formatDateToPreserveLocalDay(dateWithTime);
        
        if (endTime) {
          const endDateWithTime = new Date(`${dateStr}T${endTime}`);
          taskInstance.endDate = formatDateToPreserveLocalDay(endDateWithTime);
        }
      } else {
        // All-day event
        taskInstance.date = formatDateToPreserveLocalDay(currentDate);
      }
      
      // Add to task list
      tasks.push(taskInstance);
      
      // Advance to next year
      const nextYear = new Date(currentDate);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      // Handle leap years properly (Feb 29)
      if (monthOfYear === 1 && dayOfMonth === 29) {
        // Check if next year is a leap year
        const isLeapYear = (year: number) => {
          return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        };
        
        if (!isLeapYear(nextYear.getFullYear())) {
          // If not a leap year, use Feb 28
          nextYear.setDate(28);
        }
      }
      
      currentDate = nextYear;
    }
  }
  
  return tasks;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize session store
  const SessionStore = MemoryStore(session);
  
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Authentication Middleware
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.userId) {
      return next();
    }
    
    res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  };
  
  // Helper functions for email verification and password reset
  async function sendVerificationEmail(user: any): Promise<boolean> {
    // Generate a secure token
    const token = generateSecureToken(32);
    
    // Set expiration time (24 hours from now)
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    
    // Store the token and expiration in the user's record
    const success = await storage.setEmailVerificationToken(user.id, token, expires);
    
    if (!success) {
      return false;
    }
    
    // Create verification link
    const verificationLink = `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/verify-email/${token}`;
    
    // Generate email template
    const emailTemplate = getVerificationEmailTemplate(user.username, verificationLink);
    
    // Send email
    return await sendEmail({
      to: user.email,
      subject: "Verify Your Email Address",
      html: emailTemplate
    });
  }

  async function sendPasswordResetEmail(user: any): Promise<boolean> {
    // Generate a secure token
    const token = generateSecureToken(32);
    
    // Set expiration time (1 hour from now)
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    
    // Store the token and expiration in the user's record
    const success = await storage.setPasswordResetToken(user.id, token, expires);
    
    if (!success) {
      return false;
    }
    
    // Create reset link
    const resetLink = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password/${token}`;
    
    // Generate email template
    const emailTemplate = getPasswordResetEmailTemplate(user.username, resetLink);
    
    // Send email
    return await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      html: emailTemplate
    });
  }
  
  // Authentication routes
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, password, email, name, phoneNumber } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }

      // Check if email already exists (if provided)
      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "Email already in use"
          });
        }
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create the user
      const userData = {
        username,
        password: hashedPassword,
        email: email || null,
        phoneNumber: phoneNumber || null,
        name: name || null
      };
      
      const validatedUserData = insertUserSchema.parse(userData);
      const user = await storage.createUser(validatedUserData);
      
      // Set user session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      // Send verification email if email is provided
      if (email) {
        try {
          await sendVerificationEmail(user);
        } catch (emailError) {
          console.error("Error sending verification email:", emailError);
          // Continue with user creation even if email fails
        }
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error("Error in signup:", error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  });
  
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      console.log("Login attempt for username:", username);
      
      // Find user
      const user = await storage.getUserByUsername(username);
      console.log("User found:", user ? "Yes" : "No");
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password"
        });
      }
      
      console.log("Retrieved user data:", { 
        id: user.id, 
        username: user.username, 
        passwordExists: Boolean(user.password),
        passwordLength: user.password?.length
      });
      
      // Verify password
      console.log("About to compare password with hash");
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("Password match result:", isMatch);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password"
        });
      }
      
      // Set user session
      req.session.userId = user.id;
      req.session.username = user.username;
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        message: "Login successful",
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error("Error in login:", error);
      console.error("Error details:", error.stack);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Logout failed"
        });
      }
      
      res.json({
        success: true,
        message: "Logged out successfully"
      });
    });
  });
  
  app.get("/api/auth/status", (req: Request, res: Response) => {
    if (req.session && req.session.userId) {
      storage.getUser(req.session.userId)
        .then(user => {
          if (user) {
            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;
            
            res.json({
              isAuthenticated: true,
              user: userWithoutPassword
            });
          } else {
            // User not found in database but has session
            req.session.destroy(() => {});
            res.json({ isAuthenticated: false });
          }
        })
        .catch(err => {
          console.error("Error checking auth status:", err);
          res.json({ isAuthenticated: false });
        });
    } else {
      res.json({ isAuthenticated: false });
    }
  });
  
  // User profile update route
  app.patch("/api/user/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Update fields - only allow permitted fields to be updated
      const updateData: any = {};
      const allowedFields = [
        'email', 'phoneNumber', 'name', 'address', 'city', 'state', 
        'zipCode', 'country', 'company', 'jobTitle', 'bio', 
        'birthdate', 'timezone', 'profilePicture', 'darkMode', 
        'emailNotifications', 'smsNotifications', 
        'calendarIntegration', 'language'
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });
      
      // Basic validation for required fields
      if (updateData.email === "") {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }
      
      if (updateData.phoneNumber === "") {
        return res.status(400).json({
          success: false,
          message: "Phone number is required"
        });
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to update user profile"
        });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json({
        success: true,
        message: "Profile updated successfully",
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  });
  
  // Setup WebSocket for real-time communications
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',  // Use a specific path for our websocket to avoid conflicts with Vite's HMR
    perMessageDeflate: false // Disable compression to avoid potential issues
  });
  
  // Map to store WebSocket connections by user ID
  const userConnections = new Map();
  
  wss.on('connection', (ws, req) => {
    console.log('Client connected to WebSocket');
    
    // Add a userId property to the WebSocket object (will be set when auth message is received)
    (ws as any).userId = null;
    
    // Send a welcome message to confirm connection is working
    ws.send(JSON.stringify({ type: 'WELCOME', message: 'Connected to AI Calendar WebSocket server' }));
    
    ws.on('message', (message) => {
      try {
        // Handle incoming websocket messages
        const messageData = JSON.parse(message.toString());
        console.log('Received message:', messageData);
        
        // Handle authentication message to register user ID with this connection
        if (messageData.type === 'AUTH' && messageData.userId) {
          const userId = parseInt(messageData.userId);
          console.log(`Registering WebSocket connection for user ID: ${userId}`);
          
          // Store the userId on the websocket object
          (ws as any).userId = userId;
          
          // Add this connection to the user's connections list
          if (!userConnections.has(userId)) {
            userConnections.set(userId, new Set());
          }
          userConnections.get(userId).add(ws);
          
          // Confirm authentication
          ws.send(JSON.stringify({ 
            type: 'AUTH_CONFIRMED', 
            message: `Connection authenticated for user ID: ${userId}` 
          }));
        } else {
          // Echo other messages back to confirm receipt
          ws.send(JSON.stringify({ type: 'ECHO', message: messageData }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
    });
    
    ws.on('close', (code, reason) => {
      // Get the user ID associated with this connection
      const userId = (ws as any).userId;
      console.log(`Client disconnected from WebSocket. User ID: ${userId}, Code: ${code}, Reason: ${reason || 'No reason provided'}`);
      
      // Remove this connection from the user's connections list
      if (userId && userConnections.has(userId)) {
        userConnections.get(userId).delete(ws);
        // Clean up empty user entries
        if (userConnections.get(userId).size === 0) {
          userConnections.delete(userId);
        }
      }
    });
  });
  
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  // Broadcast a message to specific user's connections or all connections if no userId provided
  const broadcastMessage = (message: any) => {
    // If the message contains a userId, send only to that user's connections
    const userId = message.userId || (message.message && message.message.userId);
    
    if (userId && userConnections.has(userId)) {
      // Send to specific user's connections
      userConnections.get(userId).forEach(client => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify(message));
        }
      });
      console.log(`Broadcasted message to user ID: ${userId}, connections: ${userConnections.get(userId).size}`);
    } else {
      // Fallback: broadcast to all connections
      wss.clients.forEach(client => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify(message));
        }
      });
    }
  };
  
  // Tasks API
  app.post("/api/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      console.log("Creating task for user:", userId);
      console.log("Session data:", req.session);
      console.log("Request body:", req.body);
      
      // Parse and validate the request body
      // The schema expects date fields as strings in ISO format
      // Important: Preserve dates exactly as received from client to avoid timezone issues
      console.log("Date from client:", req.body.date);
      console.log("End date from client:", req.body.endDate);
      
      // Log date format to debug timezone issues
      console.log("Date format check - includes Z?", req.body.date?.includes('Z'));
      
      const rawData = {
        ...req.body,
        userId, // Include the user ID from session
        // Use the dates exactly as received from client, which now include the 'Z' to indicate UTC
        // This preserves the exact date and time as entered by the user without timezone conversion
        date: req.body.date,
        endDate: req.body.endDate,
        recurrenceStartDate: req.body.recurrenceStartDate,
        recurrenceEndDate: req.body.recurrenceEndDate
      };
      
      const parseResult = insertTaskSchema.safeParse(rawData);
      
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
      
      if (taskData.isRecurring) {
        // Generate recurring tasks
        const tasks = generateRecurringTasks(taskData);
        const createdTasks = [];
        
        // Create each task instance
        for (const task of tasks) {
          const createdTask = await storage.createTask(task);
          createdTasks.push(createdTask);
          
          // Broadcast new task to connected clients
          broadcastMessage({ type: 'NEW_TASK', task: createdTask });
          
          // Schedule reminder if applicable
          scheduleTaskReminders(createdTask, broadcastMessage);
        }
        
        // Return the first created task
        res.status(201).json(createdTasks[0]);
        return;
      }
      
      // For non-recurring tasks, create a single task
      const createdTask = await storage.createTask(taskData);
      
      // Broadcast new task to connected clients
      broadcastMessage({ type: 'NEW_TASK', task: createdTask });
      
      // Schedule reminder if applicable
      scheduleTaskReminders(createdTask, broadcastMessage);
      
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
  
  app.get("/api/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const userId = req.session.userId;
      
      const tasks = await storage.getTasks({ startDate, endDate, userId });
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
      
      // Important: Preserve date strings EXACTLY as received from client to maintain local day
      console.log("PATCH task date from client:", req.body.date);
      console.log("PATCH end date from client:", req.body.endDate);
      
      // Keep the dates exactly as received from client to prevent timezone conversions
      const taskUpdate = {
        ...req.body,
        date: req.body.date, // Preserve format exactly as received
        endDate: req.body.endDate, // Preserve format exactly as received
        recurrenceStartDate: req.body.recurrenceStartDate, // Preserve format exactly as received
        recurrenceEndDate: req.body.recurrenceEndDate // Preserve format exactly as received
      };
      
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
      const userId = req.body.userId || 1; // Default to user 1 for testing
      
      // Pre-process date field as string
      const rawData = {
        ...req.body,
        userId,
        date: req.body.date ? req.body.date.toString() : undefined
      };
      
      const checkInData = insertCheckInSchema.parse(rawData);
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
        
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1; // Default to user 1 for testing
      
      const checkIns = await storage.getCheckIns(startDate, endDate, userId);
      res.json(checkIns);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/check-ins/latest", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1; // Default to user 1 for testing
      
      const latestCheckIn = await storage.getLatestCheckIn(userId);
      
      if (!latestCheckIn) {
        return res.status(404).json({ message: "No check-ins found" });
      }
      
      res.json(latestCheckIn);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Chat API - Now using WebSockets instead of storing messages
  app.post("/api/chat-messages", async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId || 1; // Default to user 1 for testing
      
      // Pre-process timestamp field as string
      const now = new Date();
      const rawData = {
        ...req.body,
        userId,
        timestamp: req.body.timestamp ? req.body.timestamp.toString() : now.toISOString()
      };
      
      const messageData = insertChatMessageSchema.parse(rawData);
      
      // Create a message object with an ID for the client
      // but don't store it in the database
      const messageWithId = {
        ...messageData,
        id: Date.now() // Generate a simple client-side ID
      };
      
      // If the message is from the user, generate AI response
      if (messageData.sender === 'user') {
        // Broadcast user message only to this user's connections
        broadcastMessage({ 
          type: 'NEW_CHAT_MESSAGE', 
          message: messageWithId,
          userId: userId  // Include userId to target specific connections
        });
        
        try {
          // Fetch user's calendar events for better context
          // Get current date and next 30 days
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);
          
          // Get user's tasks (calendar events)
          storage.getTasks({ userId, startDate, endDate })
            .then(async (tasks) => {
              console.log(`Retrieved ${tasks.length} calendar events for AI context for user ${userId}`);
              
              // Format tasks for friendly display to the AI
              const formattedTasks = tasks.map(task => {
                const dateStr = new Date(task.date).toLocaleDateString('en-US', { weekday: 'long', month: 'numeric', day: 'numeric' });
                let timeStr = '';
                
                if (task.isAllDay) {
                  timeStr = 'All Day';
                } else {
                  const startTime = new Date(task.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const endTime = task.endDate 
                    ? new Date(task.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : '';
                  timeStr = endTime ? `${startTime} - ${endTime}` : startTime;
                }
                
                return `- ${task.title} (${dateStr}, ${timeStr})`;
              }).join('\n');
              
              // Use Abacus LLM API to generate a response with real calendar context
              // If no tasks, we won't change the example ones in the system message
              const userTasksContext = tasks.length > 0 
                ? `Here are the user's current calendar events:\n${formattedTasks}\n\n` 
                : '';
                
              // Call Abacus LLM with user message and calendar context
              const aiResponse = await callAbacusLLM(messageData.content);
              
              // Create AI response with timestamp as string (ISO format)
              const now = new Date();
              const aiResponseData = {
                content: aiResponse,
                timestamp: now.toISOString(),
                sender: 'ai',
                userId: userId, // Include the userId for proper routing
                id: Date.now() + 1 // Simple ID for the response
              };
              
              // Broadcast AI response only to this user's connections
              broadcastMessage({ 
                type: 'NEW_CHAT_MESSAGE', 
                message: aiResponseData,
                userId: userId  // Include userId to target specific connections
              });
            })
            .catch(error => {
              console.error(`Error processing calendar events or LLM response for user ${userId}:`, error);
              // Send fallback response in case of error (only to this user)
              const fallbackResponse = {
                content: "I'm having trouble connecting to my knowledge base at the moment. Please try again in a moment.",
                timestamp: new Date().toISOString(),
                sender: 'ai',
                userId: userId, // Include userId for proper routing
                id: Date.now() + 1
              };
              broadcastMessage({ 
                type: 'NEW_CHAT_MESSAGE', 
                message: fallbackResponse,
                userId: userId  // Include userId to target specific connections
              });
            });
        } catch (aiError) {
          console.error(`Error generating AI response for user ${userId}:`, aiError);
        }
      }
      
      // Return the message with ID but don't store it
      res.status(201).json(messageWithId);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Instead of retrieving from database, we'll return an empty array as messages are not saved
  app.get("/api/chat-messages", async (req: Request, res: Response) => {
    try {
      // Return empty array since we're no longer storing chat messages
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // AI Suggestions API
  app.post("/api/ai-suggestions", async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId || 1; // Default to user 1 for testing
      
      // Pre-process timestamp field as string
      const now = new Date();
      const rawData = {
        ...req.body,
        userId,
        timestamp: req.body.timestamp ? req.body.timestamp.toString() : now.toISOString()
      };
      
      const suggestionData = insertAiSuggestionSchema.parse(rawData);
      const createdSuggestion = await storage.createAiSuggestion(suggestionData);
      
      // Broadcast new suggestion
      broadcastMessage({ type: 'NEW_AI_SUGGESTION', suggestion: createdSuggestion });
      
      res.status(201).json(createdSuggestion);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Generate task suggestions using the Abacus LLM
  app.post("/api/ai-suggestions/generate", async (req: Request, res: Response) => {
    try {
      const { title, description } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      // Call the Abacus LLM to generate a suggestion
      // We're using the imported function from line 20
      const suggestion = await generateTaskSuggestion(title, description);
      
      // Return the suggestion
      res.json({ suggestion });
    } catch (error) {
      console.error('Error generating task suggestion:', error);
      
      // Check if the error is related to the Abacus API key
      if (error instanceof Error && error.message && error.message.includes('API key')) {
        return res.status(503).json({ 
          error: 'Abacus API service unavailable',
          message: 'The AI service is currently unavailable. Please try again later.'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to generate task suggestion',
        message: 'There was an issue connecting to the AI service. Please try again later.'
      });
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
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1; // Default to user 1 for testing
      
      const suggestions = await storage.getAiSuggestions(limit, userId);
      res.json(suggestions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Statistics API
  app.post("/api/statistics", async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId || 1; // Default to user 1 for testing
      
      // Pre-process date fields as strings
      const rawData = {
        ...req.body,
        userId,
        weekStart: req.body.weekStart ? req.body.weekStart.toString() : undefined,
        weekEnd: req.body.weekEnd ? req.body.weekEnd.toString() : undefined
      };
      
      const statisticsData = insertStatisticsSchema.parse(rawData);
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
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1; // Default to user 1 for testing
      
      const statistics = await storage.getLatestStatistics(limit, userId);
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
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1; // Default to user 1 for testing
      
      const weekStatistics = await storage.getStatisticsForWeek(weekStart, weekEnd, userId);
      
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
      const userId = req.body.userId || 1; // Default to user 1 for testing
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      
      // Get tasks for the week
      const start = new Date(startDate);
      const end = new Date(endDate);
      const tasks = await storage.getTasks({ startDate: start, endDate: end, userId });
      
      // Get check-ins for the week
      const checkIns = await storage.getCheckIns(start, end, userId);
      
      // Calculate statistics
      const completedTasks = tasks.filter(task => task.completed);
      const avgProductivity = checkIns.length > 0 
        ? Math.round(checkIns.reduce((sum, ci) => sum + ci.productivityRating, 0) / checkIns.length)
        : 0;
      
      // Get AI suggestions for the week
      const allSuggestions = await storage.getAiSuggestions(undefined, userId);
      const weekSuggestions = allSuggestions.filter(
        s => new Date(s.timestamp) >= start && new Date(s.timestamp) <= end
      );
      const acceptedSuggestions = weekSuggestions.filter(s => s.accepted);
      
      // Create or update weekly statistics
      const existingStats = await storage.getStatisticsForWeek(start, end, userId);
      
      let statistics;
      const statsData = {
        userId,
        weekStart: start.toISOString(),
        weekEnd: end.toISOString(),
        tasksCompleted: completedTasks.length,
        tasksTotal: tasks.length,
        avgProductivity,
        aiSuggestionsAccepted: acceptedSuggestions.length,
        aiSuggestionsTotal: weekSuggestions.length
      };
      
      if (existingStats) {
        // Instead of using the existing stats document, we'll create a new one
        // Note: we're not actually keeping the ID, as createStatistics will create a new record
        // This is a workaround for not having an updateStatistics method
        console.log("Existing stats found, updating with new data:", statsData);
        
        // Here we'll just create a new statistics record with the latest data
        statistics = await storage.createStatistics(statsData);
        
        console.log("Created new statistics record to replace existing one:", statistics);
      } else {
        console.log("No existing stats found, creating new record:", statsData);
        statistics = await storage.createStatistics(statsData);
      }
      
      // Use Abacus LLM to generate a personalized weekly report
      try {
        const report = await generateWeeklyReportSummary(statsData);
        res.json({ 
          statistics,
          report
        });
      } catch (reportError) {
        console.error('Error generating AI weekly report:', reportError);
        // Fallback to the static report if AI fails
        res.json({ 
          statistics,
          report: generateWeeklyReport(statsData)
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notifications API
  app.post("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionData = req.session as SessionData;
      const userId = sessionData.userId;
      
      const notificationData: InsertNotification = {
        ...req.body,
        userId,
        status: 'unread',
        createdAt: new Date(),
      };

      const notification = await storage.createNotification(notificationData);
      
      // Broadcast new notification to connected clients
      broadcastMessage({ type: 'NEW_NOTIFICATION', notification });
      
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionData = req.session as SessionData;
      const userId = sessionData.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const includeRead = req.query.includeRead === 'true';
      
      const notifications = await storage.getNotifications(userId, limit, includeRead);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionData = req.session as SessionData;
      const userId = sessionData.userId;
      
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      
      if (!updatedNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Broadcast notification update
      broadcastMessage({ type: 'UPDATE_NOTIFICATION', notification: updatedNotification });
      
      res.json(updatedNotification);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/:id/dismiss", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const dismissedNotification = await storage.dismissNotification(notificationId);
      
      if (!dismissedNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Broadcast notification update
      broadcastMessage({ type: 'UPDATE_NOTIFICATION', notification: dismissedNotification });
      
      res.json(dismissedNotification);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/read-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionData = req.session as SessionData;
      const userId = sessionData.userId;
      
      await storage.markAllNotificationsAsRead(userId);
      
      // Broadcast bulk notification update
      broadcastMessage({ type: 'NOTIFICATIONS_READ_ALL', userId });
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GitHub repository download routes
  app.get("/download", (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, "..", "download.html"));
  });

  app.get("/github-archive", (req: Request, res: Response) => {
    res.download(path.resolve(__dirname, "..", "agenda-ia-project.tar.gz"), "agenda-ia-project.tar.gz");
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
