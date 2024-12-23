"use client";

import React, { useState, useEffect } from 'react';
import ExpenseForm from './ExpenseForm';
import { Expense, AppUser } from './types';
import { User } from 'firebase/auth';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { auth } from "../firebase";
import { 
    addExpenseToDb, 
    getExpensesForUser, 
    updateExpenseInDb, 
    deleteExpenseFromDb,
    addUserToDb,
    getUsersForUser,
    setupInitialUser,
    updateUserInDb
} from './firebaseOperation';
//import { FirebaseError } from 'firebase/app';

const Home: React.FC = () => {
    const router = useRouter();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [userName, setUserName] = useState<string>('');
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // In page.tsx - Update the auth state change handler
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                router.push('/auth');
            } else {
                setCurrentUser(user);
                try {
                    // Set up the initial user document if it doesn't exist
                    await setupInitialUser(user.uid);
                    await loadExpenses(user.uid);
                    await loadUsers(user.uid);
                } catch (error) {
                    console.error('Error setting up user:', error);
                }
            }
        });
        return () => unsubscribe();
    }, [router]);

    const loadExpenses = async (userId: string) => {
        try {
            const loadedExpenses = await getExpensesForUser(userId);
            setExpenses(loadedExpenses);
        } catch (error) {
            console.error('Error loading expenses:', error);
        }
    };

    const loadUsers = async (userId: string) => {
        try {
            const loadedUsers = await getUsersForUser(userId);
            
            // Find current user in loaded users
            const currentUserIndex = loadedUsers.findIndex(user => user.id === userId);
            
            if (currentUserIndex === -1) {
                // If current user not found, set up initial user
                const currentUser = await setupInitialUser(userId);
                loadedUsers.unshift(currentUser);
            } else {
                // Move current user to front of array
                const [currentUser] = loadedUsers.splice(currentUserIndex, 1);
                loadedUsers.unshift(currentUser);
            }
            
            setUsers(loadedUsers);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            router.push('/auth');
        } catch (error: unknown) {
            if (error instanceof Error) {

                alert(error.message);
            }
            else
            {
                alert("An unknown error occurred"); // Fallback for non-Error errors
                }
        }
    };

    const addUser = async () => {
        if (userName.trim() !== "" && currentUser) {
            try {
                const newUser = {
                    name: userName,
                    balance: 0,
                    createdBy: currentUser.uid
                };
                const addedUser = await addUserToDb(newUser);
                setUsers(prev => [...prev, addedUser]);
                setUserName("");
            } catch (error) {
                console.error('Error adding user:', error);
            }
        }
    };
    const updateUserBalances = async (updatedUsers: AppUser[]) => {
        try {
            // Assuming you have a function in firebaseOperation.ts to update user balances
            for (const user of updatedUsers) {
                await updateUserInDb(user.id, { balance: user.balance });
            }
        } catch (error) {
            console.error('Error updating user balances:', error);
        }
    };

    const addExpense = async (newExpense: Expense) => {
        if (!currentUser) return;
        try {
            const expenseWithUser = {
                ...newExpense,
                createdBy: currentUser.uid,
                createdAt: new Date()
            };
            const addedExpense = await addExpenseToDb(expenseWithUser);
            setExpenses(prev => [...prev, addedExpense]);
            
            // Update user balances
            const amountPerFriend = newExpense.amount / newExpense.friends.length;
            const updatedUsers = users.map(user => {
                if (newExpense.friends.some(friend => friend.id === user.id)) {
                    return { ...user, balance: user.balance - amountPerFriend };
                }
                return user;
            });
            setUsers(updatedUsers);
            
            // Persist the updated balances
            await updateUserBalances(updatedUsers);
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    };

    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
    };

    const saveEditedExpense = async (updatedExpense: Expense) => {
        if (!currentUser) return;
        try {
            await updateExpenseInDb(updatedExpense.id, updatedExpense);
            setExpenses(prevExpenses =>
                prevExpenses.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp)
            );
            setEditingExpense(null);
        } catch (error) {
            console.error('Error updating expense:', error);
        }
    };

    const deleteExpense = async (expenseToDelete: Expense) => {
        if (!currentUser) return;
        try {
            await deleteExpenseFromDb(expenseToDelete.id);
            setExpenses(prevExpenses => 
                prevExpenses.filter(exp => exp.id !== expenseToDelete.id)
            );

            // Update user balances
            const updatedUsers = users.map(user => {
                if (expenseToDelete.friends.some(friend => friend.id === user.id)) {
                    const amountToAdd = expenseToDelete.amount / expenseToDelete.friends.length;
                    return { ...user, balance: user.balance + amountToAdd };
                }
                return user;
            });
            setUsers(updatedUsers);
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const filteredExpenses = filterCategory
        ? expenses.filter((exp) => exp.category === filterCategory)
        : expenses;

    const exportToCSV = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Description,Amount,Category\n"
            + filteredExpenses.map(e => `${e.description},${e.amount},${e.category}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "expenses.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
            <button 
                onClick={handleLogout}
                className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Logout
            </button>
            
            <h1 className="text-2xl font-bold mb-8">Welcome to Split Expenses w Friends</h1>

            <div className="w-full max-w-md mb-6">
                <input
                    type="text"
                    placeholder="Enter Friend's Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded mr-2"
                />
                <button 
                    onClick={addUser}
                    className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Add Friend
                </button>
            </div>

            <h2 className="text-xl font-semibold mb-4">Friends</h2>
            <ul className="w-full max-w-md mb-8">
                {users.map((user) => (
                    <li key={user.id} className="flex justify-between items-center p-3 bg-white rounded shadow mb-2">
                        <span>
                            {user.name}: {user.balance < 0 
                                ? `$${Math.abs(user.balance).toFixed(2)} owes` 
                                : `$${user.balance.toFixed(2)} is owed`}
                        </span>
                        {user.name !== 'me' && (
                            <button
                                onClick={() => setUsers(users.filter((u) => u.id !== user.id))}
                                className="text-red-500 hover:text-red-700"
                            >
                                Delete
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            
            <ExpenseForm 
                onAddExpense={editingExpense ? saveEditedExpense : addExpense}
                users={users}
                initialExpense={editingExpense}
                setUsers={setUsers}
                userId={currentUser?.uid || ''}
            />

            <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full max-w-md mt-8 mb-4 p-2 border border-gray-300 rounded"
            >
                <option value="">All Categories</option>
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Bills">Bills</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
            </select>

            <h2 className="text-xl font-semibold mb-4">Expenses</h2>
            <ul className="w-full max-w-md mb-8">
                {filteredExpenses.map((expense) => (
                    <li key={expense.id} className="bg-white rounded shadow mb-3 p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-semibold">{expense.description}</h3>
                                <p className="text-gray-600">${expense.amount.toFixed(2)}</p>
                                <p className="text-sm text-gray-500">{expense.category}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => handleEditExpense(expense)}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => deleteExpense(expense)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            {expense.friends.map(friend => (
                                <div key={friend.id}>
                                    {friend.name} owes: ${expense.amountsOwed[friend.name].toFixed(2)}
                                </div>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>

            <h2 className="text-xl font-bold mb-4">Total Expenses: ${totalAmount.toFixed(2)}</h2>
            
            <button 
                onClick={exportToCSV}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 mb-4"
            >
                Export to CSV
            </button>

            <Link 
                href="/auth" 
                className="text-blue-500 hover:text-blue-700 underline"
            >
                Go to Login / Sign Up
            </Link>
        </main>
    );
};

export default Home;