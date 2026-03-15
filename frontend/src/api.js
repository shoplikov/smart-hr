const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
    evaluateGoal: async (title, description) => {
        const response = await fetch(`${API_BASE}/goals/ai/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });
        if (!response.ok) throw new Error('Ошибка при оценке цели');
        return response.json();
    },
    
    generateGoals: async (payload) => {
        const response = await fetch(`${API_BASE}/goals/ai/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Ошибка при генерации целей');
        return response.json();
    }
};