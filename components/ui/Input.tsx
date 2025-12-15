
import React from 'react';
import { Info } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  icon?: React.ReactNode;
  onIconClick?: () => void;
  containerClassName?: string;
  helpText?: string; // New prop for tooltip
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon, 
  onIconClick,
  className = '', 
  containerClassName = '',
  helpText,
  id,
  ...props 
}) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <div className="flex items-center gap-2 mb-1.5">
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          {helpText && (
            <div className="group relative flex items-center">
              <Info size={14} className="text-gray-400 hover:text-brand-500 transition-colors cursor-help" />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] p-2 bg-gray-800 text-white text-xs rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-center pointer-events-none font-normal">
                {helpText}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="relative">
        {icon && (
          <div 
            onClick={onIconClick}
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 ${onIconClick ? 'cursor-pointer hover:text-gray-600 dark:hover:text-gray-300' : 'pointer-events-none'}`}
          >
            {icon}
          </div>
        )}
        <input
          id={id}
          className={`
            w-full py-2.5 rounded-lg border outline-none transition-all
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
            placeholder-gray-400 dark:placeholder-gray-500
            ${icon ? 'pl-10 pr-4' : 'px-4'}
            ${error 
              ? 'border-red-300 dark:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900/50' 
              : 'border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 dark:focus:border-brand-500'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
