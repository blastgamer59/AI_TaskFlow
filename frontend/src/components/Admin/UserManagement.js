import React, { useState, useEffect } from "react";
import { Eye, Trash2, Search, UserPlus, X } from "lucide-react";
import { toast } from "react-toastify";
import ConfirmationDialog from "./ConfirmationDialog";

const UserManagement = ({ onAssignTask }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userTasks, setUserTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("https://ai-taskflow-ks8s.onrender.com/users");
        if (!response.ok) throw new Error("Failed to fetch users");
        const data = await response.json();
        setUsers(
          data.map((user) => ({
            ...user,
            id: user.id || `user-${Math.random().toString(36).substr(2, 9)}`,
          }))
        );
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users. Please try again.");
        toast.error("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const fetchUserTasks = async (userId) => {
    setIsTasksLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://ai-taskflow-ks8s.onrender.com/tasks?assigneeId=${userId}&isAdmin=true`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch tasks");
      }
      const data = await response.json();
      setUserTasks(data);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      setError(error.message || "Failed to load tasks. Please try again.");
      toast.error(error.message || "Failed to load tasks");
      setUserTasks([]);
    } finally {
      setIsTasksLoading(false);
    }
  };

  const handleDeleteClick = (userId) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(
        `https://ai-taskflow-ks8s.onrender.com/users/${userToDelete}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(text || "Invalid server response");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setUsers((prev) => prev.filter((user) => user.id !== userToDelete));

      if (selectedUser?.id === userToDelete) {
        setShowUserModal(false);
        setSelectedUser(null);
      }

      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      let errorMessage = "Failed to delete user. Please try again.";

      if (error.message.includes("<!DOCTYPE html>")) {
        errorMessage = "Server error occurred";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    return (
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const UserModal = ({ user, isOpen, onClose, userTasks, isTasksLoading }) => {
    if (!isOpen || !user) return null;

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-full xs:max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 sm:w-16 h-12 sm:h-16 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-lg sm:text-xl ${
                    user.avatar ? "hidden" : "flex"
                  }`}
                >
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {user.name || "Unknown User"}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email || "No email"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Current Tasks
            </h3>
            {isTasksLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Loading tasks...
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userTasks.length > 0 ? (
                  userTasks.map((task) => (
                    <div
                      key={
                        task.id ||
                        `task-${Math.random().toString(36).substr(2, 9)}`
                      }
                      className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div>
                        <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                          {task.title || "Untitled Task"}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.description || "No description provided"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              task.status === "todo"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : task.status === "in-progress"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            }`}
                          >
                            {task.status?.replace("-", " ")?.toUpperCase() ||
                              "UNKNOWN"}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                      No tasks assigned to this user
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end space-x-2 sm:space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onAssignTask(user);
                  toast.success(
                    `Task assignment opened for ${user.name || "user"}`
                  );
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assign Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
              User Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Manage team members and their tasks
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 text-sm sm:text-base">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 sm:py-12">
          <div className="inline-block animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Loading users...
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <tr
                      key={user.id || `user-${index}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 sm:w-10 h-8 sm:h-10 rounded-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold ${
                              user.avatar ? "hidden" : "flex"
                            }`}
                          >
                            {user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="ml-3 sm:ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || "Unknown User"}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {user.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                              fetchUserTasks(user.id);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 sm:p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="View User Details"
                          >
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => {
                              onAssignTask(user);
                              toast.success(
                                `Task assignment opened for ${
                                  user.name || "user"
                                }`
                              );
                            }}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1 sm:p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                            title="Assign Task"
                          >
                            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Search className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-base sm:text-lg font-medium">
                          No users found
                        </p>
                        <p className="text-sm">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="block sm:hidden space-y-4 p-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <div
                  key={user.id || `user-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold ${
                          user.avatar ? "hidden" : "flex"
                        }`}
                      >
                        {user.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || "Unknown User"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                        fetchUserTasks(user.id);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="View User Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onAssignTask(user);
                        toast.success(
                          `Task assignment opened for ${user.name || "user"}`
                        );
                      }}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                      title="Assign Task"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Search className="w-10 h-10 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                  No users found
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search criteria
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={deleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />

      <UserModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
          setUserTasks([]);
        }}
        userTasks={userTasks}
        isTasksLoading={isTasksLoading}
      />
    </div>
  );
};

export default UserManagement;