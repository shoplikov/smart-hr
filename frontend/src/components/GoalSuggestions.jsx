import React, { useState } from 'react';
import { api } from '../api';
import { useUser } from '../UserContext';

const SparkleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
);

const SuggestionCard = ({ goal, index, onSelect }) => (
    <div className="group bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-colors transition-shadow overflow-clip">
        <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                </span>
                <h4 className="font-semibold text-sm text-gray-900 leading-snug">{goal.title}</h4>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-3 pl-10">{goal.description}</p>

            {goal.metrics && goal.metrics.length > 0 && (
                <div className="pl-10 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                        {goal.metrics.map((m, i) => (
                            <span key={i} className="inline-flex items-center text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                                {m}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {goal.source_document && (
                <div className="pl-10 mb-3">
                    <div className="p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-1">
                            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="text-xs font-semibold text-amber-700">Источник ВНД</span>
                        </div>
                        <p className="text-xs font-medium text-amber-900">{goal.source_document}</p>
                        {goal.source_fragment && (
                            <p className="text-xs text-amber-700 mt-1 italic leading-relaxed">&laquo;{goal.source_fragment}&raquo;</p>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <button
                onClick={() => onSelect(goal)}
                className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-800 transition flex items-center justify-center gap-1.5 py-1"
            >
                Использовать как черновик
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </button>
        </div>
    </div>
);

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
                year: parseInt(formData.year),
            });
            setSuggestions(data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const goalsList = suggestions?.goals || [];

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-clip">

            <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                        <SparkleIcon />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">AI-Генерация целей</h3>
                        <p className="text-xs text-gray-500">На основе стратегических документов (RAG)</p>
                    </div>
                </div>
            </div>


            <form onSubmit={handleGenerate} className="p-4 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Роль</label>
                        <input
                            type="text"
                            className="block w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Отдел</label>
                        <input
                            type="text"
                            className="block w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                            value={formData.department}
                            onChange={e => setFormData({...formData, department: e.target.value})}
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2.5 px-4 rounded-lg hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition font-medium text-sm shadow-sm flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Генерация целей...
                        </>
                    ) : (
                        <>
                            <SparkleIcon />
                            Сгенерировать цели
                        </>
                    )}
                </button>
            </form>


            {suggestions && (
                <div className="p-4">
                    {suggestions.strategic_alignment && (
                        <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200/60 rounded-lg mb-4">
                            <svg className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Стратегическое выравнивание</span>
                                <p className="text-sm text-emerald-900 mt-0.5 leading-relaxed">{suggestions.strategic_alignment}</p>
                            </div>
                        </div>
                    )}

                    {goalsList.length > 0 ? (
                        <div className="space-y-3">
                            {goalsList.map((goal, idx) => (
                                <SuggestionCard key={idx} goal={goal} index={idx} onSelect={onSelectGoal} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-400">Цели не найдены. Попробуйте изменить параметры.</p>
                        </div>
                    )}
                </div>
            )}

            {!suggestions && (
                <div className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-400">Нажмите «Сгенерировать цели» для получения стратегических рекомендаций на основе ВНД</p>
                </div>
            )}
        </div>
    );
};
