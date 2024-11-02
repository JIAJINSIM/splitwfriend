// src/app/ExpenseForm.tsx
"use client";

import { useState, useEffect } from 'react';
import { Expense } from './types';

interface ExpenseFormProps {
    onAddExpense: (expense: Expense) => void;
    initialDescription?: string;
    initialAmount?: number;
    initialCategory?: string; // Add initialCategory prop
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
    onAddExpense,
    initialDescription = '',
    initialAmount = 0,
    initialCategory = '' // Default for category
}) => {
    const [description, setDescription] = useState(initialDescription);
    const [amount, setAmount] = useState(initialAmount.toString());
    const [category, setCategory] = useState(initialCategory); // Add state for category

    useEffect(() => {
        setDescription(initialDescription);
        setAmount(initialAmount.toString());
        setCategory(initialCategory); // Set initial category
    }, [initialDescription, initialAmount, initialCategory]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newExpense: Expense = { description, amount: parseFloat(amount), category };
        onAddExpense(newExpense);
        setDescription('');
        setAmount('');
        setCategory(''); // Reset category
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 p-4 bg-white rounded shadow-md">
            <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                required
                className="p-2 border border-gray-300 rounded"
            />
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                required
                className="p-2 border border-gray-300 rounded"
            />
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="p-2 border border-gray-300 rounded"
                required
            >
                <option value="">Select a category</option>
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Bills">Bills</option>
                {/* Add more categories as needed */}
            </select>
            <button type="submit" className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                {initialDescription ? 'Update Expense' : 'Add Expense'}
            </button>
        </form>
    );
};

export default ExpenseForm;
