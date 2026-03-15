import React from 'react';

const CriterionRow = ({ label, data }) => {
    if (!data) return null;
    const isMet = data.is_met;
    
    return (
        <div className="border-b py-3 last:border-b-0">
            <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800">{label}</span>
                <span className={`px-2 py-1 text-xs font-bold rounded ${isMet ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isMet ? 'Выполнено' : 'Требует доработки'}
                </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{data.reasoning}</p>
            {!isMet && data.suggestion && (
                <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                    <strong>Совет ИИ:</strong> {data.suggestion}
                </div>
            )}
        </div>
    );
};

export const SmartScoreCard = ({ evaluation }) => {
    if (!evaluation) return null;

    const { s_specific, m_measurable, a_achievable, r_relevant, t_time_bound, overall_score, final_recommendation } = evaluation;

    return (
        <div className="bg-white shadow rounded-lg p-6 mt-4 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Анализ SMART</h3>
                <div className="flex items-center">
                    <span className="text-3xl font-extrabold text-blue-600 mr-2">{overall_score}</span>
                    <span className="text-gray-500">/ 100</span>
                </div>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-4">
                <CriterionRow label="Specific (Конкретность)" data={s_specific} />
                <CriterionRow label="Measurable (Измеримость)" data={m_measurable} />
                <CriterionRow label="Achievable (Достижимость)" data={a_achievable} />
                <CriterionRow label="Relevant (Актуальность)" data={r_relevant} />
                <CriterionRow label="Time-bound (Ограниченность во времени)" data={t_time_bound} />
            </div>

            <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded">
                <h4 className="font-bold text-indigo-800 mb-1">Итоговая рекомендация</h4>
                <p className="text-indigo-900 text-sm">{final_recommendation}</p>
            </div>
        </div>
    );
};