import React, { useEffect, useState } from "react";
import {
  Kanban,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Sparkles,
  X,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { toast } from "react-toastify";

const Sidebar = ({
  currentView,
  setCurrentView,
  userId,
  setCurrentProject,
  currentProject,
  isOpen,
  onClose,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Kanban },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "ai-assistant", label: "AI Assistant", icon: Sparkles },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleMenuItemClick = (itemId) => {
    if (itemId === "settings") {
      toast.info("Settings coming soon!");
      return;
    }
    setCurrentView(itemId);
    onClose();
  };

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `https://ai-taskflow-ks8s.onrender.com/projects?userId=${userId}`
        );
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        setProjects(data);

        if (data.length > 0 && !currentProject) {
          setCurrentProject(data[0]);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userId, currentProject, setCurrentProject]);

  return (
    <div
      className={`
        fixed md:static z-40 w-full md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
        flex flex-col h-full transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Logo and Close Button */}
      <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
            <Kanban className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            TaskFlow
          </span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 text-sm sm:text-base ${
                  currentView === item.id
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Projects List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              My Projects
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                Loading projects...
              </span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-4">
              <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                No projects assigned
              </span>
            </div>
          ) : (
            <div
              className="space-y-1 max-h-[200px] overflow-y-auto"
              style={{
                scrollbarWidth: "none" /* Firefox */,
                msOverflowStyle: "none" /* IE/Edge */,
              }}
            >
              {/* WebKit (Chrome/Safari) scrollbar hide - needs to be in CSS */}
              <style jsx>{`
                .space-y-1::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setCurrentProject(project);
                    onClose();
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200 text-sm sm:text-base ${
                    currentProject?.id === project.id
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="truncate font-medium">{project.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          <span className="font-medium">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;