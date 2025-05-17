// src/App.tsx
import React from 'react';
import EditorPage from './features/editor/EditorPage';
import './styles/index.css';
import {EditorProvider} from "./contexts/editor";

function App() {
    console.count("App render")
    return (
        <EditorProvider>
            <div className="min-h-screen bg-gray-50">
                <EditorPage />
            </div>
        </EditorProvider>
    );
}

export default App;
