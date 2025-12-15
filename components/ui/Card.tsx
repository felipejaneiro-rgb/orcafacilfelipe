
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, icon, action }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors ${className}`}>
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
           <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
             {icon && <span className="mr-2 text-brand-600 dark:text-brand-400">{icon}</span>}
             {title}
           </h2>
           {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
