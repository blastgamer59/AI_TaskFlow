import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Clock, CheckCircle2, AlertCircle, Calendar, Target } from 'lucide-react';

const Analytics = ({ userId, isAdmin }) => {
  const [analytics, setAnalytics] = useState({
    userStats: {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      totalProjects: 0,
      completionRate: 0,
      averageCompletionTime: 0
    },
    tasksByStatus: [],
    tasksByPriority: [],
    monthlyProgress: [],
    projectProgress: [],
    loading: true,
    error: null
  });

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setAnalytics(prev => ({ ...prev, loading: true }));
      
      // Fetch all necessary data in parallel
      const [tasksResponse, projectsResponse] = await Promise.all([
        fetch(`https://ai-taskflow-ks8s.onrender.com/tasks?assigneeId=${userId}`),
        fetch(`https://ai-taskflow-ks8s.onrender.com/projects?userId=${userId}`)
      ]);

      if (!tasksResponse.ok || !projectsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [tasks, projects] = await Promise.all([
        tasksResponse.json(),
        projectsResponse.json()
      ]);

      // Process the data
      const processedData = processAnalyticsData(tasks, projects);
      
      setAnalytics(prev => ({
        ...prev,
        ...processedData,
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load analytics data'
      }));
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAnalyticsData();
    }
  }, [fetchAnalyticsData, userId]);

  const processAnalyticsData = (tasks, projects) => {
    // Calculate task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const pendingTasks = tasks.filter(task => task.status === 'todo').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tasks by status for pie chart
    const tasksByStatus = [
      { name: 'Completed', value: completedTasks, color: '#10B981' },
      { name: 'In Progress', value: inProgressTasks, color: '#F59E0B' },
      { name: 'To Do', value: pendingTasks, color: '#EF4444' }
    ].filter(item => item.value > 0);

    // Tasks by priority
    const priorityCount = {
      high: tasks.filter(task => task.priority === 'high').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      low: tasks.filter(task => task.priority === 'low').length
    };

    const tasksByPriority = [
      { name: 'High', value: priorityCount.high, color: '#EF4444' },
      { name: 'Medium', value: priorityCount.medium, color: '#F59E0B' },
      { name: 'Low', value: priorityCount.low, color: '#10B981' }
    ].filter(item => item.value > 0);

    // Monthly progress (last 6 months)
    const monthlyProgress = generateMonthlyProgress(tasks);

    // Project progress
    const projectProgress = projects.map(project => ({
      name: project.name,
      progress: project.progress || 0,
      status: project.status
    }));

    // Calculate average completion time based on actual completion dates if available
    const avgCompletionTime = calculateAverageCompletionTime(tasks);

    return {
      userStats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        totalProjects: projects.length,
        completionRate,
        averageCompletionTime: avgCompletionTime
      },
      tasksByStatus,
      tasksByPriority,
      monthlyProgress,
      projectProgress
    };
  };

  const generateMonthlyProgress = (tasks) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'short' });
      
      // Filter tasks created in this month
      const monthTasks = tasks.filter(task => {
        if (!task.createdAt) return false;
        const taskDate = new Date(task.createdAt);
        return taskDate.getMonth() === month.getMonth() && 
               taskDate.getFullYear() === month.getFullYear();
      });
      
      const completed = monthTasks.filter(task => task.status === 'done').length;
      const pending = monthTasks.filter(task => task.status !== 'done').length;
      
      months.push({
        name: monthName,
        completed,
        pending,
        total: monthTasks.length
      });
    }
    
    return months;
  };

  const calculateAverageCompletionTime = (tasks) => {
    const completedTasks = tasks.filter(task => task.status === 'done');
    if (completedTasks.length === 0) return 0;
    
    // Calculate average completion time in days if we have both createdAt and completedAt
    const tasksWithCompletionTime = completedTasks.filter(
      task => task.createdAt && task.completedAt
    );
    
    if (tasksWithCompletionTime.length === 0) return 0;
    
    const totalDays = tasksWithCompletionTime.reduce((sum, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.completedAt);
      const diffTime = Math.abs(completed - created);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    
    return (totalDays / tasksWithCompletionTime.length).toFixed(1);
  };

  const stats = [
    {
      name: 'Total Tasks',
      value: analytics.userStats.totalTasks.toString(),
      change: `${analytics.userStats.completionRate}% completed`,
      changeType: 'positive',
      icon: CheckCircle2
    },
    {
      name: 'Active Projects',
      value: analytics.userStats.totalProjects.toString(),
      change: `${analytics.projectProgress.filter(p => p.status === 'active').length} active`,
      changeType: 'neutral',
      icon: Target
    },
    {
      name: 'Completion Rate',
      value: `${analytics.userStats.completionRate}%`,
      change: `${analytics.userStats.completedTasks}/${analytics.userStats.totalTasks} tasks`,
      changeType: analytics.userStats.completionRate >= 70 ? 'positive' : 'negative',
      icon: TrendingUp
    },
    {
      name: 'Avg. Completion Time',
      value: `${analytics.userStats.averageCompletionTime} days`,
      change: 'based on completed tasks',
      changeType: 'neutral',
      icon: Clock
    }
  ];

  if (analytics.loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (analytics.error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="font-medium text-red-800 dark:text-red-200">Error Loading Analytics</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mt-2">{analytics.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your personal productivity and task performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className={`text-sm font-medium ${
                    stat.changeType === 'positive' 
                      ? 'text-green-600 dark:text-green-400' 
                      : stat.changeType === 'negative'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Status Distribution */}
        {analytics.tasksByStatus.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.tasksByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.tasksByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Task Priority Distribution */}
        {analytics.tasksByPriority.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.tasksByPriority}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.tasksByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Progress */}
        {analytics.monthlyProgress.some(month => month.total > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Task Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Project Progress */}
        {analytics.projectProgress.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.projectProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="progress" fill="#6366F1" name="Progress %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.userStats.completionRate >= 70 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">Great Performance</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                You have a {analytics.userStats.completionRate}% task completion rate. Keep up the excellent work!
              </p>
            </div>
          )}

          {analytics.userStats.inProgressTasks > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="font-medium text-amber-800 dark:text-amber-200">Tasks in Progress</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You have {analytics.userStats.inProgressTasks} tasks currently in progress. Focus on completing them before taking on new ones.
              </p>
            </div>
          )}

          {analytics.userStats.pendingTasks > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-800 dark:text-blue-200">Pending Tasks</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You have {analytics.userStats.pendingTasks} tasks waiting to be started. Consider prioritizing them.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;