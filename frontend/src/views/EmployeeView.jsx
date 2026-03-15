import React, { useState } from 'react';
import { SmartScoreCard } from '../components/SmartScoreCard';
import { GoalSuggestions } from '../components/GoalSuggestions';
import { api } from '../api';

export const EmployeeView = () => {
    const [draftTitle, setDraftTitle] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [evaluation, setEvaluation] = useState(null);
    const [evaluating, setEvaluating] = useState(false);
    const [saving, setSaving] = useState(false);

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
            await api.createGoal({
                title: draftTitle,
                description: draftDescription,
                quarter: 3,
                year: 2026,
                employee_id: 1
            });
            alert("Цель успешно сохранена и отправлена на проверку руководителю!");
            
            setDraftTitle('');
            setDraftDescription('');
            setEvaluation(null);
        } catch (error) {
            console.error(error);
            alert("Ошибка при сохранении цели в базу данных");
        } finally {
            setSaving(false);
        }
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
                        <h2 className="text-xl font-bold mb-4">Новая цель</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Название цели</label>
                                <input 
                                    type="text" 
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                                    value={draftTitle} 
                                    onChange={e => setDraftTitle(e.target.value)} 
                                    placeholder="Например: Увеличить покрытие тестами"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Описание (с метриками и сроками)</label>
                                <textarea 
                                    rows={5}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" 
                                    value={draftDescription} 
                                    onChange={e => setDraftDescription(e.target.value)}
                                    placeholder="Опишите цель максимально подробно..."
                                />
                            </div>
                            
                            {/* Блок с кнопками */}
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
                                    {saving ? 'Сохранение...' : 'Отправить руководителю'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <SmartScoreCard evaluation={evaluation} />
                </div>

                <div>
                    <GoalSuggestions onSelectGoal={handleApplySuggestion} />
                </div>
            </div>
        </div>
    );
};

export default EmployeeView;