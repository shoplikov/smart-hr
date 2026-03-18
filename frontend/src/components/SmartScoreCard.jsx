import React from 'react';

const CRITERIA_LABELS = {
    specific:   { short: 'S', full: 'Конкретность' },
    measurable: { short: 'M', full: 'Измеримость' },
    achievable: { short: 'A', full: 'Достижимость' },
    relevant:   { short: 'R', full: 'Актуальность' },
    time_bound: { short: 'T', full: 'Ограниченность' },
};

const scoreColor = (s) => (s >= 0.8 ? 'text-green-600' : s >= 0.5 ? 'text-yellow-600' : 'text-red-600');
const barBg = (s) => (s >= 0.8 ? 'bg-green-500' : s >= 0.5 ? 'bg-yellow-500' : 'bg-red-500');
const ringColor = (s) => (s >= 0.8 ? 'text-green-500' : s >= 0.5 ? 'text-yellow-500' : 'text-red-500');

const ScoreRing = ({ score }) => {
    const pct = Math.max(score * 100, 0);
    const r = 36;
    const c = 2 * Math.PI * r;
    const offset = c - (pct / 100) * c;

    return (
        <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
                <circle
                    cx="40" cy="40" r={r} fill="none"
                    strokeWidth="6" strokeLinecap="round"
                    className={ringColor(score)}
                    stroke="currentColor"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-extrabold ${scoreColor(score)}`}>{score.toFixed(2)}</span>
            </div>
        </div>
    );
};

const CriterionRow = ({ shortLabel, fullLabel, score }) => (
    <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
            {shortLabel}
        </span>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">{fullLabel}</span>
                <span className={`text-xs font-bold ${scoreColor(score)}`}>{score.toFixed(1)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${barBg(score)}`}
                    style={{ width: `${Math.max(score * 100, 2)}%` }}
                />
            </div>
        </div>
    </div>
);

export const SmartScoreCard = ({ evaluation, onApplyReformulation }) => {
    if (!evaluation) return null;

    const { smart_scores, smart_index, recommendations, improved_goal } = evaluation;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header with score ring */}
            <div className="p-5 flex items-center gap-5 border-b border-gray-100">
                <ScoreRing score={smart_index} />
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-0.5">SMART-анализ</h3>
                    <p className="text-xs text-gray-500">Оценка качества формулировки цели</p>
                    <div className="mt-2">
                        {smart_index >= 0.8 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Отличная формулировка
                            </span>
                        ) : smart_index >= 0.5 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                Есть замечания
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                Требует доработки
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Criteria bars */}
            {smart_scores && (
                <div className="p-5 space-y-3 border-b border-gray-100">
                    {Object.entries(CRITERIA_LABELS).map(([key, { short, full }]) => (
                        <CriterionRow key={key} shortLabel={short} fullLabel={full} score={smart_scores[key] ?? 0} />
                    ))}
                </div>
            )}

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                        </svg>
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Рекомендации</h4>
                    </div>
                    <ul className="space-y-2">
                        {recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <span className="leading-relaxed">{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Improved goal */}
            {improved_goal && (
                <div className="p-5">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/60">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Улучшенная формулировка</h4>
                        </div>
                        <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-line mb-3">{improved_goal}</p>
                        {onApplyReformulation && (
                            <button
                                onClick={() => onApplyReformulation(improved_goal)}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 py-2 px-4 rounded-lg transition shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Применить
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
