import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';

export const Dashboard = ({ departmentId }) => {
    const [chartData, setChartData] = useState([]);
    const [kpiInfo, setKpiInfo] = useState({ name: "Загрузка...", unit: "" });
    const [loading, setLoading] = useState(true);
    const [availableMetrics, setAvailableMetrics] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState('');

    useEffect(() => {
        api.getKpiCatalog().then(items => {
            setAvailableMetrics(items);
            if (items.length > 0 && !selectedMetric) {
                setSelectedMetric(items[0].metric_key);
            }
        }).catch(console.error);
    }, []);

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.getDepartmentKpi(departmentId, selectedMetric);
            setChartData(response.data);
            setKpiInfo({ name: response.kpi_name, unit: response.unit });
        } catch (error) {
            console.error("Failed to load KPI data", error);
            setChartData([]);
        } finally {
            setLoading(false);
        }
    }, [departmentId, selectedMetric]);

    useEffect(() => {
        if (departmentId) fetchMetrics();
    }, [selectedMetric, departmentId, fetchMetrics]);

    return (
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Аналитика отдела</h2>
                
                <select 
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm bg-gray-50"
                >
                    {availableMetrics.map(metric => (
                        <option key={metric.metric_key} value={metric.metric_key}>
                            {metric.title} ({metric.unit})
                        </option>
                    ))}
                </select>
            </div>

            <div className="h-72 w-full">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500 font-medium">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Загрузка графика...
                    </div>
                ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} width={40} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value) => [`${value} ${kpiInfo.unit}`, kpiInfo.name]}
                                labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#4F46E5" 
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#4F46E5" }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: "#4F46E5" }}
                                animationDuration={500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        Нет данных за выбранный период
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;