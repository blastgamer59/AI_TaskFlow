import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import Sidebar from "../components/Layout/Sidebar";
import Header from "../components/Layout/Header";
import TaskColumn from "../components/Tasks/TaskColumn";
import AIAssistant from "../components/AI/AIAssistant";
import Analytics from "../components/Analytics/Analytics";
import TaskCard from "../components/Tasks/TaskCard";
import { useTasks } from "../hooks/useTasks";
import useLoggedinuser from "../hooks/useLoggedinuser";
import { toast } from "react-toastify";


const Dashboard = ({ onSignOut }) => {
  const [user] = useLoggedinuser();
  const [currentView, setCurrentView] = useState("dashboard");
  const [draggedTask, setDraggedTask] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8, delay: 100, tolerance: 5 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8, delay: 100 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  const {
    tasks = [],
    users = [],
    projects = [],
    currentProject,
    setCurrentProject,
    updateTask,
    getTasksByStatus,
    getUserById,
  } = useTasks(user?.id || "");

  if (!user || !user.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    const task = tasks.find((task) => task.id === active.id);
    setDraggedTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedTask(null);
    if (!active || !over || active.id === over.id) return;

    const draggedTask = tasks.find((task) => task.id === active.id);
    if (!draggedTask) return;

    let targetColumnId;
    if (over.id.startsWith("column-")) {
      targetColumnId = over.id.replace("column-", "");
    } else {
      const targetTask = tasks.find((task) => task.id === over.id);
      targetColumnId = targetTask ? targetTask.status : null;
    }

    if (targetColumnId && draggedTask.status !== targetColumnId) {
      try {
        await updateTask(draggedTask.id, { status: targetColumnId });
        toast.success("Task status updated successfully");
      } catch (error) {
        console.error("Error updating task status:", error);
        toast.error("Failed to update task status");
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDraggedTask(null);
  };

  const handleAddTaskFromAI = async (taskData) => {
    if (!currentProject?.id) {
      toast.error("Please select a project before creating a task");
      return;
    }

    try {
      const newTask = {
        ...taskData,
        projectId: currentProject.id,
        assigneeId: user.id,
        status: taskData.status || "todo",
        priority: taskData.priority || "medium",
        createdAt: new Date().toISOString(),
        title: taskData.title || "Untitled Task",
        description: taskData.description || "",
        estimatedHours: taskData.estimatedHours || 5,
      };

      const response = await fetch("https://ai-taskflow-ks8s.onrender.com/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      toast.success("Task created successfully!");
    } catch (error) {
      console.error("Error creating task from AI:", error);
      toast.error("Failed to create task: " + error.message);
    }
  };

  const columns = [
    { id: "todo", title: "To Do", color: "blue" },
    { id: "in-progress", title: "In Progress", color: "amber" },
    { id: "done", title: "Done", color: "green" },
  ];

  const renderContent = () => {
    switch (currentView) {
      case "analytics":
        return <Analytics userId={user.id} isAdmin={user.role === "admin"} />;
      case "ai-assistant":
        return (
          <AIAssistant onAddTask={handleAddTaskFromAI} userRole={user.role} />
        );
      default:
        return (
          <div className="p-4 sm:p-6">
            {currentProject ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 truncate">
                      {currentProject.name}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">
                      {currentProject.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-end sm:justify-start space-x-2 sm:space-x-4">
                    <div className="flex -space-x-1 sm:-space-x-2">
                      {currentProject.members.map((userId) => {
                        const member = getUserById(userId);
                        return member ? (
                          <div
                            key={member.id}
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium text-xs sm:text-sm border-2 border-white dark:border-gray-800"
                            title={member.name}
                          >
                            {member.name?.[0]?.toUpperCase() || "U"}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-4 lg:space-x-6 space-y-4 sm:space-y-0">
                  {columns.map((column) => (
                    <TaskColumn
                      key={column.id}
                      columnId={column.id}
                      title={column.title}
                      tasks={getTasksByStatus(column.id)}
                      users={users}
                      color={column.color}
                      isDragging={!!activeId}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-600 dark:text-gray-400">
                No projects assigned to you.
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        userId={user.id}
        setCurrentProject={setCurrentProject}
        currentProject={currentProject}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={user}
          onSignOut={onSignOut}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {renderContent()}
            <DragOverlay>
              {draggedTask && (
                <div className="w-full max-w-xs">
                  <TaskCard
                    task={draggedTask}
                    user={getUserById(draggedTask.assigneeId)}
                    isDragOverlay={true}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;