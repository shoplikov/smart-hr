import React, { useState, useEffect } from 'react';
import { SmartScoreCard } from '../components/SmartScoreCard';
import { GoalSuggestions } from '../components/GoalSuggestions';
import { api } from '../api';

export const EmployeeView = () => {
    const [draftTitle, setDraftTitle] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [evaluation, setEvaluation] = useState(null);
    const [evaluating, setEvaluating] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [myGoals, setMyGoals] = useState([]);
    const [loadingGoals, setLoadingGoals] = useState(true);
    
    // ID цели, которую мы сейчас редактируем
    const [editingGoalId, setEditingGoalId] = useState(null);

    useEffect(() => {
        fetchMyGoals();
    }, []);

    const fetchMyGoals = async () => {
        setLoadingGoals(true);
        try {
            const goals = await api.getEmployeeGoals(1);
            const sortedGoals = goals.sort((a, b) => a.status === 'DRAFT' ? -1 : 1);
            setMyGoals(sortedGoals);
        } catch (error) {
            console.error("Failed to fetch my goals", error);
        } finally {
            setLoadingGoals(false);
        }
    };

    const handleEvaluate = async () => {
        if (!draftTitle || !draftDescription) return;
        setEvaluating(true);
        try {
            const result = await api.evaluateGoal(draftTitle, draftDescription);
            setEvaluation(result);
        } catch (error) {
            console.error(error);
            alert("Ошибка при вызове AI-оценщика");
        } finally {
            setEvaluating(false);
        }
    };

    const handleSaveGoal = async () => {
        if (!draftTitle || !draftDescription) return;
        setSaving(true);
        try {
            const payload = {
                title: draftTitle,
                description: draftDescription,
                quarter: 3,
                year: 2026,
                employee_id: 1 
            };

            // Логика ветвления: Обновляем существующую или создаем новую
            if (editingGoalId) {
                await api.updateGoal(editingGoalId, payload);
                alert("✅ Цель успешно обновлена!");
            } else {
                await api.createGoal(payload);
                alert("✅ Цель успешно сохранена и отправлена на проверку руководителю!");
            }
            
            resetForm();
            await fetchMyGoals();
        } catch (error) {
            console.error(error);
            alert("Ошибка при сохранении цели в базу данных");
        } finally {
            setSaving(false);
        }
    };

    const handleEditClick = (goal) => {
        setEditingGoalId(goal.id);
        setDraftTitle(goal.title);
        setDraftDescription(goal.description);
        setEvaluation(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (goalId) => {
        if (!window.confirm("Вы уверены, что хотите удалить эту цель?")) return;
        try {
            await api.deleteGoal(goalId);
            await fetchMyGoals();
            
            // Если мы удалили цель, которую сейчас редактируем, очищаем форму
            if (editingGoalId === goalId) {
                resetForm();
            }
        } catch (error) {
            console.error(error);
            alert("Не удалось удалить цель.");
        }
    };

    const resetForm = () => {
        setEditingGoalId(null);
        setDraftTitle('');
        setDraftDescription('');
        setEvaluation(null);
    };

    const handleApplySuggestion = (goal) => {
        setDraftTitle(goal.title);
        setDraftDescription(`${goal.description}\n\nМетрики:\n- ${goal.metrics.join('\n- ')}`);
        setEvaluation(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">Кабинет сотрудника</h1>
                <p className="mt-2 text-sm text-gray-600">Планирование и оценка целей с помощью AI</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div>
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200 relative">
                        {editingGoalId && (
                            <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-bold rounded-bl-lg rounded-tr-lg">
                                РЕЖИМ РЕДАКТИРОВАНИЯ
                            </div>
                        )}
                        <h2 className="text-xl font-bold mb-4">{editingGoalId ? 'Редактирование цели' : 'Новая цель'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Название цели</label>
                                <input 
                                    type="text" 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                                    value={draftTitle} 
                                    onChange={e => setDraftTitle(e.target.value)} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Описание (с метриками и сроками)</label>
                                <textarea 
                                    rows={5}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                                    value={draftDescription} 
                                    onChange={e => setDraftDescription(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex space-x-3 pt-2">
                                <button 
                                    onClick={handleEvaluate} 
                                    disabled={evaluating || saving || !draftTitle || !draftDescription}
                                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
                                >
                                    {evaluating ? 'Анализ ИИ...' : 'Оценить по SMART'}
                                </button>
                                <button 
                                    onClick={handleSaveGoal} 
                                    disabled={evaluating || saving || !draftTitle || !draftDescription}
                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 transition font-medium"
                                >
                                    {saving ? 'Сохранение...' : (editingGoalId ? 'Сохранить изменения' : 'Отправить руководителю')}
                                </button>
                                {editingGoalId && (
                                    <button 
                                        onClick={resetForm}
                                        className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition font-medium"
                                    >
                                        Отмена
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <SmartScoreCard evaluation={evaluation} />
                    </div>
                </div>

                <div>
                    <GoalSuggestions onSelectGoal={handleApplySuggestion} />
                </div>
            </div>

            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden mt-8">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Мои отправленные цели</h3>
                </div>
                
                {loadingGoals ? (
                    <div className="p-6 text-center text-gray-500">Загрузка ваших целей...</div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {myGoals.map((goal) => (
                            <li key={goal.id} className="p-6 hover:bg-gray-50 transition">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 pr-4">
                                        <h4 className="text-md font-bold text-gray-800">{goal.title}</h4>
                                        <p className="mt-1 text-sm text-gray-600 whitespace-pre-line line-clamp-2">{goal.description}</p>
                                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                                            <span>Период: Q{goal.quarter} {goal.year}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                goal.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {goal.status === 'APPROVED' ? 'УТВЕРЖДЕНО' : 'НА РАССМОТРЕНИИ'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Кнопки отображаются ТОЛЬКО если статус DRAFT */}
                                    {goal.status === 'DRAFT' && (
                                        <div className="flex space-x-3 ml-4">
                                            <button 
                                                onClick={() => handleEditClick(goal)}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                                            >
                                                Редактировать
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClick(goal.id)}
                                                className="text-sm font-medium text-red-600 hover:text-red-800 transition"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                        {myGoals.length === 0 && (
                            <li className="p-6 text-center text-gray-500">У вас пока нет сохраненных целей.</li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default EmployeeView;