import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

export const useTasks = (userId) => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]); // For displaying assignee names
  const [projects, setProjects] = useState([]); // Projects assigned to this specific user
  const [currentProject, setCurrentProject] = useState(null);

  // Fetch all users (for displaying assignee names in tasks)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("https://ai-taskflow-ks8s.onrender.com/users");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch projects assigned to the current user
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!userId) {
          setProjects([]);
          setCurrentProject(null);
          return;
        }

        // Fetch projects where the user is a member
        const response = await fetch(
          `https://ai-taskflow-ks8s.onrender.com/projects?userId=${userId}`
        );

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = await response.json();
        setProjects(data);

        // Set current project: if previous current project is still in the list, keep it.
        // Otherwise, set the first project from the fetched list, or null if no projects.
        setCurrentProject(prev => {
          if (prev && data.some(p => p.id === prev.id)) {
            return prev;
          }
          return data.length > 0 ? data[0] : null;
        });

      } catch (error) {
        console.error("Project fetch error:", error);
        setProjects([]);
        setCurrentProject(null);
        toast.error("Failed to load projects");
      }
    };
    fetchProjects();
  }, [userId]); // Re-fetch when userId changes

  // Fetch tasks for the currently selected project and assigned to the current user
  const fetchTasks = useCallback(async () => {
    if (!currentProject?.id || !userId) {
      setTasks([]);
      return;
    }

    try {
      // Fetch tasks for the specific project AND assigned to the specific user
      const response = await fetch(
        `https://ai-taskflow-ks8s.onrender.com/tasks?projectId=${currentProject.id}&userId=${userId}`
      );
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    }
  }, [currentProject?.id, userId]); // Re-fetch when currentProject or userId changes

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]); // Effect to run fetchTasks when its dependencies change

  // Add Task (might be used if users can create their own tasks, otherwise remove)
  const addTask = async (taskData) => {
    try {
      const response = await fetch("https://ai-taskflow-ks8s.onrender.com/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (response.ok) {
        const savedTask = await response.json();
        setTasks((prev) => [...prev, savedTask]);
        toast.success("Task added successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add task");
      }
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error(error.message || "Failed to add task");
    }
  };

  // Update Task
  const updateTask = async (taskId, updates) => {
    try {
      const response = await fetch(`https://ai-taskflow-ks8s.onrender.com/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          )
        );
        toast.success("Task updated successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(error.message || "Failed to update task");
    }
  };

  // Delete Task
  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`https://ai-taskflow-ks8s.onrender.com/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
        toast.success("Task deleted successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(error.message || "Failed to delete task");
    }
  };

  // Update Task Status (used for drag & drop)
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`https://ai-taskflow-ks8s.onrender.com/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error(error.message || "Failed to update task status");
    }
  };

  // Reorder Tasks (drag & drop logic)
  const reorderTasks = async (activeId, overId) => {
    if (!overId) return;

    const activeTask = tasks.find((task) => task.id === activeId);
    if (!activeTask) return;

    // If dropped onto a column, update status
    if (overId.startsWith("column-")) {
      const newStatus = overId.replace("column-", "");
      await updateTaskStatus(activeId, newStatus);
      return;
    }

    // If reordering within the same column
    const overTask = tasks.find((task) => task.id === overId);
    if (overTask && activeTask.status === overTask.status) {
      setTasks((prev) => {
        const newTasks = [...prev];
        const activeIndex = newTasks.findIndex((task) => task.id === activeId);
        const overIndex = newTasks.findIndex((task) => task.id === overId);
        const [movedTask] = newTasks.splice(activeIndex, 1);
        newTasks.splice(overIndex, 0, movedTask);
        return newTasks;
      });
    }
  };

  // Helper to get tasks filtered by status for display in columns
  const getTasksByStatus = useCallback((status) => {
    return tasks
      .filter(
        (task) =>
          task.status === status &&
          task.projectId === currentProject?.id &&
          task.assigneeId === userId
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [tasks, currentProject?.id, userId]);

  // Helper to get user details by ID (e.g., for displaying assignee names)
  const getUserById = useCallback((id) => {
    return users.find((user) => user.id === id);
  }, [users]);

  return {
    tasks,
    users, // All users (non-admin)
    projects, // Projects assigned to this user
    currentProject,
    setCurrentProject,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    reorderTasks,
    getTasksByStatus,
    getUserById,
  };
};
