import React from 'react';

const CRITERIA_LABELS = {
    specific: 'Specific (Конкретность)',
    measurable: 'Measurable (Измеримость)',
    achievable: 'Achievable (Достижимость)',
    relevant: 'Relevant (Актуальность)',
    time_bound: 'Time-bound (Ограниченность во времени)',
};

const scoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
};

const barColor = (score) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
};

const CriterionBar = ({ label, score }) => (
    <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className={`text-sm font-bold ${scoreColor(score)}`}>{score.toFixed(1)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
                className={`h-2.5 rounded-full transition-all ${barColor(score)}`}
                style={{ width: `${Math.max(score * 100, 2)}%` }}
            />
        </div>
    </div>
);

export const SmartScoreCard = ({ evaluation, onApplyReformulation }) => {
    if (!evaluation) return null;

    const { smart_scores, smart_index, recommendations, improved_goal } = evaluation;

    return (
        <div className="bg-white shadow rounded-lg p-6 mt-4 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Анализ SMART</h3>
                <div className="flex items-center">
                    <span className={`text-3xl font-extrabold mr-2 ${scoreColor(smart_index)}`}>
                        {smart_index.toFixed(2)}
                    </span>
                    <span className="text-gray-500">/ 1.0</span>
                </div>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-4">
                {smart_scores && Object.entries(CRITERIA_LABELS).map(([key, label]) => (
                    <CriterionBar key={key} label={label} score={smart_scores[key] ?? 0} />
                ))}
            </div>

            {recommendations && recommendations.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <h4 className="font-bold text-blue-800 mb-2">Рекомендации</h4>
                    <ul className="space-y-1.5">
                        {recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-blue-900 flex items-start">
                                <span className="mr-2 mt-0.5 text-blue-400">•</span>
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {improved_goal && (
                <div className="mt-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded">
                    <h4 className="font-bold text-emerald-800 mb-2">Улучшенная формулировка цели</h4>
                    <p className="text-emerald-900 text-sm mb-3 whitespace-pre-line">{improved_goal}</p>
                    {onApplyReformulation && (
                        <button
                            onClick={() => onApplyReformulation(improved_goal)}
                            className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 py-1.5 px-4 rounded transition"
                        >
                            Применить улучшенную версию
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
