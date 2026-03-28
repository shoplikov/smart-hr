import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Dashboard } from '../components/Dashboard';
import { GoalCard } from '../components/GoalCard';
import { GoalStatusBadge, GoalCardSkeleton } from '../components/shared';
import { api } from '../api';
import { useUser } from '../UserContext';

const SMART_LABELS = { S: 'Specific', M: 'Measurable', A: 'Achievable', R: 'Relevant', T: 'Time-bound' };

const GoalCountAlert = ({ count }) => {
    if (count >= 3) return null;
    if (count === 0) return null;
    return (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 font-medium">
            {`У сотрудника только ${count} цел${count === 1 ? 'ь' : 'и'} — рекомендуется минимум 3.`}
        </div>
    );
};

const BatchSummary = ({ data }) => {
    if (!data) return null;

    const radarData = Object.entries(SMART_LABELS).map(([key, label]) => ({
        criterion: label,
        value: Math.round((data.criteria_averages?.[key] ?? 0) * 100),
    }));

    const barData = data.evaluations.map(ev => ({
        name: (ev.goal_text || '').length > 25 ? ev.goal_text.slice(0, 25) + '...' : ev.goal_text,
        score: ev.smart_index,
    }));

    const avgIndex = data.average_smart_index ?? 0;
    const scoreColorClass = avgIndex >= 0.7 ? 'text-green-600' : avgIndex >= 0.4 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Качество целей сотрудника</h2>
                <div className="text-right">
                    <span className={`text-3xl font-extrabold ${scoreColorClass}`}>{avgIndex.toFixed(2)}</span>
                    <span className="text-gray-400 ml-1">/ 1.0</span>
                    <p className="text-xs text-gray-400 mt-0.5">{data.total_goals} целей оценено</p>
                </div>
            </div>

            {data.weakest_criteria?.length > 0 && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-xs font-bold text-red-800 mb-1.5">Слабые критерии (средний балл &lt; 0.7):</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {data.weakest_criteria.map(c => (
                            <span key={c.criterion} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                {SMART_LABELS[c.criterion]}: {c.avg_score.toFixed(2)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">SMART-индекс по целям</h4>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={0} angle={-15} textAnchor="end" height={55} />
                                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                <Tooltip formatter={(v) => [v.toFixed(2), 'SMART-индекс']} />
                                <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Средний балл критериев (%)</h4>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#E5E7EB" />
                                <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 10, fill: '#6B7280' }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                                <Radar dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmployeeSidebar = ({ employees, selectedId, onSelect, loading, search, onSearchChange, showAll, onToggleShowAll, hasSubordinates }) => (
    <aside className="w-72 shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-fit sticky top-4 max-h-[calc(100vh-6rem)]">
        <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
                <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Поиск сотрудника..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            {hasSubordinates && (
                <div className="flex rounded-lg bg-gray-100 p-0.5">
                    <button
                        onClick={() => { if (showAll) onToggleShowAll(); }}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${!showAll ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Мои
                    </button>
                    <button
                        onClick={() => { if (!showAll) onToggleShowAll(); }}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${showAll ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Все
                    </button>
                </div>
            )}
        </div>
        <div className="overflow-y-auto flex-1">
            {loading ? (
                <div className="p-4 space-y-3">
                    {[1,2,3].map(i => <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />)}
                </div>
            ) : employees.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Нет сотрудников</p>
            ) : (
                <div className="p-2 space-y-1">
                    {employees.map(emp => (
                        <button
                            key={emp.id}
                            onClick={() => onSelect(emp.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition group ${
                                emp.id === selectedId
                                    ? 'bg-indigo-50 border border-indigo-200'
                                    : 'hover:bg-gray-50 border border-transparent'
                            }`}
                        >
                            <div className="font-medium text-sm text-gray-900 group-hover:text-indigo-700 transition truncate">
                                {emp.full_name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{emp.position_name}</div>
                            <div className="text-xs text-gray-400 truncate">{emp.department_name}</div>
                            {emp._goalCount != null && (
                                <div className="mt-1 flex gap-1.5">
                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                        {emp._goalCount} целей
                                    </span>
                                    {emp._needsReview > 0 && (
                                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                                            {emp._needsReview} на ревью
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    </aside>
);

const ReviewForm = ({ goalId, onSubmit, submitting }) => {
    const [verdict, setVerdict] = useState('approve');
    const [comment, setComment] = useState('');

    const handleSubmit = async () => {
        if (!comment.trim()) return;
        await onSubmit(goalId, verdict, comment);
        setVerdict('approve');
        setComment('');
    };

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700">Оставить ревью</h4>
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Вердикт</label>
                    <select
                        value={verdict}
                        onChange={(e) => setVerdict(e.target.value)}
                        className="block w-full min-w-[180px] text-sm border-gray-300 rounded-lg shadow-sm py-2 pl-3 pr-8 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="approve">Утвердить</option>
                        <option value="needs_changes">Требуется доработка</option>
                        <option value="reject">Отклонить</option>
                        <option value="comment_only">Только комментарий</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Комментарий</label>
                    <textarea
                        rows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Опишите замечания или подтвердите согласование..."
                        className="block w-full text-sm border-gray-300 rounded-lg shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>
            <button
                onClick={handleSubmit}
                disabled={submitting || !comment.trim()}
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-5 rounded-lg transition disabled:opacity-50"
            >
                {submitting ? 'Сохранение...' : 'Отправить ревью'}
            </button>
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
    const [sidebarSearch, setSidebarSearch] = useState('');

    const [teamGoals, setTeamGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [batchResult, setBatchResult] = useState(null);
    const [batchLoading, setBatchLoading] = useState(false);
    const [reviewingGoalId, setReviewingGoalId] = useState(null);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
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
        load();
    }, [user.employee.id]);

    useEffect(() => {
        if (selectedSubId != null) {
            fetchTeamGoals(selectedSubId);
            setBatchResult(null);
            setReviewingGoalId(null);
        }
    }, [selectedSubId]);

    const fetchTeamGoals = async (employeeId) => {
        setLoading(true);
        try {
            const data = await api.getEmployeeGoals(employeeId);
            setTeamGoals(data.sort((a, b) => (a.status === 'DRAFT' ? -1 : (b.status === 'DRAFT' ? 1 : 0))));
        } catch (err) {
            console.error('Failed to fetch goals', err);
        } finally {
            setLoading(false);
        }
    };

    const enrichedList = useMemo(() => {
        const base = showAll ? allEmployees : subordinates;
        const q = sidebarSearch.toLowerCase().trim();
        const filtered = q
            ? base.filter(e =>
                e.full_name.toLowerCase().includes(q) ||
                e.position_name.toLowerCase().includes(q) ||
                e.department_name.toLowerCase().includes(q)
            )
            : base;
        return filtered;
    }, [showAll, allEmployees, subordinates, sidebarSearch]);

    const selectedSub = enrichedList.find(s => s.id === selectedSubId)
        || allEmployees.find(s => s.id === selectedSubId);

    const handleToggleShowAll = () => {
        const next = !showAll;
        setShowAll(next);
        const list = next ? allEmployees : subordinates;
        if (list.length > 0 && !list.find(s => s.id === selectedSubId)) {
            setSelectedSubId(list[0].id);
        }
    };

    const handleBatchEvaluate = async () => {
        if (!selectedSubId) return;
        setBatchLoading(true);
        try {
            const result = await api.batchEvaluateGoals(selectedSubId);
            setBatchResult(result);
        } catch {
            // error handled silently
        } finally {
            setBatchLoading(false);
        }
    };

    const handleSubmitReview = async (goalId, verdict, comment) => {
        setReviewSubmitting(true);
        try {
            await api.createReview(goalId, {
                verdict,
                comment_text: comment,
                reviewer_id: user.employee.id,
            });
            setReviewingGoalId(null);
            await fetchTeamGoals(selectedSubId);
        } catch {
            // error handled silently
        } finally {
            setReviewSubmitting(false);
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Кабинет руководителя</h1>
                <p className="mt-1 text-sm text-gray-500">Аналитика отдела и ревью целей команды</p>
            </div>

            <div className="flex gap-6 items-start">
                <EmployeeSidebar
                    employees={enrichedList}
                    selectedId={selectedSubId}
                    onSelect={setSelectedSubId}
                    loading={subsLoading}
                    search={sidebarSearch}
                    onSearchChange={setSidebarSearch}
                    showAll={showAll}
                    onToggleShowAll={handleToggleShowAll}
                    hasSubordinates={subordinates.length > 0}
                />

                <div className="flex-1 min-w-0">
                    <Dashboard departmentId={user.employee.department_id} />

                    {selectedSubId && (
                        <>
                            <BatchSummary data={batchResult} />

                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">
                                    Цели: {selectedSub?.full_name ?? ''}
                                </h3>
                                <button
                                    onClick={handleBatchEvaluate}
                                    disabled={batchLoading || teamGoals.length === 0}
                                    className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded-lg transition disabled:opacity-50 shadow-sm"
                                >
                                    {batchLoading ? 'Оценка...' : 'Пакетная SMART-оценка'}
                                </button>
                            </div>

                            <GoalCountAlert count={teamGoals.length} />

                            {loading ? (
                                <div className="space-y-4">
                                    {[1,2,3].map(i => <GoalCardSkeleton key={i} />)}
                                </div>
                            ) : teamGoals.length === 0 ? (
                                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                                    <p className="text-gray-400">Нет целей для отображения</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {teamGoals.map(goal => (
                                        <GoalCard
                                            key={goal.id}
                                            goal={goal}
                                            mode="manager"
                                            onReview={(id) => setReviewingGoalId(reviewingGoalId === id ? null : id)}
                                            reviewForm={reviewingGoalId === goal.id ? (
                                                <ReviewForm
                                                    goalId={goal.id}
                                                    onSubmit={handleSubmitReview}
                                                    submitting={reviewSubmitting}
                                                />
                                            ) : null}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerView;
