const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = {
    getEmployees: async (managerId) => {
        const params = managerId != null ? `?manager_id=${managerId}` : '';
        const response = await fetch(`${API_BASE}/employees${params}`);
        if (!response.ok) throw new Error('Ошибка при загрузке списка сотрудников');
        return response.json();
    },

    getDepartments: async () => {
        const response = await fetch(`${API_BASE}/departments`);
        if (!response.ok) throw new Error('Ошибка при загрузке списка отделов');
        return response.json();
    },

    evaluateGoal: async (goalText) => {
        const response = await fetch(`${API_BASE}/goals/ai/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal_text: goalText })
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
    },

    createGoal: async (payload) => {
        const response = await fetch(`${API_BASE}/goals/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Ошибка при сохранении цели');
        return response.json();
    },

    getEmployeeGoals: async (employeeId) => {
        const response = await fetch(`${API_BASE}/goals/employee/${employeeId}`);
        if (!response.ok) throw new Error('Ошибка при загрузке целей сотрудника');
        return response.json();
    },
    
    getDepartmentKpi: async (departmentId, metricKey) => {
        const response = await fetch(`${API_BASE}/analytics/kpi/${departmentId}?metric_key=${metricKey}`);        
        if (!response.ok) throw new Error('Ошибка при загрузке KPI');
        return response.json();
    },

    updateGoalStatus: async (goalId, status) => {
        const response = await fetch(`${API_BASE}/goals/${goalId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error('Ошибка при обновлении статуса');
        return response.json();
    },

    updateGoal: async (goalId, payload) => {
        const response = await fetch(`${API_BASE}/goals/${goalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Ошибка при обновлении цели');
        return response.json();
    },

    deleteGoal: async (goalId) => {
        const response = await fetch(`${API_BASE}/goals/${goalId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Ошибка при удалении цели');
        return true;
    },

    batchEvaluateGoals: async (employeeId) => {
        const response = await fetch(`${API_BASE}/goals/ai/evaluate-batch/${employeeId}`);
        if (!response.ok) throw new Error('Ошибка при пакетной оценке целей');
        return response.json();
    },

    createReview: async (goalId, payload) => {
        const response = await fetch(`${API_BASE}/goals/${goalId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Ошибка при сохранении ревью');
        return response.json();
    },

    getReviews: async (goalId) => {
        const response = await fetch(`${API_BASE}/goals/${goalId}/reviews`);
        if (!response.ok) throw new Error('Ошибка при загрузке ревью');
        return response.json();
    },

    runAndSaveEvaluation: async (goalId) => {
        const response = await fetch(`${API_BASE}/goals/${goalId}/evaluations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Ошибка при запуске AI-оценки');
        return response.json();
    },

    getLatestEvaluation: async (goalId) => {
        const response = await fetch(`${API_BASE}/goals/${goalId}/evaluations/latest`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error('Ошибка при загрузке оценки');
        return response.json();
    },
};