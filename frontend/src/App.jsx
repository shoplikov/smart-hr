import React, { useMemo, useState } from 'react';
import EmployeeView from './views/EmployeeView';
import ManagerView from './views/ManagerView';
import MyGoalsView from './views/MyGoalsView';
import { UserProvider, useUser } from './UserContext';
import { UserPicker } from './components/UserPicker';
import { ToastProvider } from './components/shared';
import { OnboardingTour } from './components/OnboardingTour';

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

  const isManager = role === 'manager';
  const [tourOpen, setTourOpen] = useState(false);
  const [tourSteps, setTourSteps] = useState([]);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const employeeTourSteps = useMemo(
    () => [
      {
        targetSelector: '#tour-employee-goal-text',
        title: 'Сформулируйте цель',
        description: 'В поле «Текст цели» опишите, какой результат вы хотите получить по SMART.',
        ensureTab: 'workspace',
      },
      {
        targetSelector: '#tour-employee-evaluate-smart',
        title: 'Запустите SMART-анализ',
        description: 'Нажмите «Оценить по SMART», чтобы получить индекс и рекомендации.',
        ensureTab: 'workspace',
      },
      {
        targetSelector: '#tour-employee-save-goal',
        title: 'Сохраните цель',
        description: 'После анализа нажмите «Отправить/Сохранить», чтобы цель появилась в списке.',
        ensureTab: 'workspace',
      },
      {
        targetSelector: '#tour-tab-goals',
        title: 'Перейдите в «Мои цели»',
        description: 'На вкладке вы увидите цели и их статусы.',
        ensureTab: 'goals',
      },
      {
        targetSelector: '#tour-employee-goals-sorting',
        title: 'Фильтры и сортировка',
        description: 'Используйте фильтрацию и сортировку, чтобы быстро находить нужные цели.',
        ensureTab: 'goals',
      },
    ],
    []
  );

  const managerTourSteps = useMemo(
    () => [
      {
        targetSelector: '#tour-manager-employee-search',
        title: 'Выберите сотрудника',
        description: 'В сайдбаре используйте поиск, чтобы быстро найти нужного подчиненного.',
      },
      {
        targetSelector: '#tour-manager-dashboard-metric-select',
        title: 'Аналитика отдела',
        description: 'Выберите KPI-метрику в выпадающем списке аналитики.',
      },
      {
        targetSelector: '#tour-manager-batch-evaluate',
        title: 'Общая оценка по SMART',
        description: 'Нажмите кнопку, чтобы запустить анализ целей команды и увидеть рекомендации.',
      },
      {
        targetSelector: '[data-tour="manager-review-goal"]',
        title: 'Оставьте ревью',
        description: 'Откройте «Ревью» у цели и добавьте комментарий руководителя.',
      },
    ],
    []
  );

  const closeTour = () => {
    setTourOpen(false);
    setTourSteps([]);
    setTourStepIndex(0);
  };

  const startTour = () => {
    const stepsToUse = isManager ? managerTourSteps : employeeTourSteps;
    if (!stepsToUse || stepsToUse.length === 0) return;

    setTourSteps(stepsToUse);
    setTourStepIndex(0);
    setTourOpen(true);

    const initialTab = stepsToUse[0]?.ensureTab;
    if (initialTab && initialTab !== activeTab) setActiveTab(initialTab);
  };

  const handleEditGoalFromGoalsPage = (goal) => {
    setActiveTab('workspace');
    // Small delay so the EmployeeView mounts first, then dispatches the event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('editGoal', { detail: goal }));
    }, 100);
  };

  if (!employee) return <UserPicker />;

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
                      id={item.key === 'workspace' ? 'tour-tab-workspace' : item.key === 'goals' ? 'tour-tab-goals' : undefined}
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
                id="tour-run-button"
                onClick={startTour}
                className="text-xs font-medium text-white bg-indigo-700 hover:bg-indigo-800 px-3 py-1.5 rounded-lg transition shadow-sm shadow-indigo-600/20 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              >
                Пройти тур
              </button>
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

      <OnboardingTour
        open={tourOpen}
        steps={tourSteps}
        stepIndex={tourStepIndex}
        onNext={() => {
          const nextIndex = Math.min(tourStepIndex + 1, tourSteps.length - 1);
          const ensureTab = tourSteps[nextIndex]?.ensureTab;
          if (ensureTab && ensureTab !== activeTab) setActiveTab(ensureTab);
          setTourStepIndex(nextIndex);
        }}
        onPrev={() => {
          const prevIndex = Math.max(tourStepIndex - 1, 0);
          const ensureTab = tourSteps[prevIndex]?.ensureTab;
          if (ensureTab && ensureTab !== activeTab) setActiveTab(ensureTab);
          setTourStepIndex(prevIndex);
        }}
        onClose={closeTour}
        activeTab={activeTab}
      />
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
