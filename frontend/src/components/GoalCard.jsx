import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { GoalStatusBadge, Expandable, VerdictBadge } from './shared';
import { LOCKED_STATUSES } from '../constants';
const CRITERIA_LABELS = {
    specific: 'S — Конкретность',
    measurable: 'M — Измеримость',
    achievable: 'A — Достижимость',
    relevant: 'R — Актуальность',
    time_bound: 'T — Ограниченность',
};

const scoreColor = (v) => (v >= 0.8 ? 'text-green-600' : v >= 0.5 ? 'text-yellow-600' : 'text-red-600');
const barBg = (v) => (v >= 0.8 ? 'bg-green-500' : v >= 0.5 ? 'bg-yellow-500' : 'bg-red-500');

const MiniBar = ({ label, score }) => (
    <div className="flex items-center gap-3 text-xs">
        <span className="w-28 text-gray-600 font-medium truncate">{label}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${barBg(score)}`} style={{ width: `${Math.max(score * 100, 2)}%` }} />
        </div>
        <span className={`w-8 text-right font-bold ${scoreColor(score)}`}>{score.toFixed(1)}</span>
    </div>
);

const EvalContent = ({ evaluation, running, onRun, onApplyImproved }) => {
    if (running) {
        return (
            <div className="flex items-center gap-3 py-4 justify-center text-sm text-indigo-600">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                ИИ анализирует цель...
            </div>
        );
    }

    if (!evaluation) {
        return (
            <div className="text-center py-3">
                <p className="text-sm text-gray-500 mb-3">Анализ ещё не проводился</p>
                <button onClick={onRun} className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded-lg transition">
                    Запустить SMART-анализ
                </button>
            </div>
        );
    }

    const { smart_scores, smart_index, recommendations, improved_goal, created_at } = evaluation;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`text-2xl font-extrabold ${scoreColor(smart_index)}`}>{smart_index.toFixed(2)}</span>
                    <span className="text-gray-400 text-sm">/ 1.0</span>
                </div>
                <div className="flex items-center gap-3">
                    {created_at && (
                        <span className="text-xs text-gray-400">{new Date(created_at).toLocaleDateString('ru-RU')}</span>
                    )}
                    <button onClick={onRun} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition">
                        Обновить анализ
                    </button>
                </div>
            </div>

            {smart_scores && (
                <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                    {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
                        <MiniBar key={key} label={label} score={smart_scores[key] ?? 0} />
                    ))}
                </div>
            )}

            {recommendations && recommendations.length > 0 && (
                <div className="p-3 bg-blue-50 border-l-3 border-blue-400 rounded-r-lg">
                    <h5 className="text-xs font-bold text-blue-800 mb-1.5">Рекомендации</h5>
                    <ul className="space-y-1">
                        {recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-blue-900 flex items-start gap-1.5">
                                <span className="text-blue-400 mt-0.5">•</span>{rec}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {improved_goal && (
                <div className="p-3 bg-emerald-50 border-l-3 border-emerald-400 rounded-r-lg">
                    <h5 className="text-xs font-bold text-emerald-800 mb-1.5">Улучшенная формулировка</h5>
                    <p className="text-xs text-emerald-900 mb-2 whitespace-pre-line">{improved_goal}</p>
                    {onApplyImproved && (
                        <button
                            onClick={() => onApplyImproved(improved_goal)}
                            className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 py-1 px-3 rounded transition"
                        >
                            Применить улучшенную версию
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const ReviewsContent = ({ reviews }) => {
    if (!reviews || reviews.length === 0) {
        return <p className="text-sm text-gray-400 text-center py-2">Отзывов пока нет</p>;
    }
    return (
        <div className="space-y-2">
            {reviews.map(r => (
                <div key={r.id} className="flex gap-3 p-2.5 bg-white rounded-lg border border-gray-100">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <VerdictBadge verdict={r.verdict} />
                            <span className="text-xs text-gray-400">
                                {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : ''}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700">{r.comment_text}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const GoalCard = ({
    goal,
    mode = 'employee',
    onEdit,
    onDelete,
    onReview,
    onApplyImproved,
    reviewForm,
}) => {
    const [evaluation, setEvaluation] = useState(null);
    const [evalLoading, setEvalLoading] = useState(false);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        let cancelled = false;
        api.getLatestEvaluation(goal.id).then(data => {
            if (!cancelled && data) setEvaluation(data);
        }).catch((err) => console.error(err));
        api.getReviews(goal.id).then(data => {
            if (!cancelled) { setReviews(data); }
        }).catch((err) => console.error(err));
        return () => { cancelled = true; };
    }, [goal.id]);

    const handleRunEval = async () => {
        setEvalLoading(true);
        try {
            const result = await api.runAndSaveEvaluation(goal.id);
            setEvaluation(result);
        } catch {
        } finally {
            setEvalLoading(false);
        }
    };

    const refreshReviews = async () => {
        try {
            const data = await api.getReviews(goal.id);
            setReviews(data);
        } catch (error) {
            console.error(error);
        }
    };

    const isLocked = LOCKED_STATUSES.includes(goal.status);
    const needsAttention = ['NEEDS_CHANGES', 'REJECTED'].includes(goal.status);

    return (
        <div className={`bg-white rounded-xl border transition-shadow hover:shadow-md ${
            needsAttention ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'
        }`}>


            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{goal.goal_text}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <GoalStatusBadge status={goal.status} />
                            <span className="text-xs text-gray-400">Q{goal.quarter} {goal.year}</span>
                            {goal.metric && (
                                <span className="inline-flex items-center text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                    KPI: {goal.metric_title || goal.metric}
                                </span>
                            )}
                            {goal.deadline && (() => {
                                const isOverdue = !['DONE', 'ARCHIVED', 'CANCELLED'].includes(goal.status)
                                    && new Date(goal.deadline) < new Date();
                                return (
                                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${
                                        isOverdue
                                            ? 'bg-red-50 text-red-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                        </svg>
                                        {new Date(goal.deadline).toLocaleDateString('ru-RU')}
                                        {isOverdue && ' (просрочено)'}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>


                    <div className="flex flex-col gap-1.5 shrink-0">
                        {mode === 'employee' && !isLocked && (
                            <>
                                <button
                                    onClick={() => onEdit?.(goal)}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                                >
                                    Редактировать
                                </button>
                                <button
                                    onClick={() => onDelete?.(goal.id)}
                                    className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                                >
                                    Удалить
                                </button>
                            </>
                        )}
                        {mode === 'manager' && !isLocked && (
                            <button
                                onClick={() => { onReview?.(goal.id); refreshReviews(); }}
                                className="text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition"
                            >
                                Ревью
                            </button>
                        )}
                    </div>
                </div>
            </div>


            <div className="px-5 pb-4 space-y-2">
                <Expandable
                    title="SMART-анализ ИИ"
                    defaultOpen={needsAttention}
                    badge={evaluation ? (
                        <span className={`text-xs font-bold ${scoreColor(evaluation.smart_index)}`}>
                            {evaluation.smart_index.toFixed(2)}
                        </span>
                    ) : null}
                >
                    <EvalContent
                        evaluation={evaluation}
                        running={evalLoading}
                        onRun={handleRunEval}
                        onApplyImproved={mode === 'employee' ? onApplyImproved : null}
                    />
                </Expandable>

                <Expandable
                    title="Отзывы руководителя"
                    defaultOpen={needsAttention}
                    badge={reviews.length > 0 ? (
                        <span className="text-xs font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                            {reviews.length}
                        </span>
                    ) : null}
                >
                    <ReviewsContent reviews={reviews} />
                </Expandable>
            </div>


            {reviewForm && (
                <div className="border-t border-gray-200 p-5 bg-gray-50/50 rounded-b-xl">
                    {reviewForm}
                </div>
            )}
        </div>
    );
};
