import React, { useState, useEffect } from 'react';
import { Dashboard } from '../components/Dashboard';
import { api } from '../api';

export const ManagerView = () => {
    const [teamGoals, setTeamGoals] = useState([]);

    useEffect(() => {
        const fetchTeamGoals = async () => {
            try {
                // Хардкодим ID сотрудника для демо (в реальности это список подчинённых)
                const data = await api.getEmployeeGoals(1);
                setTeamGoals(data);
            } catch (error) {
                console.error("Failed to fetch goals, using mock", error);
                setTeamGoals([
                    { id: 1, title: 'Увеличить тестовое покрытие до 80%', status: 'DRAFT', quarter: 3, year: 2026 },
                    { id: 2, title: 'Запустить новый микросервис аналитики', status: 'APPROVED', quarter: 3, year: 2026 },
                ]);
            }
        };
        fetchTeamGoals();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Кабинет руководителя</h1>
                    <p className="mt-2 text-sm text-gray-600">Аналитика отдела и ревью целей команды</p>
                </div>
                <button className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded shadow-sm hover:bg-gray-50 transition">
                    Экспорт отчета (PDF)
                </button>
            </div>

            <Dashboard />

            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Цели команды (Ожидают проверки)</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {teamGoals.map((goal) => (
                        <li key={goal.id} className="p-6 hover:bg-gray-50 transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-md font-bold text-gray-800">{goal.title}</h4>
                                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                        <span>Период: Q{goal.quarter} {goal.year}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                            goal.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {goal.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-900 border border-indigo-200 bg-indigo-50 py-1.5 px-3 rounded">
                                        Проанализировать AI
                                    </button>
                                    <button className="text-sm font-medium text-green-600 hover:text-green-900 border border-green-200 bg-green-50 py-1.5 px-3 rounded">
                                        Утвердить
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {teamGoals.length === 0 && (
                        <li className="p-6 text-center text-gray-500">Нет целей для отображения</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ManagerView;