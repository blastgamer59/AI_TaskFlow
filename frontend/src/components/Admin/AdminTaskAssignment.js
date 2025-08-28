import React, { useState, useEffect } from "react";
import { X, Search, Plus } from "lucide-react";
import { toast } from "react-toastify";
import io from "socket.io-client";

const socket = io("https://ai-taskflow-ks8s.onrender.com"); 

const AdminTaskAssignment = ({
  selectedUser,
  isOpen,
  onClose,
  onAssignTask,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assigneeId: selectedUser?.id || "",
    projectId: "",
    dueDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all non-admin users for the assignee dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await fetch("https://ai-taskflow-ks8s.onrender.com/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(
          data
            .filter((user) => user.email)
            .map((user) => ({
              ...user,
              id: user.id || `user-${Math.random().toString(36).substr(2, 9)}`,
            }))
        );
      } catch (error) {
        console.error("Error fetching users:", error.message);
        setError("Failed to load users. Please try again.");
        toast.error(error.message || "Failed to load users");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch all projects for the project dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await fetch(
          `https://ai-taskflow-ks8s.onrender.com/projects?isAdmin=true`
        );
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        setProjects(
          data.map((project) => ({
            ...project,
            id:
              project.id ||
              `project-${Math.random().toString(36).substr(2, 9)}`,
          }))
        );
      } catch (error) {
        console.error("Error:", error.message);
        toast.error("Failed to load projects");
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Update form data when selectedUser prop changes
  useEffect(() => {
    if (selectedUser?.id) {
      setFormData((prev) => ({
        ...prev,
        assigneeId: selectedUser.id,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        assigneeId: "",
      }));
    }
  }, [selectedUser]);

  // Socket.IO real-time listeners - FIXED
  useEffect(() => {
    const handleProjectCreated = (eventData) => {
      console.log("Project created event received:", eventData);
      // Extract the actual project data from the event
      const newProject = eventData.data || eventData;
      
      // Ensure the project has the required structure
      const projectToAdd = {
        ...newProject,
        id: newProject.id || `project-${Math.random().toString(36).substr(2, 9)}`,
      };

      setProjects((prev) => {
        // Check if project already exists to avoid duplicates
        const exists = prev.some(p => p.id === projectToAdd.id);
        if (exists) {
          console.log("Project already exists, skipping...");
          return prev;
        }
        console.log("Adding new project to state:", projectToAdd);
        return [...prev, projectToAdd];
      });
      
      // Show success notification
      toast.success(`New project "${newProject.name}" was created!`);
    };

    const handleProjectUpdated = (eventData) => {
      console.log("Project updated event received:", eventData);
      const updatedProject = eventData.data || eventData;
      
      setProjects((prev) =>
        prev.map((project) =>
          project.id === updatedProject.id 
            ? { ...project, ...updatedProject } 
            : project
        )
      );
      
      toast.info(`Project "${updatedProject.name}" was updated!`);
    };

    const handleProjectDeleted = (eventData) => {
      console.log("Project deleted event received:", eventData);
      const deletedProject = eventData.data || eventData;
      
      setProjects((prev) => {
        const filteredProjects = prev.filter((project) => project.id !== deletedProject.id);
        
        // If the deleted project was selected in the form, clear the selection
        setFormData(prevForm => {
          if (prevForm.projectId === deletedProject.id) {
            return { ...prevForm, projectId: "" };
          }
          return prevForm;
        });
        
        return filteredProjects;
      });
      
      toast.warning("A project was deleted!");
    };

    const handleUserCreated = (eventData) => {
      console.log("User created event received:", eventData);
      const newUser = eventData.data || eventData;
      
      // Only add if it's not an admin user
      if (newUser.role !== "admin") {
        const userToAdd = {
          ...newUser,
          id: newUser.id || `user-${Math.random().toString(36).substr(2, 9)}`,
        };

        setUsers((prev) => {
          // Check if user already exists to avoid duplicates
          const exists = prev.some(u => u.id === userToAdd.id || u.email === userToAdd.email);
          if (exists) {
            console.log("User already exists, skipping...");
            return prev;
          }
          console.log("Adding new user to state:", userToAdd);
          return [...prev, userToAdd];
        });
        
        toast.success(`New user "${newUser.name}" was registered!`);
      }
    };

    const handleUserDeleted = (eventData) => {
      console.log("User deleted event received:", eventData);
      const deletedUser = eventData.data || eventData;
      
      setUsers((prev) => {
        const filteredUsers = prev.filter((user) => user.id !== deletedUser.id);
        
        // If the deleted user was selected in the form, clear the selection
        setFormData(prevForm => {
          if (prevForm.assigneeId === deletedUser.id) {
            return { ...prevForm, assigneeId: "" };
          }
          return prevForm;
        });
        
        return filteredUsers;
      });
      
      toast.warning("A user was deleted!");
    };

    // Add event listeners
    socket.on("projectCreated", handleProjectCreated);
    socket.on("projectUpdated", handleProjectUpdated);
    socket.on("projectDeleted", handleProjectDeleted);
    socket.on("userCreated", handleUserCreated);
    socket.on("userDeleted", handleUserDeleted);

    // Cleanup function
    return () => {
      socket.off("projectCreated", handleProjectCreated);
      socket.off("projectUpdated", handleProjectUpdated);
      socket.off("projectDeleted", handleProjectDeleted);
      socket.off("userCreated", handleUserCreated);
      socket.off("userDeleted", handleUserDeleted);
    };
  }, []); // Empty dependency array is correct here

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Task title is required.");
      toast.error("Task title is required");
      return;
    }
    if (!formData.assigneeId) {
      setError("Please select a user to assign the task to.");
      toast.error("Please select a user to assign the task");
      return;
    }
    if (!formData.projectId) {
      setError("Please select a project.");
      toast.error("Please select a project");
      return;
    }

    try {
      const taskDataToSend = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assigneeId: formData.assigneeId,
        projectId: formData.projectId,
        dueDate: formData.dueDate,
      };

      await onAssignTask(taskDataToSend);

      onClose();
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        assigneeId: selectedUser?.id || "",
        projectId: "",
        dueDate: "",
      });
      setSearchTerm("");
      setError(null);
    } catch (error) {
      console.error("Error assigning task:", error.message);
      setError(error.message || "Failed to assign task. Please try again.");
      toast.error(error.message || "Failed to assign task");
    }
  };

  // Handler for selecting an assignee
  const handleUserSelect = (userId) => {
    if (!userId) {
      setError("Invalid user selected.");
      toast.error("Invalid user selected");
      return;
    }
    setFormData((prev) => ({ ...prev, assigneeId: userId }));
  };

  // Generic input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Reset form when modal closes
  const handleClose = () => {
    onClose();
    setFormData({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assigneeId: selectedUser?.id || "",
      projectId: "",
      dueDate: "",
    });
    setSearchTerm("");
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-full xs:max-w-md sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Assign New Task
              </h2>
              {selectedUser && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Assigning to: {selectedUser.name || "Unknown"} (
                  {selectedUser.email})
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task title..."
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task description..."
              />
            </div>

            {/* Assign To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign To *
              </label>
              {selectedUser ? (
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt={selectedUser.name || "User"}
                      className="w-8 h-8 rounded-full object-cover mr-3"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold mr-3 ${
                      selectedUser.avatar ? "hidden" : "flex"
                    }`}
                  >
                    {selectedUser.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedUser.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedUser.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUserSelect("")}
                    className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                    {isLoadingUsers ? (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                        Loading users...
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <label
                          key={user.id}
                          className={`flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            formData.assigneeId === user.id
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="assignee"
                            value={user.id}
                            checked={formData.assigneeId === user.id}
                            onChange={() => handleUserSelect(user.id)}
                            className="mr-3"
                          />
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || "User"}
                              className="w-8 h-8 rounded-full object-cover mx-3"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold mx-3 ${
                              user.avatar ? "hidden" : "flex"
                            }`}
                          >
                            {user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email} • {user.role || "Unknown"}
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No users found
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project *
              </label>
              {isLoadingProjects ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Loading projects...
                </div>
              ) : projects.length > 0 ? (
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No projects available
                </div>
              )}
            </div>

            {/* Priority & Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Initial Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminTaskAssignment;