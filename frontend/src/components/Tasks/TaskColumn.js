import React from "react";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import clsx from "clsx";

const TaskColumn = ({
  columnId,
  title,
  tasks,
  users,
  onTaskClick,
  color = "gray",
  isDragging = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${columnId}` });

  const getUserById = (userId) =>
    users.find((user) => user.id === userId) || {
      name: "Unknown",
      avatar: "",
      id: userId,
    };

  const handleTaskClick = (task) => (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onTaskClick) onTaskClick(task);
  };

  const colorClasses = {
    blue: "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
    amber: "border-amber-500 bg-amber-50 dark:bg-amber-900/20",
    green: "border-green-500 bg-green-50 dark:bg-green-900/20",
    gray: "border-gray-300 bg-gray-50 dark:bg-gray-800/50",
  };

  const columnColorClass = clsx(
    "min-h-[200px] p-2 sm:p-3 rounded-lg transition-colors duration-200",
    isOver && isDragging
      ? colorClasses[color]
      : "border border-transparent",
    isDragging && "pointer-events-auto"
  );

  return (
    <div className="w-full sm:w-[calc(33.333%-1rem)] lg:w-[calc(33.333%-1.5rem)]">
      <div className="h-full bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h2>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
        </div>

        <div ref={setNodeRef} className={columnColorClass}>
          {tasks.map((task) => (
            <div 
              key={task.id} 
              onClick={handleTaskClick(task)} 
              className="mb-2 sm:mb-3 last:mb-0"
            >
              <TaskCard task={task} user={getUserById(task.assigneeId)} />
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm sm:text-base italic">
                No tasks under <strong>{title}</strong> yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskColumn;