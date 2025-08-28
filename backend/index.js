require("dotenv").config();
const { MongoClient } = require("mongodb");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const generateId = require("./utils/idGenerator");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const http = require("http");
const { Server } = require("socket.io");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const server = http.createServer(app);
const port = 5000;
const uri = process.env.MONGO_URI;

// ✅ Replace these with your actual frontend deployment URLs
const allowedOrigins = [
"http://localhost:3000", 
];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Socket.io Server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected via socket.io:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const client = new MongoClient(uri);

// Firebase Admin SDK
const serviceAccount = require("./ServiceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function run() {
  try {
    await client.connect();
    const usercollection = client.db("database").collection("users");
    const taskcollection = client.db("database").collection("tasks");
    const projectcollection = client.db("database").collection("projects");
    const aiSuggestionCollection = client
      .db("database")
      .collection("ai_suggestions");
    const notificationCollection = client
      .db("database")
      .collection("notifications");

    // Helper function to calculate and update project progress/status
    const updateProjectProgress = async (projectId) => {
      const projectTasks = await taskcollection.find({ projectId }).toArray();

      let totalTasks = projectTasks.length;
      let completedTasks = 0;
      let inProgressTasks = 0;

      projectTasks.forEach((task) => {
        if (task.status === "done") {
          completedTasks++;
        } else if (task.status === "in-progress") {
          inProgressTasks++;
        }
      });

      let newProgress = 0;
      let newStatus = "active"; // Default to active

      if (totalTasks > 0) {
        // Calculate weighted progress: To-do: 0%, In-progress: 50%, Done: 100%
        const weightedProgressSum = completedTasks * 100 + inProgressTasks * 50;
        newProgress = Math.round(weightedProgressSum / totalTasks);

        if (completedTasks === totalTasks) {
          newStatus = "completed";
        }
      }

      await projectcollection.updateOne(
        { id: projectId },
        { $set: { progress: newProgress, status: newStatus } }
      );
      console.log(
        `Project ${projectId} progress updated to ${newProgress}% and status to ${newStatus}.`
      );
    };

    // Helper function to create a notification
    const createNotification = async (userId, message, type) => {
      const notification = {
        id: generateId("not_"),
        userId,
        message,
        type, // e.g., "welcome", "task_assigned", "project_assigned"
        createdAt: new Date().toISOString(),
        read: false,
      };
      await notificationCollection.insertOne(notification);
      return notification;
    };

    // Check if email is registered (via Firebase)
    app.post("/check-email", async (req, res) => {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      try {
        const user = await usercollection.findOne({ email });
        if (user && user.role === "admin") {
          return res.json({
            registered: true,
            isAdmin: true,
            reason: "Admins cannot reset password here",
          });
        }

        await admin.auth().getUserByEmail(email);
        res.json({ registered: true, isAdmin: false });
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          res.json({ registered: false });
        } else {
          console.error("Error checking email:", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      }
    });

    // Register a new user in MongoDB
    app.post("/register", async (req, res) => {
      try {
        let { id, name, email, role, password } = req.body;

        const existingUser = await usercollection.findOne({ email });
        if (existingUser) {
          return res
            .status(400)
            .json({ error: "User with this email already exists" });
        }

        if (role === "admin") {
          const adminExists = await usercollection.findOne({ role: "admin" });
          if (adminExists) {
            return res.status(403).json({ error: "Admin already exists" });
          }
        }

        if (!id) {
          id = generateId(role === "admin" ? "adm_" : "usr_");
        }

        const hashedPassword =
          role === "admin" ? await bcrypt.hash(password, 10) : null;

        const userToSave = {
          id,
          name,
          email,
          role,
          ...(role === "admin" && { password }),
        };

        const result = await usercollection.insertOne(userToSave);

        // Broadcast the new user to all clients
        broadcast({
          type: "userCreated",
          data: { ...userToSave, _id: result.insertedId },
        });

        // Create welcome notification
        await createNotification(
          id,
          `Welcome, ${name}! Your account has been successfully created.`,
          "welcome"
        );
        res.status(201).json({ ...userToSave, _id: result.insertedId });
      } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get user role by email
    app.get("/get-role", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }

        const user = await usercollection.findOne({ email });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({ role: user.role });
      } catch (error) {
        console.error("Error fetching role:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Fetch all registered users (excluding admin)
    app.get("/users", async (req, res) => {
      try {
        const users = await usercollection
          .find({ role: { $ne: "admin" } })
          .toArray();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Fetch a user by email
    app.get("/loggedinuser", async (req, res) => {
      try {
        const email = req.query.email;
        const user = await usercollection.findOne({ email });

        if (!user) return res.status(404).json([]);

        res.json([
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        ]);
      } catch (err) {
        console.error("Error fetching logged in user:", err);
        res.status(500).json([]);
      }
    });

    // Fetch admin email
    app.get("/admin-email", async (req, res) => {
      try {
        const admin = await usercollection.findOne({ role: "admin" });
        if (!admin) {
          return res.json({ adminEmail: null });
        }
        res.json({ adminEmail: admin.email });
      } catch (error) {
        console.error("Error fetching admin email:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Fetch admin credentials (sensitive, consider removing or securing)
    app.get("/admin-credentials", async (req, res) => {
      try {
        const adminUser = await usercollection.findOne({ role: "admin" });
        if (!adminUser) {
          return res.status(404).json({ error: "No admin found" });
        }
        // WARNING: Exposing password directly is a security risk.
        // This endpoint should be removed or heavily secured in production.
        res.json({ email: adminUser.email, password: adminUser.password });
      } catch (error) {
        console.error("Fetch admin error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Delete a user
    app.delete("/users/:id", async (req, res) => {
      try {
        const userId = req.params.id;

        // First check if user exists
        const user = await usercollection.findOne({ id: userId });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Prevent deleting admin
        if (user.role === "admin") {
          return res.status(403).json({ error: "Cannot delete admin user" });
        }

        // Delete the user
        const result = await usercollection.deleteOne({ id: userId });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        // Delete all tasks assigned to this user
        await taskcollection.deleteMany({ assigneeId: userId });

        // Remove user from all projects they're a member of
        await projectcollection.updateMany(
          { members: userId },
          { $pull: { members: userId } }
        );

        res.json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Project End points

    // Create a new project
    app.post("/projects", async (req, res) => {
      try {
        const {
          name,
          description,
          members,
          status = "active",
          progress = 0,
        } = req.body;
        if (!name || !description || !members) {
          return res.status(400).json({
            error: "Name, description and members are required",
          });
        }
        const projectToSave = {
          id: `prj_${Date.now().toString(36)}${Math.random()
            .toString(36)
            .substring(2, 10)}`,
          name,
          description,
          members,
          status,
          progress,
          createdAt: new Date().toISOString(),
        };
        const result = await projectcollection.insertOne(projectToSave);

        // Broadcast the new project to all clients
        broadcast({ type: "projectCreated", data: projectToSave });

        for (const memberId of members) {
          await createNotification(
            memberId,
            `You have been added to a new project: "${name}".`,
            "project_assigned"
          );
        }

        res.status(201).json({ ...projectToSave, _id: result.insertedId });
      } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Fetch all projects or projects for a specific user
    app.get("/projects", async (req, res) => {
      try {
        const userId = req.query.userId;
        const isAdmin = req.query.isAdmin === "true";
        if (isAdmin) {
          // Admin can see all projects
          const projects = await projectcollection.find().toArray();
          return res.json(projects);
        }
        if (!userId) {
          return res
            .status(400)
            .json({ error: "User ID is required for non-admin requests" });
        }
        // Regular users see only projects they're members of
        const projects = await projectcollection
          .find({
            members: userId,
          })
          .toArray();

        res.json(projects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Delete a project
    app.delete("/projects/:id", async (req, res) => {
      try {
        const projectId = req.params.id;
        const result = await projectcollection.deleteOne({ id: projectId });
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Project not found" });
        }
        // Delete associated tasks
        await taskcollection.deleteMany({ projectId });

        // Broadcast the deleted project to all clients
        broadcast({ type: "projectDeleted", data: { id: projectId } });

        res.json({
          message: "Project and associated tasks deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Update a project
    app.put("/projects/:id", async (req, res) => {
      try {
        const projectId = req.params.id;
        const { name, description, members, status, progress } = req.body;

        // Basic validation
        if (!name || !description || !members) {
          return res.status(400).json({
            error: "Name, description and members are required",
          });
        }

        const result = await projectcollection.updateOne(
          { id: projectId },
          {
            $set: {
              name,
              description,
              members,
              status: status || "active",
              progress: progress || 0,
            },
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Project not found" });
        }

        // Broadcast the updated project to all clients
        broadcast({
          type: "projectUpdated",
          data: {
            id: projectId,
            name,
            description,
            members,
            status: status || "active",
            progress: progress || 0,
          },
        });

        res.json({
          message: "Project updated successfully",
          updatedProject: {
            id: projectId,
            name,
            description,
            members,
            status,
            progress,
          },
        });
      } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Task End Points

    // Create a new task (POST)
    app.post("/tasks", async (req, res) => {
      try {
        const taskData = req.body;

        // Basic validation
        if (!taskData.title || !taskData.projectId || !taskData.assigneeId) {
          return res.status(400).json({
            error: "Title, projectId and assigneeId are required",
          });
        }

        const taskToSave = {
          ...taskData,
          id: `tsk_${Date.now().toString(36)}${Math.random()
            .toString(36)
            .substring(2, 10)}`,
          createdAt: new Date().toISOString(),
          status: taskData.status || "todo", // Default status
          priority: taskData.priority || "medium", // Default priority
        };

        const result = await taskcollection.insertOne(taskToSave);

        // After creating the task, ensure the assignee is a member of the project
        const projectId = taskData.projectId;
        const assigneeId = taskData.assigneeId;

        // Find the project
        const project = await projectcollection.findOne({ id: projectId });

        if (project && !project.members.includes(assigneeId)) {
          // If the project exists and the assignee is not already a member, add them
          await projectcollection.updateOne(
            { id: projectId },
            { $addToSet: { members: assigneeId } } // $addToSet adds a value to an array only if it's not already present
          );
          console.log(
            `User ${assigneeId} added to project ${projectId} members.`
          );
        }

        // Create notification for task assignment
        await createNotification(
          assigneeId,
          `You have been assigned a new task: "${taskData.title}" in project "${
            project?.name || projectId
          }".`,
          "task_assigned"
        );

        //  Update project progress
        await updateProjectProgress(taskData.projectId);
        res.status(201).json({ ...taskToSave, _id: result.insertedId });
      } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Get tasks (GET) - with user-specific filtering or all for admin
    app.get("/tasks", async (req, res) => {
      try {
        const { projectId, userId, isAdmin, assigneeId } = req.query; // Add assigneeId to destructuring

        const query = {};

        if (isAdmin === "true") {
          // Admin can view all tasks. If assigneeId is provided, filter by it.
          if (assigneeId) {
            query.assigneeId = assigneeId;
          }
          if (projectId) {
            // Admin might also want to filter by project
            query.projectId = projectId;
          }
        } else if (projectId && userId) {
          // Regular user viewing tasks for a specific project assigned to them
          query.projectId = projectId;
          query.assigneeId = userId;
        } else if (projectId) {
          // Fetch tasks for a specific project (e.g., for project overview, if allowed)
          query.projectId = projectId;
        } else if (userId) {
          // Fetch tasks assigned to a specific user across all projects (for non-admin user fetching their own tasks)
          query.assigneeId = userId;
        } else if (assigneeId) {
          // New condition to handle direct assigneeId queries (e.g., from admin panel)
          query.assigneeId = assigneeId;
        } else {
          return res.status(400).json({
            error:
              "At least projectId, userId, assigneeId, or isAdmin flag must be provided",
          });
        }

        const tasks = await taskcollection.find(query).toArray();
        res.json(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Update a task (PUT)
    app.put("/tasks/:id", async (req, res) => {
      try {
        const taskId = req.params.id;
        const updates = req.body;

        // Prevent changing the task ID or creation date
        if (updates.id || updates.createdAt) {
          return res.status(400).json({
            error: "Cannot modify task ID or creation date",
          });
        }

        const result = await taskcollection.updateOne(
          { id: taskId },
          { $set: updates }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Task not found" });
        }

        const originalTask = await taskcollection.findOne({ id: taskId });
        if (originalTask?.projectId) {
          await updateProjectProgress(originalTask.projectId);
        }

        res.json({ message: "Task updated successfully" });
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Delete a task (DELETE)
    app.delete("/tasks/:id", async (req, res) => {
      try {
        const taskId = req.params.id;
        const result = await taskcollection.deleteOne({ id: taskId });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Task not found" });
        }

        const originalTask = await taskcollection.findOne({ id: taskId });
        if (originalTask?.projectId) {
          await updateProjectProgress(originalTask.projectId);
        }

        res.json({ message: "Task deleted successfully" });
      } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // New endpoint to fetch notifications for a user
    app.get("/notifications", async (req, res) => {
      try {
        const userId = req.query.userId;
        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }

        const notifications = await notificationCollection
          .find({ userId })
          .sort({ createdAt: -1 }) // Newest first
          .limit(10) // Limit to 10 notifications
          .toArray();

        res.json(notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // New endpoint to mark notification as read
    app.put("/notifications/:id/read", async (req, res) => {
      try {
        const notificationId = req.params.id;
        const result = await notificationCollection.updateOne(
          { id: notificationId },
          { $set: { read: true } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ message: "Notification marked as read" });
      } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Gemini-based AI Suggestions
    app.post("/generate-ai-suggestions", async (req, res) => {
      const { projectGoal, userRole } = req.body;

      if (!projectGoal) {
        return res.status(400).json({ error: "Project goal is required." });
      }

      // Refined prompts for different roles
      const systemPrompts = {
        admin: `You are an expert project manager and system architect assisting an admin in strategic project planning.
Given the project goal, suggest 4-6 high-level, strategic tasks to structure the project effectively.
Focus on:
- Defining project phases and milestones
- Assigning appropriate team roles for tasks
- Identifying workflow optimizations
- Establishing performance monitoring strategies
- Ensuring security and compliance considerations
- Planning integration with existing systems
For each suggestion, provide:
- A clear, concise title
- Detailed description (2-3 sentences)
- Priority (high, medium, or low)
- Estimated hours (4-40)
- Suggested role (e.g., Developer, QA Engineer, Project Manager)
Format as JSON array with: title, description, priority, estimatedHours, suggestedRole.
Respond ONLY with valid JSON.`,
        user: `You are a senior software developer assisting a team member in breaking down technical goals.
Given the project goal, suggest 4-6 specific, actionable technical tasks to implement features or solve problems.
Focus on:
- Implementing specific features or components
- Addressing technical challenges or bugs
- Writing unit tests or integration tests
- Updating technical documentation
- Optimizing code performance
- Ensuring code quality and maintainability
For each suggestion, provide:
- A clear, concise title
- Detailed description (2-3 sentences)
- Priority (high, medium, or low)
- Estimated hours (1-20)
Format as JSON array with: title, description, priority, estimatedHours.
Respond ONLY with valid JSON.`,
      };

      const role = userRole === "admin" ? "admin" : "user";
      const systemMessage = systemPrompts[role];

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent({
          contents: [
            {
              parts: [
                {
                  text: `${systemMessage}\nProject Goal: "${projectGoal}"`,
                },
              ],
            },
          ],
        });

        const response = await result.response;
        const text = response.text();

        // Improved response parsing
        let parsed;
        try {
          // Try to extract JSON from markdown code blocks
          const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
          const jsonString = jsonMatch ? jsonMatch[1] : text;
          parsed = JSON.parse(jsonString);
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", parseError);
          // Fallback to manual extraction
          const suggestions = text
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .map((line, index) => {
              const parts = line.split(":");
              return {
                title: parts[0]?.trim() || `Task ${index + 1}`,
                description:
                  parts.slice(1).join(":").trim() || "No description provided",
                priority: "medium",
                estimatedHours: 5,
                ...(role === "admin" && { suggestedRole: "Developer" }),
              };
            });
          parsed = suggestions;
        }

        // Ensure we always have an array
        const suggestions = Array.isArray(parsed) ? parsed : [parsed];

        // Prepare for database storage
        const suggestionsToStore = suggestions.map((suggestion) => ({
          ...suggestion,
          id: generateId("ai_"),
          originalPrompt: projectGoal,
          generatedForRole: role,
          createdAt: new Date().toISOString(),
          status: "suggestion",
          estimatedHours: suggestion.estimatedHours || 5,
          priority: suggestion.priority || "medium",
          ...(role === "admin" && {
            suggestedRole: suggestion.suggestedRole || "Developer",
          }),
        }));

        // Store in database
        await aiSuggestionCollection.insertMany(suggestionsToStore);

        res.status(200).json(suggestionsToStore);
      } catch (error) {
        console.error("Gemini error:", error);
        res.status(500).json({
          error: "Failed to generate AI suggestions.",
          details: error.message,
        });
      }
    });

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Smart WorkFlow is working");
});

server.listen(port, () => {
  console.log(`Smart WorkFlow is working on port ${port}`);
});