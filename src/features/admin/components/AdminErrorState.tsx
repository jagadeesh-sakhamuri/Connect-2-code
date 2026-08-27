import React from 'react';

interface AdminErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const AdminErrorState: React.FC<AdminErrorStateProps> = ({
  title = 'Failed to load Admin data',
  message = 'An unexpected server response occurred. Please try again or check your permissions.',
  onRetry,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl my-4 font-sans">
      <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full mb-3">
        <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
      </div>
      <h4 className="text-base font-bold text-white font-heading mb-1">{title}</h4>
      <p className="text-xs text-rose-300 max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
        >
          Retry Request
        </button>
      )}
    </div>
  );
};
