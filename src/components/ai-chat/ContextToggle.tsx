import React from 'react';
import { MdCheck, MdAdd } from 'react-icons/md';

interface ContextToggleProps {
    label: string;
    isActive: boolean;
    onToggle: (state: boolean) => void;
    colorClass: string;
    isDarkMode: boolean;
}

const ContextToggle: React.FC<ContextToggleProps> = ({
    label,
    isActive,
    onToggle,
    colorClass,
    isDarkMode
}) => {
    const getColors = () => {
        if (isActive) {
            if (colorClass === 'blue') {
                return isDarkMode
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 ring-1 ring-blue-500/30'
                    : 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100';
            }
            if (colorClass === 'green') {
                return isDarkMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 ring-1 ring-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100';
            }
            if (colorClass === 'yellow') {
                return isDarkMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 ring-1 ring-amber-500/30'
                    : 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100';
            }
        }

        return isDarkMode
            ? 'bg-gray-800/50 text-gray-500 border-gray-700 hover:bg-gray-800 hover:text-gray-300'
            : 'bg-white text-gray-500 border-slate-200 hover:bg-gray-50 hover:text-gray-700 shadow-sm';
    };

    return (
        <button
            onClick={() => onToggle(!isActive)}
            className={`
        group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 select-none
        ${getColors()}
      `}
        >
            <div className={`
        flex items-center justify-center w-4 h-4 rounded-full text-[10px] transition-colors
        ${isActive
                    ? (isDarkMode ? 'bg-white text-gray-900' : 'bg-gray-800 text-white')
                    : (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400')}
      `}>
                {isActive ? <MdCheck /> : <MdAdd />}
            </div>

            {label}
        </button>
    );
};

export default ContextToggle;
