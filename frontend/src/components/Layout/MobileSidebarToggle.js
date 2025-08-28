import React from "react";
import { Menu, X } from "lucide-react";

const MobileSidebarToggle = ({ isOpen, toggleSidebar }) => {
  return (
    <button
      onClick={toggleSidebar}
      className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  );
};

export default MobileSidebarToggle;