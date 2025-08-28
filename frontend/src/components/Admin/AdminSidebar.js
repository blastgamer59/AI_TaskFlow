import React from "react";
import {
  Users,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Sparkles,
  Shield,
  FolderKanban,
  Activity,
  X,
} from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

const AdminSidebar = ({
  currentView,
  setCurrentView,
  projects,
  currentProject,
  setCurrentProject,
  isOpen,
  onClose,
}) => {
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: "users", label: "User Management", icon: Users },
    { id: "projects", label: "Project Overview", icon: FolderKanban },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "ai-assistant", label: "AI Assistant", icon: Sparkles },
    { id: "activity", label: "Activity Log", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div
      className={`
        fixed md:static z-40 w-full md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 
        flex flex-col h-full transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      {/* Logo and Close Button */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              TaskFlow Management
            </p>
          </div>
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
                onClick={() => {
                  setCurrentView(item.id);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 text-sm sm:text-base ${
                  currentView === item.id
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
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

export default AdminSidebar;