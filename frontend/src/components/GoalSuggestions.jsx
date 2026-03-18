import React, { useState } from 'react';
import { api } from '../api';

export const GoalSuggestions = ({ onSelectGoal }) => {
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState(null);
    const [formData, setFormData] = useState({
        role: 'Разработчик',
        department: 'IT',
        quarter: 3,
        year: 2026
    });

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await api.generateGoals({
                role: formData.role,
                department: formData.department,
                quarter: parseInt(formData.quarter),
                year: parseInt(formData.year)
            });
            setSuggestions(data);
        } catch (error) {
            console.error(error);
            alert('Не удалось сгенерировать цели');
        } finally {
            setLoading(false);
        }
    };

    const goalsList = suggestions?.goals || suggestions?.suggestions || [];

    return (
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">AI-Генерация целей (RAG)</h3>
            
            <form onSubmit={handleGenerate} className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Роль</label>
                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Отдел</label>
                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <button type="submit" disabled={loading} className="col-span-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition">
                    {loading ? 'Анализ стратегии и генерация...' : 'Сгенерировать стратегические цели'}
                </button>
            </form>

            {suggestions && (
                <div className="space-y-4">
                    {/* Рендерим выравнивание, только если оно пришло с бэкенда */}
                    {suggestions.strategic_alignment && (
                        <div className="bg-green-50 text-green-800 p-3 rounded text-sm mb-4">
                            <strong>Стратегическое выравнивание:</strong> {suggestions.strategic_alignment}
                        </div>
                    )}
                    
                    {goalsList.map((goal, idx) => (
                        <div key={idx} className="border p-4 rounded hover:shadow-md transition bg-gray-50">
                            <h4 className="font-bold text-md mb-2">{goal.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                            
                            {/* Безопасный рендер метрик */}
                            {goal.metrics && goal.metrics.length > 0 && (
                                <div className="mb-3">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ключевые метрики:</span>
                                    <ul className="list-disc pl-5 text-sm text-gray-700">
                                        {goal.metrics.map((m, i) => <li key={i}>{m}</li>)}
                                    </ul>
                                </div>
                            )}
                            
                            <button onClick={() => onSelectGoal(goal)} className="text-sm text-blue-600 font-medium hover:underline">
                                Использовать как черновик →
                            </button>
                        </div>
                    ))}
                    
                    {goalsList.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-4">
                            Цели не найдены.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};