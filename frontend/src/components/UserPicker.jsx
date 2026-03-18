import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useUser } from '../UserContext';

export const UserPicker = () => {
    const { login } = useUser();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.getEmployees()
            .then(setEmployees)
            .catch((err) => console.error('Failed to load employees', err))
            .finally(() => setLoading(false));
    }, []);

    const grouped = useMemo(() => {
        const q = search.toLowerCase().trim();
        const filtered = q
            ? employees.filter(
                  (e) =>
                      e.full_name.toLowerCase().includes(q) ||
                      e.position_name.toLowerCase().includes(q) ||
                      e.department_name.toLowerCase().includes(q)
              )
            : employees;

        const map = {};
        for (const emp of filtered) {
            const dept = emp.department_name;
            if (!map[dept]) map[dept] = [];
            map[dept].push(emp);
        }
        return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    }, [employees, search]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500 text-lg font-medium">Загрузка списка сотрудников...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">HR ИИ-Платформа</h1>
                    <p className="text-gray-500">Выберите сотрудника для входа</p>
                </div>

                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Поиск по имени, должности или отделу..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                    />
                </div>

                {grouped.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">Сотрудники не найдены</div>
                ) : (
                    <div className="space-y-8">
                        {grouped.map(([deptName, emps]) => (
                            <div key={deptName}>
                                <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
                                    {deptName}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {emps.map((emp) => (
                                        <button
                                            key={emp.id}
                                            onClick={() => login(emp)}
                                            className="flex flex-col items-start text-left p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition group"
                                        >
                                            <span className="font-semibold text-gray-900 group-hover:text-indigo-700 transition">
                                                {emp.full_name}
                                            </span>
                                            <span className="text-sm text-gray-500 mt-1">
                                                {emp.position_name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
