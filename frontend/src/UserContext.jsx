/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from 'react';

const UserContext = createContext(null);

function getCurrentQuarter() {
    return Math.ceil((new Date().getMonth() + 1) / 3);
}

export function UserProvider({ children }) {
    const [employee, setEmployee] = useState(null);
    const [role, setRole] = useState(null);

    const value = useMemo(() => {
        const now = new Date();
        return {
            employee,
            role,
            quarter: getCurrentQuarter(),
            year: now.getFullYear(),
            login: (emp, selectedRole) => {
                setEmployee(emp);
                setRole(selectedRole);
            },
            logout: () => {
                setEmployee(null);
                setRole(null);
            },
        };
    }, [employee, role]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be used within UserProvider');
    return ctx;
}
