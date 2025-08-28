import React, { useState, useRef, useEffect } from "react";
import { UserPlus, ChevronDown, User, LogOut, Menu } from "lucide-react";
import { toast } from "react-toastify";

const AdminHeader = ({ user, onSignOut, onAssignTask, onToggleSidebar }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    onSignOut();
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Mobile sidebar toggle and search */}
        <div className="flex items-center flex-1 max-w-md">
          <button
            onClick={onToggleSidebar}
            className="md:hidden mr-2 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Assign Task Button */}
          <button
            onClick={onAssignTask}
            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            <UserPlus className="w-4 h-4" />
            <span className="font-medium">Assign Task</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              onMouseEnter={() => setIsUserMenuOpen(true)}
              className="flex items-center space-x-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group"
            >
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-orange-500 transition-all duration-200"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-orange-600 text-white flex items-center justify-center font-semibold ring-2 ring-transparent group-hover:ring-orange-500 transition-all duration-200">
                    {user.name?.[0]?.toUpperCase() || "A"}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>

              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Administrator
                </p>
              </div>

              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isUserMenuOpen && (
              <div
                ref={menuRef}
                onMouseLeave={() => setIsUserMenuOpen(false)}
                className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in slide-in-from-top-2 duration-200"
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center font-semibold">
                        {user.name?.[0]?.toUpperCase() || "A"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      
                      toast.info("View Profile coming soon!", {});
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                  >
                    <User className="w-4 h-4 mr-3 text-gray-500" />
                    <span>View Profile</span>
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="absolute -top-1 right-6 w-2 h-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
