import React, { useState } from "react";
import { Mail, ArrowLeft, Kanban, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { toast } from "react-toastify";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Check if email is registered and if it's an admin
      console.log("Checking email:", email); // Debug log
      const response = await fetch("https://ai-taskflow-ks8s.onrender.com/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Server response:", data); // Debug log

      // Check if there's an error in the response
      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        return;
      }

      // Check if the email is not registered
      if (!data.registered) {
        toast.error("No account found with this email address");
        setIsLoading(false);
        return;
      }

      // Check if the user is an admin
      if (data.isAdmin === true) {
        toast.error(
          "Admin account cannot reset password."
        );
        setIsLoading(false);
        return;
      }

      // Send password reset email for regular users only
      console.log("Sending password reset email to regular user"); // Debug log
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email, {
        url: `https://ai-taskflow.vercel.app/login`,
        handleCodeInApp: true,
      });

      toast.success("Password reset link has been sent to your email.");
      setIsSubmitted(true);
    } catch (err) {
      console.error("Error in forgot password:", err);

      // Handle specific Firebase errors
      if (err.code === "auth/user-not-found") {
        toast.error("No account found with this email address");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Please enter a valid email address");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl mb-4">
                <Kanban className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                TaskFlow
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                AI-Enhanced Project Management
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Check Your Email
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We've sent a password reset link to{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {email}
                  </span>
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Didn't receive the email?</strong> Check your
                    spam/junk folder, or try again in a few minutes. The email
                    may take up to 5 minutes to arrive.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 transition-all duration-200"
                  >
                    Try Different Email
                  </button>

                  <Link
                    to="/login"
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl mb-4">
              <Kanban className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              TaskFlow
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-Enhanced Project Management
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Forgot Password?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                No worries! Enter your email address and we'll send you a link
                to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 border-gray-300 dark:border-gray-600"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Sending Reset Link...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Kanban className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                © 2025 TaskFlow. All rights reserved.
              </span>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-end items-center space-x-6 text-sm">
              <a
                href="/forgot-password"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/forgot-password"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/forgot-password"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Support
              </a>
              <a
                href="/forgot-password"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
              Streamline your workflow with AI-powered project management. Built
              for teams that move fast.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
