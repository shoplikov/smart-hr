import React, { useState } from 'react';
import EmployeeView from './views/EmployeeView';
import ManagerView from './views/ManagerView';
import { UserProvider, useUser } from './UserContext';
import { UserPicker } from './components/UserPicker';
import { ToastProvider } from './components/shared';

function AppShell() {
  const { employee, logout } = useUser();
  const [currentView, setCurrentView] = useState('employee');

  if (!employee) return <UserPicker />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg text-indigo-600 tracking-tight mr-6">HR ИИ</span>
              <button
                onClick={() => setCurrentView('employee')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  currentView === 'employee'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Сотрудник
              </button>
              <button
                onClick={() => setCurrentView('manager')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  currentView === 'manager'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Руководитель
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{employee.full_name}</div>
                <div className="text-xs text-gray-400">{employee.position_name}</div>
              </div>
              <button
                onClick={logout}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition"
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
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </UserProvider>
  );
}

export default App;
