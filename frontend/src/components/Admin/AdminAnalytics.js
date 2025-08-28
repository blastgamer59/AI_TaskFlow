import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
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
import { TrendingUp, Users, Clock, CheckCircle2, Activity, UserPlus, AlertCircle } from 'lucide-react';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    users: [],
    tasks: [],
    projects: [],
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalProjects: 0,
      activeProjects: 0
    }
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [usersRes, tasksRes, projectsRes] = await Promise.all([
        fetch('https://ai-taskflow-ks8s.onrender.com/users'),
        fetch('https://ai-taskflow-ks8s.onrender.com/tasks?isAdmin=true'),
        fetch('https://ai-taskflow-ks8s.onrender.com/projects?isAdmin=true')
      ]);

      const users = await usersRes.json();
      const tasks = await tasksRes.json();
      const projects = await projectsRes.json();

      // Calculate stats
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(user => user.role !== 'admin').length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === 'done').length,
        totalProjects: projects.length,
        activeProjects: projects.filter(project => project.status === 'active').length
      };

      setAnalyticsData({
        users,
        tasks,
        projects,
        stats
      });
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate task completion rate
  const getTaskCompletionRate = () => {
    if (analyticsData.stats.totalTasks === 0) return 0;
    return ((analyticsData.stats.completedTasks / analyticsData.stats.totalTasks) * 100).toFixed(1);
  };

  // Generate task status distribution
  const getTaskStatusDistribution = () => {
    const statusCounts = analyticsData.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
      value: count,
      color: getStatusColor(status)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return '#6b7280';
      case 'in-progress': return '#f59e0b';
      case 'done': return '#10b981';
      default: return '#6366f1';
    }
  };

  // Generate priority distribution
  const getPriorityDistribution = () => {
    const priorityCounts = analyticsData.tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count,
      color: getPriorityColor(priority)
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6366f1';
    }
  };

  // Generate team workload data
  const getTeamWorkload = () => {
    const userTaskCounts = analyticsData.tasks.reduce((acc, task) => {
      acc[task.assigneeId] = (acc[task.assigneeId] || 0) + 1;
      return acc;
    }, {});

    return analyticsData.users.map(user => ({
      name: user.name,
      tasks: userTaskCounts[user.id] || 0,
      id: user.id
    })).sort((a, b) => b.tasks - a.tasks);
  };

  // Generate project progress data
  const getProjectProgress = () => {
    return analyticsData.projects.map(project => ({
      name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
      progress: project.progress || 0,
      tasks: analyticsData.tasks.filter(task => task.projectId === project.id).length,
      status: project.status
    })).sort((a, b) => b.progress - a.progress);
  };

  // Generate monthly task completion trend (last 6 months)
  const getTaskCompletionTrend = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      last6Months.push({
        name: months[monthIndex],
        month: monthIndex + 1,
        year: year
      });
    }

    return last6Months.map(month => {
      const monthTasks = analyticsData.tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.getMonth() + 1 === month.month && taskDate.getFullYear() === month.year;
      });

      const completed = monthTasks.filter(task => task.status === 'done').length;
      const pending = monthTasks.filter(task => task.status !== 'done').length;

      return {
        name: month.name,
        completed,
        pending
      };
    });
  };

  const stats = [
    {
      name: 'Total Users',
      value: analyticsData.stats.totalUsers,
      change: analyticsData.stats.activeUsers > 0 ? `${analyticsData.stats.activeUsers} active` : 'No active users',
      changeType: 'neutral',
      icon: Users
    },
    {
      name: 'Total Tasks',
      value: analyticsData.stats.totalTasks,
      change: `${getTaskCompletionRate()}% completed`,
      changeType: analyticsData.stats.completedTasks > 0 ? 'positive' : 'neutral',
      icon: CheckCircle2
    },
    {
      name: 'Active Projects',
      value: analyticsData.stats.activeProjects,
      change: `${analyticsData.stats.totalProjects} total`,
      changeType: 'neutral',
      icon: Activity
    },
    {
      name: 'Completion Rate',
      value: `${getTaskCompletionRate()}%`,
      change: `${analyticsData.stats.completedTasks}/${analyticsData.stats.totalTasks} tasks`,
      changeType: parseFloat(getTaskCompletionRate()) > 50 ? 'positive' : 'negative',
      icon: TrendingUp
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="font-medium text-red-800 dark:text-red-200">Error</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mt-2">{error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Real-time overview of system performance and user activity</p>
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
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Task Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Status Distribution</h3>
          {getTaskStatusDistribution().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getTaskStatusDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getTaskStatusDistribution().map((entry, index) => (
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
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No task data available
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Priority Distribution</h3>
          {getPriorityDistribution().length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getPriorityDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getPriorityDistribution().map((entry, index) => (
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
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No priority data available
            </div>
          )}
        </div>
      </div>

      {/* Team Workload */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Workload</h3>
        {getTeamWorkload().length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getTeamWorkload()}>
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
              <Bar dataKey="tasks" fill="#ef4444" name="Assigned Tasks" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No team workload data available
          </div>
        )}
      </div>

      {/* Project Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Progress Overview</h3>
        {getProjectProgress().length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getProjectProgress()}>
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
              <Bar dataKey="progress" fill="#ef4444" name="Progress %" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No project data available
          </div>
        )}
      </div>

      {/* Task Completion Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Completion Trend (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={getTaskCompletionTrend()}>
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
            <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} name="Completed Tasks" />
            <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={3} name="Pending Tasks" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* System Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-800 dark:text-green-200">Task Completion</span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            {analyticsData.stats.completedTasks} tasks completed out of {analyticsData.stats.totalTasks} total tasks ({getTaskCompletionRate()}% completion rate).
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-800 dark:text-blue-200">Project Status</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {analyticsData.stats.activeProjects} active projects out of {analyticsData.stats.totalProjects} total projects are currently in progress.
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-800 dark:text-purple-200">Team Overview</span>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {analyticsData.stats.activeUsers} active team members are currently working on various projects and tasks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;