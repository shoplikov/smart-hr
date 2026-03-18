import React, { useState } from 'react';
import { api } from '../api';
import { useUser } from '../UserContext';

export const GoalSuggestions = ({ onSelectGoal }) => {
    const user = useUser();
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState(null);
    const [formData, setFormData] = useState({
        role: user.employee?.position_name ?? '',
        department: user.employee?.department_name ?? '',
        quarter: user.quarter,
        year: user.year,
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

    const goalsList = suggestions?.goals || [];

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
                    {suggestions.strategic_alignment && (
                        <div className="bg-green-50 text-green-800 p-3 rounded text-sm mb-4">
                            <strong>Стратегическое выравнивание:</strong> {suggestions.strategic_alignment}
                        </div>
                    )}
                    
                    {goalsList.map((goal, idx) => (
                        <div key={idx} className="border p-4 rounded hover:shadow-md transition bg-gray-50">
                            <h4 className="font-bold text-md mb-2">{goal.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                            
                            {goal.metrics && goal.metrics.length > 0 && (
                                <div className="mb-3">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ключевые метрики:</span>
                                    <ul className="list-disc pl-5 text-sm text-gray-700">
                                        {goal.metrics.map((m, i) => <li key={i}>{m}</li>)}
                                    </ul>
                                </div>
                            )}

                            {goal.source_document && (
                                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded">
                                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">Источник ВНД:</span>
                                    <p className="text-sm font-medium text-amber-900">{goal.source_document}</p>
                                    {goal.source_fragment && (
                                        <p className="text-xs text-amber-700 mt-1 italic">&laquo;{goal.source_fragment}&raquo;</p>
                                    )}
                                </div>
                            )}
                            
                            <button onClick={() => onSelectGoal(goal)} className="text-sm text-blue-600 font-medium hover:underline">
                                Использовать как черновик &rarr;
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
