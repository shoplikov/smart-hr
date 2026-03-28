import React, { useState, useEffect, useCallback } from 'react';
import { SmartScoreCard } from '../components/SmartScoreCard';
import { GoalSuggestions } from '../components/GoalSuggestions';
import { api } from '../api';
import { useUser } from '../UserContext';

export const EmployeeView = () => {
    const user = useUser();
    const [draftGoalText, setDraftGoalText] = useState('');
    const [draftMetric, setDraftMetric] = useState('');
    const [evaluation, setEvaluation] = useState(null);
    const [evaluating, setEvaluating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Listen for editGoal events from MyGoalsView
    useEffect(() => {
        const handler = (e) => {
            const goal = e.detail;
            if (goal) {
                setEditingGoalId(goal.id);
                setDraftGoalText(goal.goal_text);
                setDraftMetric(goal.metric || '');
                setEvaluation(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.addEventListener('editGoal', handler);
        return () => window.removeEventListener('editGoal', handler);
    }, []);

    const handleEvaluate = async () => {
        if (!draftGoalText) return;
        setEvaluating(true);
        try {
            const result = await api.evaluateGoal(draftGoalText, user.employee.id);
            setEvaluation(result);
        } catch {
            // handled silently
        } finally {
            setEvaluating(false);
        }
    };

    const handleSaveGoal = async () => {
        if (!draftGoalText) return;
        setSaving(true);
        setSaveSuccess(false);
        try {
            if (editingGoalId) {
                await api.updateGoal(editingGoalId, { goal_text: draftGoalText, metric: draftMetric || null });
            } else {
                await api.createGoal({
                    goal_text: draftGoalText,
                    metric: draftMetric || null,
                    quarter: user.quarter,
                    year: user.year,
                    employee_id: user.employee.id,
                    department_id: user.employee.department_id,
                });
            }
            resetForm();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch {
            // handled silently
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditingGoalId(null);
        setDraftGoalText('');
        setDraftMetric('');
        setEvaluation(null);
    };

    const handleApplySuggestion = (goal) => {
        const text = `${goal.title}\n\n${goal.description}\n\nМетрики:\n- ${goal.metrics.join('\n- ')}`;
        setDraftGoalText(text);
        setDraftMetric('');
        setEvaluation(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Кабинет сотрудника</h1>
                <p className="mt-1 text-sm text-gray-500">Планирование и оценка целей с помощью AI</p>
            </div>

            {/* Success toast */}
            {saveSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-medium flex items-center gap-2 animate-fade-in">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Цель успешно сохранена! Перейдите на вкладку «Мои цели» чтобы увидеть её.
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Goal form */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Form header */}
                        <div className={`px-6 py-4 border-b border-gray-100 ${editingGoalId ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-gradient-to-r from-indigo-50 to-blue-50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingGoalId ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                        {editingGoalId ? (
                                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-900">
                                            {editingGoalId ? 'Редактирование цели' : 'Новая цель'}
                                        </h2>
                                        <p className="text-xs text-gray-500">Формулировка по методологии SMART</p>
                                    </div>
                                </div>
                                {editingGoalId && (
                                    <button
                                        onClick={resetForm}
                                        className="text-xs font-medium text-gray-500 hover:text-gray-700 bg-white/80 hover:bg-white px-2.5 py-1.5 rounded-lg transition border border-gray-200"
                                    >
                                        Отмена
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Form body */}
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    Текст цели
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Снизить среднее время обработки заявок отдела с 48 до 36 часов к 31 марта 2026 года за счёт автоматизации процесса первичной классификации..."
                                    className="block w-full border border-gray-200 rounded-lg shadow-sm p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-gray-50 placeholder:text-gray-400"
                                    value={draftGoalText}
                                    onChange={e => setDraftGoalText(e.target.value)}
                                />
                                {draftGoalText.length > 0 && (
                                    <div className="mt-1 text-right">
                                        <span className={`text-xs ${draftGoalText.length > 300 ? 'text-green-600' : 'text-gray-400'}`}>
                                            {draftGoalText.length} символов
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                    KPI-метрика <span className="text-gray-400 font-normal">(необязательно)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="sla_compliance, cost_saving_kzt"
                                    className="block w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 placeholder:text-gray-400"
                                    value={draftMetric}
                                    onChange={e => setDraftMetric(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Form actions */}
                        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex gap-2.5">
                            <button
                                onClick={handleEvaluate}
                                disabled={evaluating || saving || !draftGoalText}
                                className="flex-1 bg-white text-indigo-700 border border-indigo-200 py-2.5 px-4 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition font-medium text-sm shadow-sm flex items-center justify-center gap-2"
                            >
                                {evaluating ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Анализ...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                        </svg>
                                        Оценить по SMART
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleSaveGoal}
                                disabled={evaluating || saving || !draftGoalText}
                                className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium text-sm shadow-sm flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Сохранение...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                        </svg>
                                        {editingGoalId ? 'Сохранить' : 'Отправить'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {evaluation && (
                        <SmartScoreCard
                            evaluation={evaluation}
                            onApplyReformulation={(text) => {
                                setDraftGoalText(text);
                                setEvaluation(null);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    )}
                </div>

                <div>
                    <GoalSuggestions onSelectGoal={handleApplySuggestion} />
                </div>
            </div>
        </div>
    );
};

export default EmployeeView;
