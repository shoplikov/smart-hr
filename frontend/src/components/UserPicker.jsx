import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { useUser } from '../UserContext';

export const UserPicker = () => {
    const { login } = useUser();
    const [employees, setEmployees] = useState([]);
    const [loginMode, setLoginMode] = useState('worker');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);
        const isManagerFlag = loginMode === 'manager';
        api.getEmployees(null, isManagerFlag)
            .then(setEmployees)
            .catch((err) => console.error('Failed to load employees', err))
            .finally(() => setLoading(false));
    }, [loginMode]);

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
                <div className="flex items-center gap-3 text-gray-500">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Загрузка...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
            <div className="max-w-5xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">HR ИИ-Платформа</h1>
                    <p className="text-gray-500 mb-6">Выберите профиль для входа в систему</p>
                    
                    <div className="inline-flex p-1 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <button 
                            onClick={() => setLoginMode('worker')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition ${loginMode === 'worker' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            Сотрудник
                        </button>
                        <button 
                            onClick={() => setLoginMode('manager')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition ${loginMode === 'manager' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            Руководитель (HR)
                        </button>
                    </div>
                </div>

                <div className="max-w-md mx-auto mb-10">
                    <div className="relative">
                        <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Поиск по имени, должности или отделу..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                        />
                    </div>
                </div>

                {grouped.length === 0 ? (
                    <div className="text-center text-gray-400 py-16">Сотрудники не найдены</div>
                ) : (
                    <div className="space-y-8">
                        {grouped.map(([deptName, emps]) => (
                            <div key={deptName}>
                                <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3 px-1">
                                    {deptName}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {emps.map((emp) => (
                                        <button
                                            key={emp.id}
                                            onClick={() => login(emp, loginMode)}
                                            className="flex items-center gap-3 text-left p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                <span className="text-sm font-bold text-indigo-600">
                                                    {emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-sm text-gray-900 group-hover:text-indigo-700 transition truncate">
                                                    {emp.full_name}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {emp.position_name}
                                                </div>
                                            </div>
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
