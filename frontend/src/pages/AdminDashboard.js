import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/Admin/AdminSidebar";
import AdminHeader from "../components/Admin/AdminHeader";
import UserManagement from "../components/Admin/UserManagement";
import AdminAnalytics from "../components/Admin/AdminAnalytics";
import AdminTaskAssignment from "../components/Admin/AdminTaskAssignment";
import AIAssistant from "../components/AI/AIAssistant";
import { Plus, Search, X, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

const AdminDashboard = ({ user, onSignOut }) => {
  const [currentView, setCurrentView] = useState("users");
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [selectedUserForTask, setSelectedUserForTask] = useState(null);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectFormData, setProjectFormData] = useState({
    name: "",
    description: "",
    members: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [projectSearchTerm, setProjectSearchTerm] = useState("");
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Fetch all non-admin users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("https://ai-taskflow-ks8s.onrender.com/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      }
    };
    fetchUsers();
  }, []);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const response = await fetch(
        "https://ai-taskflow-ks8s.onrender.com/projects?isAdmin=true"
      );
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data);
      if (
        data.length > 0 &&
        (!currentProject || !data.some((p) => p.id === currentProject.id))
      ) {
        setCurrentProject(data[0]);
      } else if (data.length === 0) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setIsLoadingProjects(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch all tasks for activity log
  const fetchAllTasks = useCallback(async () => {
    try {
      const response = await fetch("https://ai-taskflow-ks8s.onrender.com/tasks?isAdmin=true");
      if (!response.ok) throw new Error("Failed to fetch all tasks");
      const data = await response.json();
      setAllTasks(data);
    } catch (error) {
      console.error("Error fetching all tasks:", error);
      toast.error("Failed to load all tasks for activity log");
    }
  }, []);

  useEffect(() => {
    if (currentView === "activity") {
      fetchAllTasks();
    }
  }, [currentView, fetchAllTasks]);

  // Filter projects based on search term
  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
      project.description
        .toLowerCase()
        .includes(projectSearchTerm.toLowerCase())
  );

  // Filter users for member selection
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle task assignment
  const handleTaskAssignment = async (taskData) => {
    try {
      const response = await fetch("https://ai-taskflow-ks8s.onrender.com/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error("Failed to assign task");
      const assignedTask = await response.json();
      setAllTasks((prev) => [...prev, assignedTask]);
      setShowTaskAssignment(false);
      setSelectedUserForTask(null);
      toast.success("Task assigned successfully");
      await fetchProjects();
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task");
    }
  };

  // Handle project creation
  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!projectFormData.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (!projectFormData.description.trim()) {
      toast.error("Project description is required");
      return;
    }
    if (projectFormData.members.length === 0) {
      toast.error("At least one member must be selected");
      return;
    }

    try {
      const response = await fetch("https://ai-taskflow-ks8s.onrender.com/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...projectFormData,
          status: "active",
          progress: 0,
          createdAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Failed to create project");
      const createdProject = await response.json();
      setProjects((prev) => [...prev, createdProject]);
      setShowProjectForm(false);
      setProjectFormData({ name: "", description: "", members: [] });
      setSearchTerm("");
      toast.success("Project created successfully");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    }
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId) => {
    try {
      const response = await fetch(
        `https://ai-taskflow-ks8s.onrender.com/projects/${projectId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete project");
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      if (currentProject?.id === projectId) {
        setCurrentProject(projects[0] || null);
      }
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  // Toggle member selection
  const handleMemberToggle = (userId) => {
    setProjectFormData((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId],
    }));
  };

  const handleAddTaskFromAI = async (taskData) => {
    try {
      if (!currentProject?.id) {
        toast.error("Please select a project before creating a task from AI.");
        return;
      }

      const newTask = {
        ...taskData,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        projectId: currentProject.id,
        status: taskData.status || "todo",
        priority: taskData.priority || "medium",
        assigneeId: taskData.assigneeId || currentProject.members[0], // Default to first member
      };

      const response = await fetch("https://ai-taskflow-ks8s.onrender.com/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) throw new Error("Failed to create task from AI");

      const createdTask = await response.json();
      setAllTasks((prev) => [...prev, createdTask]);
      toast.success("Task created successfully");
      await fetchProjects();
    } catch (error) {
      console.error("Error creating task from AI:", error);
      toast.error("Failed to create task");
    }
  };

  // Handle project click to show details
  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  // Handle project update
  const handleProjectUpdate = async () => {
    try {
      if (!selectedProject.name || !selectedProject.description) {
        toast.error("Project name and description are required");
        return;
      }

      const response = await fetch(
        `https://ai-taskflow-ks8s.onrender.com/projects/${selectedProject.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedProject.name,
            description: selectedProject.description,
            members: selectedProject.members,
            status: selectedProject.status,
            progress: selectedProject.progress,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update project");
      }

      await fetchProjects();
      toast.success("Project updated successfully");
      setShowProjectDetails(false);
      setSelectedProject(null);
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(error.message || "Failed to update project");
    }
  };

  // Render content based on current view
  const renderContent = () => {
    switch (currentView) {
      case "users":
        return (
          <UserManagement
            onAssignTask={(user) => {
              setSelectedUserForTask(user);
              setShowTaskAssignment(true);
            }}
          />
        );
      case "analytics":
        return <AdminAnalytics />;
      case "ai-assistant":
        return (
          <AIAssistant onAddTask={handleAddTaskFromAI} userRole={user.role} />
        );
      case "activity":
        return (
          <div className="p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Activity Log
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                {allTasks.length > 0 ? (
                  allTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">
                            {users.find((u) => u.id === task.assigneeId)
                              ?.name || task.assigneeId}
                          </span>{" "}
                          was assigned task "{task.title}" in project "
                          {projects.find((p) => p.id === task.projectId)
                            ?.name || task.projectId}
                          "
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(task.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8">
                    No activity to display.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      case "projects":
        return (
          <div className="p-4 sm:p-6">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-4 sm:mb-6 gap-4 xs:gap-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Project Overview
              </h1>
              <div className="flex flex-col xs:flex-row xs:items-center gap-3 sm:gap-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={projectSearchTerm}
                    onChange={(e) => setProjectSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Create Project</span>
                </button>
              </div>
            </div>
            {isLoadingProjects ? (
              <div className="text-center py-8 sm:py-12">
                <div className="inline-block animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Loading projects...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xxs:grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer min-w-0"
                      onClick={() => handleProjectClick(project)}
                    >
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {project.name}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className="text-red-600 hover:text-red-700 font-medium text-sm sm:text-base p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2 xxs:line-clamp-3">
                        {project.description}
                      </p>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {project.members.length} member
                          {project.members.length !== 1 ? "s" : ""}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {project.status}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            Progress
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {project.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              project.progress === 100
                                ? "bg-green-500"
                                : project.progress > 50
                                ? "bg-blue-500"
                                : "bg-orange-500"
                            }`}
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 sm:py-10">
                    <Search className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-4 opacity-50 text-gray-500 dark:text-gray-400" />
                    <p className="text-base sm:text-lg font-medium text-gray-500 dark:text-gray-400">
                      No projects found
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Create your first project.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "settings":
        return (
          <div className="p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Admin Settings
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Admin settings panel coming soon...
              </p>
            </div>
          </div>
        );
      default:
        return (
          <UserManagement
            onAssignTask={(user) => {
              setSelectedUserForTask(user);
              setShowTaskAssignment(true);
            }}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        userId={user.id}
        setCurrentProject={setCurrentProject}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          user={user}
          onSignOut={onSignOut}
          onAssignTask={() => {
            setSelectedUserForTask(null);
            setShowTaskAssignment(true);
          }}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>

      {/* Task Assignment Modal */}
      <AdminTaskAssignment
        selectedUser={selectedUserForTask}
        isOpen={showTaskAssignment}
        onClose={() => {
          setShowTaskAssignment(false);
          setSelectedUserForTask(null);
        }}
        onAssignTask={handleTaskAssignment}
      />

      {/* Project Creation Modal */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-full xs:max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateProject}>
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Create New Project
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectForm(false);
                    setProjectFormData({
                      name: "",
                      description: "",
                      members: [],
                    });
                    setSearchTerm("");
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectFormData.name}
                    onChange={(e) =>
                      setProjectFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={projectFormData.description}
                    onChange={(e) =>
                      setProjectFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project description..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Members *
                  </label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <label
                          key={user.id}
                          className={`flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                            projectFormData.members.includes(user.id)
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={projectFormData.members.includes(user.id)}
                            onChange={() => handleMemberToggle(user.id)}
                            className="mr-3"
                          />
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || "User"}
                              className="w-8 h-8 rounded-full object-cover mx-3"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold mx-3">
                              {user.name?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
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
                      <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        No users found
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 space-x-2 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectForm(false);
                    setProjectFormData({
                      name: "",
                      description: "",
                      members: [],
                    });
                    setSearchTerm("");
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {showProjectDetails && selectedProject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-full xs:max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Project Details: {selectedProject.name}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowProjectDetails(false);
                  setSelectedProject(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={selectedProject.name}
                  onChange={(e) =>
                    setSelectedProject({
                      ...selectedProject,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={selectedProject.description}
                  onChange={(e) =>
                    setSelectedProject({
                      ...selectedProject,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Members
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  {selectedProject.members.length > 0 ? (
                    selectedProject.members.map((memberId) => {
                      const user = users.find((u) => u.id === memberId);
                      return (
                        <div
                          key={memberId}
                          className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || "User"}
                              className="w-8 h-8 rounded-full object-cover mx-3"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold mx-3">
                              {user?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user?.email} • {user?.role || "Unknown"}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedProject({
                                ...selectedProject,
                                members: selectedProject.members.filter(
                                  (id) => id !== memberId
                                ),
                              });
                            }}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      No members assigned
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add New Members
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search users to add..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                  {filteredUsers
                    .filter(
                      (user) => !selectedProject.members.includes(user.id)
                    )
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => {
                          if (!selectedProject.members.includes(user.id)) {
                            setSelectedProject({
                              ...selectedProject,
                              members: [...selectedProject.members, user.id],
                            });
                          }
                        }}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name || "User"}
                            className="w-8 h-8 rounded-full object-cover mx-3"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold mx-3">
                            {user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email} • {user.role || "Unknown"}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors text-sm sm:text-base"
              >
                Delete Project
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectDetails(false);
                    setSelectedProject(null);
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProjectUpdate}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm sm:text-base"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;