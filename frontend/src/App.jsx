import React, { useState } from 'react';
import EmployeeView from './views/EmployeeView';
import ManagerView from './views/ManagerView';

function App() {
  const [currentView, setCurrentView] = useState('employee');

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Простая навигация для демо */}
      <nav className="bg-indigo-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="font-bold text-xl tracking-tight mr-4">HR ИИ-Платформа</span>
              <button 
                onClick={() => setCurrentView('employee')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'employee' ? 'bg-indigo-800' : 'hover:bg-indigo-500'}`}
              >
                Сотрудник
              </button>
              <button 
                onClick={() => setCurrentView('manager')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'manager' ? 'bg-indigo-800' : 'hover:bg-indigo-500'}`}
              >
                Руководитель
              </button>
            </div>
            <div className="text-sm font-medium opacity-80">
              Demo Mode
            </div>
          </div>
        </div>
      </nav>

      {/* Рендеринг активного экрана */}
      <main>
        {currentView === 'employee' ? <EmployeeView /> : <ManagerView />}
      </main>
    </div>
  );
}

export default App;