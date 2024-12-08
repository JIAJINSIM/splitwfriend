"use client";

import React, { useState, useEffect } from 'react';
import ExpenseForm from './ExpenseForm';
import { Expense, User } from './types';

const Home: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [users, setUsers] = useState<User[]>([{ id: 'me', name: 'me', balance: 0 }]); // Always add "me" to the list
    const [userName, setUserName] = useState<string>(''); // Friend name input
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('');

    // Load saved expenses from localStorage
    useEffect(() => {
        const savedExpenses = localStorage.getItem('expenses');
        if (savedExpenses) {
            setExpenses(JSON.parse(savedExpenses));
        }
    }, []);

    // Load saved users (friends) from localStorage, ensuring "me" is always included
    useEffect(() => {
        const savedUsers = localStorage.getItem('users');
        if (savedUsers) {
            const parsedUsers = JSON.parse(savedUsers);
            if (!parsedUsers.find((user: User) => user.name === 'me')) {
                // Ensure "me" is in the list even if not saved previously
                parsedUsers.push({ id: 'me', name: 'me', balance: 0 });
            }
            setUsers(parsedUsers);
        }
    }, []);

    // Save expenses to localStorage
    useEffect(() => {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }, [expenses]);

    // Save users (friends) to localStorage
    useEffect(() => {
        localStorage.setItem('users', JSON.stringify(users));
    }, [users]);

    // Add user (friend) only on button click
    const addUser = () => {
        if (userName.trim() !== "") {
            setUsers((prevUsers) => [
                ...prevUsers,
                { id: `${Date.now()}`, name: userName, balance: 0 },
            ]);
            setUserName(""); // Reset the input field after adding the user
        }
    };

    const addExpense = (newExpense: Expense) => {
        const totalFriends = newExpense.friends.length;
        if (totalFriends > 0) {
            const amountPerFriend = newExpense.amount / totalFriends; // Split evenly among selected friends

            // Update the balance for each selected friend
            const updatedUsers = users.map((user) => {
                if (newExpense.friends.some((friend) => friend.id === user.id)) {
                    return { ...user, balance: user.balance - amountPerFriend }; // Deduct share from balance
                }
                return user;
            });

            setUsers(updatedUsers);
            setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
        }
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
        // Remove expense and update user balances accordingly
        setExpenses((prevExpenses) => prevExpenses.filter((exp) => exp !== expenseToDelete));

        // Adjust the users' balances if necessary after deleting an expense
        const updatedUsers = users.map((user) => {
            expenseToDelete.friends.forEach((friend) => {
                if (friend.id === user.id) {
                    // Add back the amount to the user's balance
                    user.balance += expenseToDelete.amount / expenseToDelete.friends.length;
                }
            });
            return user;
        });

        setUsers(updatedUsers);
    };

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const filteredExpenses = filterCategory
        ? expenses.filter((exp) => exp.category === filterCategory)
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

            {/* Add a user (friend) */}
            <div>
                <input
                    type="text"
                    placeholder="Enter Friend's Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)} // Track the name input
                />
                <button onClick={addUser}>Add Friend</button> {/* Trigger addUser function */}
            </div>

            {/* Display all friends */}
            <h2 className="mt-8 text-xl">Friends</h2>
            <ul>
                {users.map((user) => (
                    <li key={user.id}>
                        {user.name}: {user.balance < 0 ? `${Math.abs(user.balance).toFixed(2)} owes` : `${user.balance.toFixed(2)} is owed`}
                        {/* Add delete button */}
                        {user.name !== 'me' && (
                            <button
                                onClick={() => setUsers(users.filter((u) => u.id !== user.id))}
                                className="ml-2 text-red-500"
                            >
                                Delete
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {/* Expense form */}
            <ExpenseForm 
                onAddExpense={editingExpense ? saveEditedExpense : addExpense} 
                users={users} // Pass users (friends) to the form
                initialDescription={editingExpense?.description || ''}
                initialAmount={editingExpense?.amount || 0}
                initialCategory={editingExpense?.category || ''}
                setUsers={setUsers} // Pass setUsers to ExpenseForm
            />

            {/* Filter Expenses by Category */}
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

            {/* Expenses List */}
            <h2 className="mt-8 text-xl">Expenses</h2>
                <ul className="w-full max-w-md mt-4 bg-white rounded shadow-md">
                    {filteredExpenses.map((expense, index) => (
                        <li key={index} className="flex justify-between p-4 border-b last:border-b-0">
                            <div>
                                <span>{expense.description}</span><br />
                                <span>${expense.amount.toFixed(2)}</span>
                                <div>
                                    {expense.friends.map(friend => (
                                    <div key={friend.id}>
                                        {friend.name} owes: ${expense.amountsOwed[friend.name].toFixed(2)}
                                    </div>
                                ))}
                                </div>
                            </div>
            <div>
                <button onClick={() => handleEditExpense(expense)} className="mr-2 text-blue-500">Edit</button>
                <button onClick={() => deleteExpense(expense)} className="text-red-500">Delete</button>
            </div>
        </li>
    ))}
</ul>


            {/* Total Expenses */}
            <h2 className="mt-4 text-xl font-bold">Total Expenses: ${totalAmount.toFixed(2)}</h2>
            
            {/* Export to CSV */}
            <button onClick={exportToCSV} className="mt-4 p-2 bg-green-500 text-white rounded hover:bg-green-600">
                Export to CSV
            </button>
        </main>
    );
};

export default Home;
