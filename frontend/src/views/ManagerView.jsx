import React, { useState, useEffect } from 'react';
import { Dashboard } from '../components/Dashboard';
import { SmartScoreCard } from '../components/SmartScoreCard';
import { api } from '../api';

export const ManagerView = () => {
    const [teamGoals, setTeamGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [evaluatingGoalId, setEvaluatingGoalId] = useState(null);
    const [evaluationResults, setEvaluationResults] = useState({});

    useEffect(() => {
        fetchTeamGoals();
    }, []);

    const fetchTeamGoals = async () => {
        try {
            const data = await api.getEmployeeGoals(1);
            const sortedData = data.sort((a, b) => a.status === 'DRAFT' ? -1 : 1);
            setTeamGoals(sortedData);
        } catch (error) {
            console.error("Failed to fetch goals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (goalId) => {
        try {
            await api.updateGoalStatus(goalId, 'APPROVED');
            setTeamGoals(prevGoals => 
                prevGoals.map(goal => 
                    goal.id === goalId ? { ...goal, status: 'APPROVED' } : goal
                )
            );
        } catch (error) {
            console.error("Failed to approve goal", error);
            alert("Не удалось утвердить цель.");
        }
    };

    const handleEvaluate = async (goal) => {
        setEvaluatingGoalId(goal.id);
        try {
            const result = await api.evaluateGoal(goal.title, goal.description);
            setEvaluationResults(prev => ({ ...prev, [goal.id]: result }));
        } catch (error) {
            console.error("Failed to evaluate goal", error);
            alert("Ошибка при вызове AI-оценщика.");
        } finally {
            setEvaluatingGoalId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">Кабинет руководителя</h1>
                <p className="mt-2 text-sm text-gray-600">Аналитика отдела и ревью целей команды</p>
            </div>

            <Dashboard />

            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Цели команды</h3>
                </div>
                
                {loading ? (
                    <div className="p-6 text-center text-gray-500">Загрузка целей...</div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {teamGoals.map((goal) => (
                            <li key={goal.id} className={`p-6 transition ${goal.status === 'DRAFT' ? 'bg-yellow-50/30' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 pr-4">
                                        <h4 className="text-md font-bold text-gray-800">{goal.title}</h4>
                                        <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{goal.description}</p>
                                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                                            <span className="font-medium">Сотрудник ID: {goal.employee_id}</span>
                                            <span>Период: Q{goal.quarter} {goal.year}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                goal.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {goal.status === 'APPROVED' ? 'УТВЕРЖДЕНО' : 'НА РАССМОТРЕНИИ'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {goal.status === 'DRAFT' && (
                                        <div className="flex flex-col space-y-2 ml-4">
                                            <button
                                                onClick={() => handleEvaluate(goal)}
                                                disabled={evaluatingGoalId === goal.id}
                                                className="text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 py-2 px-4 rounded transition disabled:opacity-50"
                                            >
                                                {evaluatingGoalId === goal.id ? 'Анализ...' : 'Анализ ИИ'}
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(goal.id)}
                                                className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 py-2 px-4 rounded transition shadow-sm"
                                            >
                                                Утвердить
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {evaluationResults[goal.id] && (
                                    <div className="mt-4">
                                        <SmartScoreCard evaluation={evaluationResults[goal.id]} />
                                    </div>
                                )}
                            </li>
                        ))}
                        {teamGoals.length === 0 && (
                            <li className="p-6 text-center text-gray-500">Нет целей для отображения</li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ManagerView;
