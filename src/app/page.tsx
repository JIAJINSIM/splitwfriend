// src/app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import ExpenseForm from './ExpenseForm';
import { Expense } from './types';

const Home: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('');

    useEffect(() => {
        const savedExpenses = localStorage.getItem('expenses');
        if (savedExpenses) {
            setExpenses(JSON.parse(savedExpenses));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }, [expenses]);

    const addExpense = (newExpense: Expense) => {
        setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
    };

    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
    };

    const saveEditedExpense = (updatedExpense: Expense) => {
        setExpenses((prevExpenses) =>
            prevExpenses.map((exp) => (exp === editingExpense ? updatedExpense : exp))
        );
        setEditingExpense(null);
    };

    const deleteExpense = (expenseToDelete: Expense) => {
        setExpenses((prevExpenses) => prevExpenses.filter((exp) => exp !== expenseToDelete));
    };

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const filteredExpenses = filterCategory
        ? expenses.filter(exp => exp.category === filterCategory)
        : expenses;

    const exportToCSV = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + filteredExpenses.map(e => `${e.description},${e.amount},${e.category}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "expenses.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
            <h1 className="text-2xl font-bold">Welcome to Split Expenses w Friends</h1>
            <ExpenseForm 
                onAddExpense={editingExpense ? saveEditedExpense : addExpense}
                initialDescription={editingExpense?.description || ''}
                initialAmount={editingExpense?.amount || 0}
                initialCategory={editingExpense?.category || ''} // Pass category to form
            />
            <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="mt-4 p-2 border border-gray-300 rounded"
            >
                <option value="">All Categories</option>
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Bills">Bills</option>
            </select>
            <h2 className="mt-8 text-xl">Expenses</h2>
            <ul className="w-full max-w-md mt-4 bg-white rounded shadow-md">
                {filteredExpenses.map((expense, index) => (
                    <li key={index} className="flex justify-between p-4 border-b last:border-b-0">
                        <span>{expense.description}</span>
                        <span>${expense.amount.toFixed(2)}</span>
                        <div>
                            <button onClick={() => handleEditExpense(expense)} className="mr-2 text-blue-500">Edit</button>
                            <button onClick={() => deleteExpense(expense)} className="text-red-500">Delete</button>
                        </div>
                    </li>
                ))}
            </ul>
            <h2 className="mt-4 text-xl font-bold">Total Expenses: ${totalAmount.toFixed(2)}</h2>
            <button onClick={exportToCSV} className="mt-4 p-2 bg-green-500 text-white rounded hover:bg-green-600">
                Export to CSV
            </button>
        </main>
    );
};

export default Home;
