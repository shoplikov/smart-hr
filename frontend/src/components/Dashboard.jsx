import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api } from '../api';

export const Dashboard = () => {
    const [kpiData, setKpiData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKpi = async () => {
            try {
                // В реальном приложении ID отдела и KPI берутся из контекста/пропсов
                const data = await api.getDepartmentKpi(1, 1);
                setKpiData(data);
            } catch (error) {
                console.error("API error, using mock data for demo", error);
                // Фолбэк-данные для красивого демо на хакатоне, если БД пуста
                setKpiData([
                    { period: '2026-01', value: 65 },
                    { period: '2026-02', value: 72 },
                    { period: '2026-03', value: 85 },
                    { period: '2026-04', value: 81 },
                    { period: '2026-05', value: 94 },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchKpi();
    }, []);

    const goalStatusData = [
        { name: 'Выполнено', count: 12, fill: '#10B981' },
        { name: 'В процессе', count: 24, fill: '#3B82F6' },
        { name: 'Отстает', count: 5, fill: '#EF4444' }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Динамика KPI Отдела (Выручка)</h3>
                <div className="h-64">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">Загрузка данных...</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={kpiData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="period" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Статусы целей команды</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={goalStatusData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                            <XAxis type="number" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};