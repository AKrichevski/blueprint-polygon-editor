// src/features/editor/components/KeyboardShortcutsHelp.tsx
import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { classNames, cn } from '../../../styles/theme';

const KeyboardShortcutsHelp: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { shortcuts } = useKeyboardShortcuts();

    // Group shortcuts by category
    const shortcutGroups = {
        "Mode Selection": shortcuts.filter(s =>
            ['s', 'a', 'p', 'd'].includes(s.key)),
        "Navigation": shortcuts.filter(s =>
            ['=', '-', '0', 'f'].includes(s.key) ||
            s.key === 'Escape'),
        "Editing": shortcuts.filter(s =>
            s.key === 'Delete' ||
            s.key === 'c' ||
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(s.key))
    };

    return (
        <>
            <button
                className="text-blue-500 hover:text-blue-700 flex items-center"
                onClick={() => setIsModalOpen(true)}
                aria-label="Keyboard Shortcuts Help"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                        clipRule="evenodd"
                    />
                </svg>
                Keyboard Shortcuts
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Keyboard Shortcuts"
                size="lg"
            >
                <div className="divide-y">
                    {Object.entries(shortcutGroups).map(([category, categoryShortcuts]) => (
                        <div key={category} className="py-3">
                            <h3 className="font-semibold text-gray-800 mb-2">{category}</h3>
                            <div className="space-y-2">
                                {categoryShortcuts.map((shortcut, index) => (
                                    <div key={index} className="flex items-center">
                                        <div className="w-40 flex items-center">
                                            {shortcut.ctrl && (
                                                <span className="bg-gray-100 px-2 py-1 rounded mr-1 text-sm">
                                                    Ctrl
                                                </span>
                                            )}
                                            {shortcut.shift && (
                                                <span className="bg-gray-100 px-2 py-1 rounded mr-1 text-sm">
                                                    Shift
                                                </span>
                                            )}
                                            {shortcut.alt && (
                                                <span className="bg-gray-100 px-2 py-1 rounded mr-1 text-sm">
                                                    Alt
                                                </span>
                                            )}
                                            <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                                                {shortcut.key}
                                            </span>
                                        </div>
                                        <div className="flex-1 text-gray-700">
                                            {shortcut.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-4 text-gray-500 text-sm">
                    Note: Shortcuts won't work when focus is in a text input or textarea.
                </p>

                <div className="mt-6 flex justify-end">
                    <button
                        className={cn(
                            classNames.button.base,
                            classNames.button.primary,
                            classNames.button.sizes.md
                        )}
                        onClick={() => setIsModalOpen(false)}
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default KeyboardShortcutsHelp;
