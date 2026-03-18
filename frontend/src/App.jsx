import React, { useState } from 'react';
import EmployeeView from './views/EmployeeView';
import ManagerView from './views/ManagerView';
import { UserProvider, useUser } from './UserContext';
import { UserPicker } from './components/UserPicker';

function AppShell() {
  const { employee, logout } = useUser();
  const [currentView, setCurrentView] = useState('employee');

  if (!employee) return <UserPicker />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
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
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-semibold">{employee.full_name}</div>
                <div className="text-xs opacity-75">{employee.position_name}</div>
              </div>
              <button
                onClick={logout}
                className="text-xs bg-indigo-800 hover:bg-indigo-900 px-3 py-1.5 rounded transition"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {currentView === 'employee' ? <EmployeeView /> : <ManagerView />}
      </main>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppShell />
    </UserProvider>
  );
}

export default App;
