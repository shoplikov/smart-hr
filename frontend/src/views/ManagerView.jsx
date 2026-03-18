import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Dashboard } from '../components/Dashboard';
import { SmartScoreCard } from '../components/SmartScoreCard';
import { api } from '../api';
import { useUser } from '../UserContext';

const SMART_LABELS = { S: 'Specific', M: 'Measurable', A: 'Achievable', R: 'Relevant', T: 'Time-bound' };

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

const GoalCountAlert = ({ count }) => {
    if (count >= 3 && count <= 5) return null;
    const msg = count < 3
        ? `У сотрудника только ${count} цел${count === 1 ? 'ь' : 'и'} — рекомендуется минимум 3.`
        : `У сотрудника ${count} целей — рекомендуется максимум 5.`;
    return (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800 font-medium">
            {msg}
        </div>
    );
};

const BatchSummary = ({ data }) => {
    if (!data) return null;

    const radarData = Object.entries(SMART_LABELS).map(([key, label]) => {
        const avg = data.criteria_averages?.[key] ?? 0;
        return { criterion: label, value: Math.round(avg * 100) };
    });

    const barData = data.evaluations.map(ev => {
        const title = ev.goal_text || '';
        return {
            name: title.length > 30 ? title.slice(0, 30) + '...' : title,
            score: ev.smart_index,
        };
    });

    const avgIndex = data.average_smart_index ?? 0;
    const scoreColorClass = avgIndex >= 0.7 ? 'text-green-600' : avgIndex >= 0.4 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="bg-white shadow rounded-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Качество целей сотрудника</h2>
                <div className="text-right">
                    <span className={`text-3xl font-extrabold ${scoreColorClass}`}>{avgIndex.toFixed(2)}</span>
                    <span className="text-gray-500 ml-1">/ 1.0</span>
                    <p className="text-xs text-gray-500 mt-1">{data.total_goals} целей оценено</p>
                </div>
            </div>

            {data.weakest_criteria && data.weakest_criteria.length > 0 && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded">
                    <h4 className="text-sm font-bold text-red-800 mb-1">Слабые критерии (средний балл &lt; 0.7):</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.weakest_criteria.map(c => (
                            <span key={c.criterion} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                {SMART_LABELS[c.criterion]}: {c.avg_score.toFixed(2)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">SMART-индекс по целям</h4>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} interval={0} angle={-15} textAnchor="end" height={60} />
                                <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                <Tooltip formatter={(v) => [v.toFixed(2), 'SMART-индекс']} />
                                <Bar dataKey="score" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Средний балл критериев (%)</h4>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#E5E7EB" />
                                <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11, fill: '#374151' }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Radar dataKey="value" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.25} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ManagerView = () => {
    const user = useUser();

    const [subordinates, setSubordinates] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [showAll, setShowAll] = useState(false);
    const [selectedSubId, setSelectedSubId] = useState(null);
    const [subsLoading, setSubsLoading] = useState(true);

    const [teamGoals, setTeamGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [evaluatingGoalId, setEvaluatingGoalId] = useState(null);
    const [evaluationResults, setEvaluationResults] = useState({});
    const [batchResult, setBatchResult] = useState(null);
    const [batchLoading, setBatchLoading] = useState(false);

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const [subs, all] = await Promise.all([
                    api.getEmployees(user.employee.id),
                    api.getEmployees(),
                ]);
                setSubordinates(subs);
                setAllEmployees(all.filter(e => e.id !== user.employee.id));

                if (subs.length > 0) {
                    setSelectedSubId(subs[0].id);
                } else {
                    setShowAll(true);
                    const others = all.filter(e => e.id !== user.employee.id);
                    if (others.length > 0) setSelectedSubId(others[0].id);
                }
            } catch (err) {
                console.error('Failed to load employees', err);
            } finally {
                setSubsLoading(false);
            }
        };
        loadEmployees();
    }, [user.employee.id]);

    useEffect(() => {
        if (selectedSubId != null) {
            fetchTeamGoals(selectedSubId);
            setBatchResult(null);
            setEvaluationResults({});
        }
    }, [selectedSubId]);

    const fetchTeamGoals = async (employeeId) => {
        setLoading(true);
        try {
            const data = await api.getEmployeeGoals(employeeId);
            const sortedData = data.sort((a, b) => a.status === 'DRAFT' ? -1 : 1);
            setTeamGoals(sortedData);
        } catch (error) {
            console.error("Failed to fetch goals", error);
        } finally {
            setLoading(false);
        }
    };

    const [reviewingGoalId, setReviewingGoalId] = useState(null);
    const [reviewVerdict, setReviewVerdict] = useState('approve');
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [goalReviews, setGoalReviews] = useState({});

    const handleSubmitReview = async (goalId) => {
        if (!reviewComment.trim()) { alert('Добавьте комментарий к ревью.'); return; }
        setReviewSubmitting(true);
        try {
            const result = await api.createReview(goalId, {
                verdict: reviewVerdict,
                comment_text: reviewComment,
                reviewer_id: user.employee.id,
            });
            setReviewingGoalId(null);
            setReviewComment('');
            setReviewVerdict('approve');
            await Promise.all([
                fetchTeamGoals(selectedSubId),
                loadReviews(goalId),
            ]);
        } catch (error) {
            console.error("Failed to submit review", error);
            alert("Ошибка при сохранении ревью.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    const loadReviews = async (goalId) => {
        try {
            const reviews = await api.getReviews(goalId);
            setGoalReviews(prev => ({ ...prev, [goalId]: reviews }));
        } catch (err) {
            console.error("Failed to load reviews", err);
        }
    };

    const handleEvaluate = async (goal) => {
        setEvaluatingGoalId(goal.id);
        try {
            const result = await api.evaluateGoal(goal.goal_text);
            setEvaluationResults(prev => ({ ...prev, [goal.id]: result }));
        } catch (error) {
            console.error("Failed to evaluate goal", error);
            alert("Ошибка при вызове AI-оценщика.");
        } finally {
            setEvaluatingGoalId(null);
        }
    };

    const handleBatchEvaluate = async () => {
        if (!selectedSubId) return;
        setBatchLoading(true);
        try {
            const result = await api.batchEvaluateGoals(selectedSubId);
            setBatchResult(result);
        } catch (error) {
            console.error("Failed to batch evaluate", error);
            alert("Ошибка при пакетной оценке целей.");
        } finally {
            setBatchLoading(false);
        }
    };

    const visibleList = showAll ? allEmployees : subordinates;
    const selectedSub = visibleList.find(s => s.id === selectedSubId);

    const handleToggleShowAll = () => {
        const next = !showAll;
        setShowAll(next);
        const list = next ? allEmployees : subordinates;
        if (list.length > 0 && !list.find(s => s.id === selectedSubId)) {
            setSelectedSubId(list[0].id);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">Кабинет руководителя</h1>
                <p className="mt-2 text-sm text-gray-600">Аналитика отдела и ревью целей команды</p>
            </div>

            <Dashboard departmentId={user.employee.department_id} />

            {/* Employee selector */}
            <div className="bg-white shadow rounded-lg border border-gray-200 p-5 mb-8">
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">Выберите сотрудника для ревью</label>
                    <button
                        onClick={handleToggleShowAll}
                        className="text-xs font-medium px-3 py-1.5 rounded transition border"
                        style={{
                            background: showAll ? '#EEF2FF' : '#F9FAFB',
                            borderColor: showAll ? '#A5B4FC' : '#D1D5DB',
                            color: showAll ? '#4338CA' : '#6B7280',
                        }}
                    >
                        {showAll ? 'Все сотрудники' : 'Мои подчинённые'}
                        {subordinates.length > 0 && (showAll ? ' ← показать только моих' : ' → показать всех')}
                    </button>
                </div>
                {subsLoading ? (
                    <p className="text-sm text-gray-400">Загрузка сотрудников...</p>
                ) : visibleList.length === 0 ? (
                    <p className="text-sm text-gray-500">Нет сотрудников для отображения.</p>
                ) : (
                    <select
                        value={selectedSubId ?? ''}
                        onChange={(e) => setSelectedSubId(Number(e.target.value))}
                        className="block w-full max-w-lg pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                    >
                        {visibleList.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.full_name} — {s.position_name} ({s.department_name})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {selectedSubId && (
                <>
                    <BatchSummary data={batchResult} />

                    <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Цели: {selectedSub?.full_name ?? ''}
                            </h3>
                            <button
                                onClick={handleBatchEvaluate}
                                disabled={batchLoading || teamGoals.length === 0}
                                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded transition disabled:opacity-50"
                            >
                                {batchLoading ? 'Оценка всех целей...' : 'Пакетная SMART-оценка'}
                            </button>
                        </div>

                        {loading ? (
                            <div className="p-6 text-center text-gray-500">Загрузка целей...</div>
                        ) : (
                            <div className="p-6">
                                <GoalCountAlert count={teamGoals.length} />
                                <ul className="divide-y divide-gray-200">
                                    {teamGoals.map((goal) => (
                                        <li key={goal.id} className={`p-6 transition ${!['APPROVED','DONE'].includes(goal.status) ? 'bg-yellow-50/30' : 'hover:bg-gray-50'}`}>
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

                                                <div className="flex flex-col space-y-2 ml-4">
                                                    <button
                                                        onClick={() => handleEvaluate(goal)}
                                                        disabled={evaluatingGoalId === goal.id}
                                                        className="text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 py-2 px-4 rounded transition disabled:opacity-50"
                                                    >
                                                        {evaluatingGoalId === goal.id ? 'Анализ...' : 'Анализ ИИ'}
                                                    </button>
                                                    {!['APPROVED','DONE','ARCHIVED'].includes(goal.status) && (
                                                        <button
                                                            onClick={() => { setReviewingGoalId(reviewingGoalId === goal.id ? null : goal.id); loadReviews(goal.id); }}
                                                            className="text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-2 px-4 rounded transition"
                                                        >
                                                            {reviewingGoalId === goal.id ? 'Скрыть' : 'Ревью'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {evaluationResults[goal.id] && (
                                                <div className="mt-4">
                                                    <SmartScoreCard evaluation={evaluationResults[goal.id]} />
                                                </div>
                                            )}

                                            {/* Review form */}
                                            {reviewingGoalId === goal.id && (
                                                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                                                    <h4 className="text-sm font-bold text-gray-700">Оставить ревью</h4>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Вердикт</label>
                                                        <select
                                                            value={reviewVerdict}
                                                            onChange={(e) => setReviewVerdict(e.target.value)}
                                                            className="block w-full max-w-xs text-sm border-gray-300 rounded-md shadow-sm py-1.5 pl-2 pr-8"
                                                        >
                                                            <option value="approve">Утвердить</option>
                                                            <option value="needs_changes">Требуется доработка</option>
                                                            <option value="reject">Отклонить</option>
                                                            <option value="comment_only">Только комментарий</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Комментарий</label>
                                                        <textarea
                                                            rows={3}
                                                            value={reviewComment}
                                                            onChange={(e) => setReviewComment(e.target.value)}
                                                            placeholder="Опишите свои замечания или подтвердите согласование..."
                                                            className="block w-full text-sm border-gray-300 rounded-md shadow-sm p-2"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleSubmitReview(goal.id)}
                                                        disabled={reviewSubmitting || !reviewComment.trim()}
                                                        className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded transition disabled:opacity-50"
                                                    >
                                                        {reviewSubmitting ? 'Сохранение...' : 'Отправить ревью'}
                                                    </button>

                                                    {/* Existing reviews */}
                                                    {goalReviews[goal.id] && goalReviews[goal.id].length > 0 && (
                                                        <div className="mt-3 border-t pt-3 space-y-2">
                                                            <h5 className="text-xs font-bold text-gray-500 uppercase">История ревью</h5>
                                                            {goalReviews[goal.id].map((r) => (
                                                                <div key={r.id} className="text-sm p-2 bg-white rounded border border-gray-100">
                                                                    <div className="flex items-center space-x-2 mb-1">
                                                                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                                                            r.verdict === 'approve' ? 'bg-green-100 text-green-700'
                                                                            : r.verdict === 'reject' ? 'bg-red-100 text-red-700'
                                                                            : r.verdict === 'needs_changes' ? 'bg-orange-100 text-orange-700'
                                                                            : 'bg-gray-100 text-gray-600'
                                                                        }`}>{r.verdict}</span>
                                                                        <span className="text-xs text-gray-400">
                                                                            {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : ''}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-gray-700">{r.comment_text}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                    {teamGoals.length === 0 && (
                                        <li className="p-6 text-center text-gray-500">Нет целей для отображения</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ManagerView;
