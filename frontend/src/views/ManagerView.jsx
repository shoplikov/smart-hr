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

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg shadow-xl max-w-xs z-50">
                <p className="font-semibold text-sm mb-1">{payload[0].payload.fullText || label}</p>
                <div className="flex justify-between items-center text-indigo-300 text-xs mt-2 pt-2 border-t border-slate-700">
                    <span>SMART-индекс:</span>
                    <span className="font-bold text-sm text-white">{payload[0].value.toFixed(2)}</span>
                </div>
            </div>
        );
    }
    return null;
};

const RadarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg shadow-xl z-50">
                <p className="font-semibold text-sm text-indigo-300 mb-1">{payload[0].payload.criterion}</p>
                <div className="flex gap-4 text-xs mt-1">
                    <span>Средний балл:</span>
                    <span className="font-bold text-white">{payload[0].value}%</span>
                </div>
            </div>
        );
    }
    return null;
};

const BatchSummary = ({ data }) => {
    if (!data) return null;

    const radarData = Object.entries(SMART_LABELS).map(([key, label]) => ({
        criterion: label,
        value: Math.round((data.criteria_averages?.[key] ?? 0) * 100),
    }));

    const barData = data.evaluations.map((ev, i) => ({
        name: `Цель ${i + 1}`,
        fullText: ev.goal_text,
        score: ev.smart_index,
    }));

    const avgIndex = data.average_smart_index ?? 0;
    const scoreColorClass = avgIndex >= 0.7 ? 'text-emerald-500' : avgIndex >= 0.4 ? 'text-amber-500' : 'text-rose-500';
    const bgGradient = avgIndex >= 0.7 ? 'from-emerald-500/10 to-transparent' : avgIndex >= 0.4 ? 'from-amber-500/10 to-transparent' : 'from-rose-500/10 to-transparent';

    return (
        <div className={`bg-gradient-to-br ${bgGradient} bg-white rounded-2xl border border-gray-100 p-8 mb-8 shadow-sm relative overflow-hidden`}>
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 relative z-10 gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Качество целей команды</h2>
                    <p className="text-sm text-slate-500 mt-1">Оценено целей: {data.total_goals}</p>
                </div>
                <div className="flex items-end gap-3 bg-white/60 p-4 rounded-xl shadow-sm border border-white/40 backdrop-blur-sm">
                    <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ср. Индекс</div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-extrabold tracking-tighter ${scoreColorClass}`}>{avgIndex.toFixed(2)}</span>
                            <span className="text-slate-400 font-medium">/ 1.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {data.weakest_criteria?.length > 0 && (
                <div className="mb-8 p-4 bg-rose-50/80 border border-rose-100 rounded-xl relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-bold text-rose-800">Зоны роста (критерии &lt; 0.7):</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {data.weakest_criteria.map(c => (
                            <span key={c.criterion} className="px-3 py-1 bg-white text-rose-600 border border-rose-200 shadow-sm rounded-lg text-xs font-semibold tracking-wide">
                                {SMART_LABELS[c.criterion]}: {c.avg_score.toFixed(2)}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-slate-700">Индекс по всем целям</h4>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="barColor" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#818CF8" />
                                        <stop offset="100%" stopColor="#4F46E5" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} width={60} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#F8FAFC'}} />
                                <Bar dataKey="score" fill="url(#barColor)" radius={[0, 6, 6, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-700">Распределение SMART</h4>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <defs>
                                    <linearGradient id="radarColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                                        <stop offset="100%" stopColor="#A855F7" stopOpacity={0.4}/>
                                    </linearGradient>
                                </defs>
                                <PolarGrid stroke="#E2E8F0" />
                                <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} tickCount={5} axisLine={false} />
                                <Radar name="Критерии" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#radarColor)" fillOpacity={0.5} />
                                <Tooltip content={<RadarTooltip />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmployeeSidebar = ({ employees, selectedId, onSelect, loading, search, onSearchChange }) => (
    <aside className="w-72 shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-fit sticky top-4 max-h-[calc(100vh-6rem)]">
        <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
                <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Поиск сотрудника..."
                    id="tour-manager-employee-search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
        </div>
        <div className="overflow-y-auto flex-1">
            {loading ? (
                <div className="p-4 space-y-3">
                    {[1,2,3].map(i => <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />)}
                </div>
            ) : employees.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">У вас нет подчиненных сотрудников</p>
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
    const [selectedSubId, setSelectedSubId] = useState(null);
    const [subsLoading, setSubsLoading] = useState(true);
    const [sidebarSearch, setSidebarSearch] = useState('');

    const [teamGoals, setTeamGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [batchResult, setBatchResult] = useState(null);
    const [batchLoading, setBatchLoading] = useState(false);
    const [reviewingGoalId, setReviewingGoalId] = useState(null);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [evalGenerations, setEvalGenerations] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const subs = await api.getEmployees(user.employee.id);
                setSubordinates(subs);
                if (subs.length > 0) {
                    setSelectedSubId(subs[0].id);
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
        const q = sidebarSearch.toLowerCase().trim();
        const filtered = q
            ? subordinates.filter(e =>
                (e.full_name || '').toLowerCase().includes(q) ||
                (e.position_name || '').toLowerCase().includes(q) ||
                (e.department_name || '').toLowerCase().includes(q)
            )
            : subordinates;
        return filtered;
    }, [subordinates, sidebarSearch]);

    const selectedSub = enrichedList.find(s => s.id === selectedSubId) || subordinates.find(s => s.id === selectedSubId);

    const handleBatchEvaluate = async () => {
        if (!selectedSubId) return;
        setBatchLoading(true);
        try {
            const result = await api.batchEvaluateGoals(selectedSubId);
            setBatchResult(result);
            setEvalGenerations(prev => prev + 1); // trigger GoalCards remount
        } catch (err) {
            console.error(err);
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
        } catch (err) {
            console.error(err);
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
                                    id="tour-manager-batch-evaluate"
                                    disabled={batchLoading || teamGoals.length === 0}
                                    className="text-sm font-semibold text-white bg-indigo-700 hover:bg-indigo-800 py-3 px-6 rounded-xl transition disabled:opacity-50 shadow-md shadow-indigo-600/20 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                                >
                                    {batchLoading ? 'Оценка...' : 'Общая оценка по SMART'}
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
                                            key={`${goal.id}-${evalGenerations}`}
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
