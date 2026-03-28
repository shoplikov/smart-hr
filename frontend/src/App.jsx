import React, { useState } from 'react';
import EmployeeView from './views/EmployeeView';
import ManagerView from './views/ManagerView';
import MyGoalsView from './views/MyGoalsView';
import { UserProvider, useUser } from './UserContext';
import { UserPicker } from './components/UserPicker';
import { ToastProvider } from './components/shared';

const NAV_ITEMS = [
  { key: 'workspace', label: 'Кабинет', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )},
  { key: 'goals', label: 'Мои цели', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
];

function AppShell() {
  const { employee, role, logout } = useUser();
  const [activeTab, setActiveTab] = useState('workspace');

  if (!employee) return <UserPicker />;

  const handleEditGoalFromGoalsPage = (goal) => {
    setActiveTab('workspace');
    // Small delay so the EmployeeView mounts first, then dispatches the event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('editGoal', { detail: goal }));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg text-indigo-600 tracking-tight mr-6">HR ИИ</span>
              {role === 'manager' ? (
                <span className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700">
                  Руководитель (HR)
                </span>
              ) : (
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                  {NAV_ITEMS.map(item => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === item.key
                          ? 'bg-white text-indigo-700 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
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
        {role === 'manager' ? (
          <ManagerView />
        ) : activeTab === 'goals' ? (
          <MyGoalsView onEditGoal={handleEditGoalFromGoalsPage} />
        ) : (
          <EmployeeView />
        )}
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
