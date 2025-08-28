import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Calendar, User, Flag } from 'lucide-react';
import clsx from 'clsx';

const TaskCard = ({ task, user, isDragOverlay = false }) => {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: task.id,
    disabled: isDragOverlay,
  });

  const priorityColors = {
    high: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    medium: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  };

  const completedSubtasks = task.subtasks ? task.subtasks.filter((st) => st.completed).length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

  // Calculate if task is overdue (due date passed and task is not completed)
  const isOverdue = task.dueDate && 
                    new Date(task.dueDate) < new Date() && 
                    task.status !== 'done';

  // Apply transform only during active dragging, no transition after drag ends
  const style = !isDragOverlay && transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : 'auto',
      }
    : isDragOverlay 
    ? {
        transform: 'rotate(5deg)',
        zIndex: 1000,
      }
    : {};

  const cardProps = isDragOverlay 
    ? { style }
    : { 
        ref: setNodeRef, 
        style, 
        ...attributes, 
        ...listeners 
      };

  return (
    <div
      {...cardProps}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600',
        isDragging && 'opacity-50',
        isDragOverlay && 'opacity-95 shadow-2xl border-primary-400 dark:border-primary-500',
        isOverdue && 'border-red-200 dark:border-red-800' // Add red border for overdue tasks
      )}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={clsx(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            priorityColors[task.priority]
          )}
        >
          <Flag className="w-3 h-3 mr-1" />
          {task.priority}
        </span>
        {isOverdue && (
          <span className="text-xs text-red-500 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Overdue
          </span>
        )}
      </div>

      <h3 className={clsx(
        'font-semibold mb-2 line-clamp-2',
        isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
      )}>
        {task.title}
      </h3>

      {task.description && (
        <p className={clsx(
          'text-sm mb-3 line-clamp-2',
          isOverdue ? 'text-red-500 dark:text-red-300' : 'text-gray-600 dark:text-gray-400'
        )}>
          {task.description}
        </p>
      )}

      {totalSubtasks > 0 && (
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                isOverdue ? 'bg-red-500' : 'bg-primary-500'
              )}
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
          <span className={clsx(
            'text-xs',
            isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
          )}>
            {completedSubtasks}/{totalSubtasks}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {user && (
            user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
            )
          )}
          {task.dueDate && (
            <div
              className={clsx(
                'flex items-center text-xs',
                isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;