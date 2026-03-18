import React, { useState, useEffect } from 'react';
import { SmartScoreCard } from '../components/SmartScoreCard';
import { GoalSuggestions } from '../components/GoalSuggestions';
import { api } from '../api';
import { useUser } from '../UserContext';

const LOCKED_STATUSES = ['APPROVED', 'DONE', 'ARCHIVED'];

const STATUS_CONFIG = {
    DRAFT:       { label: 'Черновик',        bg: 'bg-gray-100',   text: 'text-gray-700' },
    SUBMITTED:   { label: 'На рассмотрении', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    IN_PROGRESS: { label: 'В работе',        bg: 'bg-blue-100',   text: 'text-blue-800' },
    ACTIVE:      { label: 'Активна',         bg: 'bg-blue-100',   text: 'text-blue-800' },
    APPROVED:    { label: 'Утверждено',       bg: 'bg-green-100',  text: 'text-green-800' },
    DONE:        { label: 'Выполнено',        bg: 'bg-emerald-100',text: 'text-emerald-800' },
    CANCELLED:   { label: 'Отменено',         bg: 'bg-red-100',    text: 'text-red-700' },
    OVERDUE:     { label: 'Просрочено',       bg: 'bg-red-100',    text: 'text-red-700' },
    ARCHIVED:    { label: 'В архиве',         bg: 'bg-gray-100',   text: 'text-gray-500' },
    NEEDS_CHANGES: { label: 'На доработке',   bg: 'bg-orange-100', text: 'text-orange-700' },
    REJECTED:    { label: 'Отклонено',        bg: 'bg-red-100',    text: 'text-red-700' },
};

const GoalStatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
        </span>
    );
};

export const EmployeeView = () => {
    const user = useUser();
    const [draftGoalText, setDraftGoalText] = useState('');
    const [draftMetric, setDraftMetric] = useState('');
    const [evaluation, setEvaluation] = useState(null);
    const [evaluating, setEvaluating] = useState(false);
    const [saving, setSaving] = useState(false);

    const [myGoals, setMyGoals] = useState([]);
    const [loadingGoals, setLoadingGoals] = useState(true);

    const [editingGoalId, setEditingGoalId] = useState(null);
    const [goalReviews, setGoalReviews] = useState({});

    useEffect(() => {
        fetchMyGoals();
    }, [user.employee.id]);

    const fetchMyGoals = async () => {
        setLoadingGoals(true);
        try {
            const goals = await api.getEmployeeGoals(user.employee.id);
            const sortedGoals = goals.sort((a, b) => a.status === 'DRAFT' ? -1 : 1);
            setMyGoals(sortedGoals);

            const reviewPromises = goals.map(g =>
                api.getReviews(g.id).then(reviews => [g.id, reviews]).catch(() => [g.id, []])
            );
            const reviewEntries = await Promise.all(reviewPromises);
            setGoalReviews(Object.fromEntries(reviewEntries));
        } catch (error) {
            console.error("Failed to fetch my goals", error);
        } finally {
            setLoadingGoals(false);
        }
    };

    const handleEvaluate = async () => {
        if (!draftGoalText) return;
        setEvaluating(true);
        try {
            const result = await api.evaluateGoal(draftGoalText);
            setEvaluation(result);
        } catch (error) {
            console.error(error);
            alert("Ошибка при вызове AI-оценщика");
        } finally {
            setEvaluating(false);
        }
    };

    const handleSaveGoal = async () => {
        if (!draftGoalText) return;
        setSaving(true);
        try {
            const payload = {
                goal_text: draftGoalText,
                metric: draftMetric || null,
                quarter: user.quarter,
                year: user.year,
                employee_id: user.employee.id,
                department_id: user.employee.department_id,
            };

            if (editingGoalId) {
                await api.updateGoal(editingGoalId, { goal_text: draftGoalText, metric: draftMetric || null });
                alert("Цель успешно обновлена!");
            } else {
                await api.createGoal(payload);
                alert("Цель сохранена и отправлена на проверку руководителю!");
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
        setDraftGoalText(goal.goal_text);
        setDraftMetric(goal.metric || '');
        setEvaluation(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (goalId) => {
        if (!window.confirm("Вы уверены, что хотите удалить эту цель?")) return;
        try {
            await api.deleteGoal(goalId);
            await fetchMyGoals();
            if (editingGoalId === goalId) resetForm();
        } catch (error) {
            console.error(error);
            alert("Не удалось удалить цель.");
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
                                <label className="block text-sm font-medium text-gray-700">Текст цели (формулировка по SMART)</label>
                                <textarea
                                    rows={5}
                                    placeholder="Например: Снизить среднее время обработки заявок отдела с 48 до 36 часов к 31 марта 2026 года..."
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={draftGoalText}
                                    onChange={e => setDraftGoalText(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">KPI-метрика (необязательно)</label>
                                <input
                                    type="text"
                                    placeholder="Например: sla_compliance, cost_saving_kzt"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={draftMetric}
                                    onChange={e => setDraftMetric(e.target.value)}
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={handleEvaluate}
                                    disabled={evaluating || saving || !draftGoalText}
                                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
                                >
                                    {evaluating ? 'Анализ ИИ...' : 'Оценить по SMART'}
                                </button>
                                <button
                                    onClick={handleSaveGoal}
                                    disabled={evaluating || saving || !draftGoalText}
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
                        <SmartScoreCard
                            evaluation={evaluation}
                            onApplyReformulation={(improvedGoalText) => {
                                setDraftGoalText(improvedGoalText);
                                setEvaluation(null);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    </div>
                </div>

                <div>
                    <GoalSuggestions onSelectGoal={handleApplySuggestion} />
                </div>
            </div>

            <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden mt-8">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Мои цели</h3>
                </div>

                {loadingGoals ? (
                    <div className="p-6 text-center text-gray-500">Загрузка ваших целей...</div>
                ) : (
                    <div className="p-6">
                        {myGoals.length > 0 && (myGoals.length < 3 || myGoals.length > 5) && (
                            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800 font-medium">
                                {myGoals.length < 3
                                    ? `У вас ${myGoals.length} цел${myGoals.length === 1 ? 'ь' : 'и'} — рекомендуется минимум 3 для полноценного набора.`
                                    : `У вас ${myGoals.length} целей — рекомендуется максимум 5.`
                                }
                            </div>
                        )}
                        <ul className="divide-y divide-gray-200">
                            {myGoals.map((goal) => (
                                <li key={goal.id} className="p-6 hover:bg-gray-50 transition">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 pr-4">
                                            <p className="text-sm text-gray-800 whitespace-pre-line">{goal.goal_text}</p>
                                            {goal.metric && (
                                                <span className="inline-block mt-2 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                                                    KPI: {goal.metric}
                                                </span>
                                            )}
                                            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                                                <span>Период: Q{goal.quarter} {goal.year}</span>
                                                <GoalStatusBadge status={goal.status} />
                                            </div>
                                        </div>

                                        {!LOCKED_STATUSES.includes(goal.status) && (
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

                                    {goalReviews[goal.id] && goalReviews[goal.id].length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase">Отзывы руководителя</h5>
                                            {goalReviews[goal.id].map((r) => (
                                                <div key={r.id} className="text-sm p-2.5 bg-gray-50 rounded border border-gray-100">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                                            r.verdict === 'approve' ? 'bg-green-100 text-green-700'
                                                            : r.verdict === 'reject' ? 'bg-red-100 text-red-700'
                                                            : r.verdict === 'needs_changes' ? 'bg-orange-100 text-orange-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {r.verdict === 'approve' ? 'Утверждено' :
                                                             r.verdict === 'reject' ? 'Отклонено' :
                                                             r.verdict === 'needs_changes' ? 'Требует доработки' : 'Комментарий'}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700">{r.comment_text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            ))}
                            {myGoals.length === 0 && (
                                <li className="p-6 text-center text-gray-500">У вас пока нет сохраненных целей.</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeView;
