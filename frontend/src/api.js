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
    getEmployeeGoals: async (employeeId) => {
        const response = await fetch(`${API_BASE}/goals/employee/${employeeId}`);
        if (!response.ok) throw new Error('Ошибка при загрузке целей сотрудника');
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
};