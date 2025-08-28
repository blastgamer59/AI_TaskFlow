import React, { useState } from "react";
import { Sparkles, Lightbulb, Loader2, Plus } from "lucide-react";
import { toast } from "react-toastify";

const AIAssistant = ({ onAddTask, userRole }) => {
  const [projectGoal, setProjectGoal] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateSuggestions = async () => {
    if (!projectGoal.trim()) {
      setError("Please describe your project goal");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const response = await fetch(
        "https://ai-taskflow-ks8s.onrender.com/generate-ai-suggestions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectGoal: projectGoal.trim(),
            userRole,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate suggestions");
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error("AI generation error:", error);
      setError(error.message);
      toast.error("Failed to generate suggestions: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addSuggestionAsTask = (suggestion) => {
    try {
      // Transform suggestion into task format
      const taskData = {
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
        estimatedHours: suggestion.estimatedHours,
        status: "todo",
        type: userRole === "admin" ? "management" : "development",
      };

      onAddTask(taskData);
      toast.success("Task added successfully!");
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task: " + error.message);
    }
  };

  const priorityColors = {
    high: "text-red-600 bg-red-100 dark:bg-red-900/30",
    medium: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    low: "text-green-600 bg-green-100 dark:bg-green-900/30",
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {userRole === "admin"
                ? "Get strategic recommendations for project management"
                : "Get technical task suggestions for implementation"}
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {userRole === "admin"
              ? "Describe your project or management challenge"
              : "Describe the feature or technical challenge"}
          </label>
          <textarea
            value={projectGoal}
            onChange={(e) => {
              setProjectGoal(e.target.value);
              setError(null);
            }}
            placeholder={
              userRole === "admin"
                ? "Example: 'Need to optimize our development workflow and improve team productivity'"
                : "Example: 'Implement user authentication with JWT tokens and role-based access control'"
            }
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <button
          onClick={generateSuggestions}
          disabled={!projectGoal.trim() || isLoading}
          className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-primary-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating AI Suggestions...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>
                {userRole === "admin"
                  ? "Get Management Suggestions"
                  : "Get Technical Suggestions"}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Suggestions ({userRole === "admin" ? "Strategic" : "Technical"}
              )
            </h2>
          </div>

          <div className="grid gap-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {suggestion.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      priorityColors[suggestion.priority.toLowerCase()] ||
                      priorityColors.medium
                    }`}
                  >
                    {suggestion.priority}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {suggestion.description}
                </p>

                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Estimated: {suggestion.estimatedHours || "N/A"} hours
                    {suggestion.suggestedRole
                      ? ` • Role: ${suggestion.suggestedRole}`
                      : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {userRole === "admin"
              ? "Ready to optimize your project?"
              : "Need help breaking down your work?"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {userRole === "admin"
              ? "Describe your management challenge to get strategic recommendations for team organization, workflows, and system improvements."
              : "Describe your technical challenge to get actionable task suggestions for implementation."}
          </p>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
