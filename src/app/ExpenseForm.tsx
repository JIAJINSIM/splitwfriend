"use client";

import { useState, useEffect } from 'react';
import { Expense, User } from './types';

interface ExpenseFormProps {
    onAddExpense: (expense: Expense) => void;
    initialDescription?: string;
    initialAmount?: number;
    initialCategory?: string;
    users: User[]; // Pass users (friends) to the form
    setUsers: React.Dispatch<React.SetStateAction<User[]>>; // To update users (friends) list
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
    onAddExpense,
    initialDescription = '',
    initialAmount = 0,
    initialCategory = '',
    users,
    setUsers
}) => {
    const [description, setDescription] = useState(initialDescription);
    const [amount, setAmount] = useState(initialAmount.toString());
    const [category, setCategory] = useState(initialCategory);
    const [selectedFriends, setSelectedFriends] = useState<User[]>([]); // Track selected friends

    useEffect(() => {
        setDescription(initialDescription);
        setAmount(initialAmount.toString());
        setCategory(initialCategory);
    }, [initialDescription, initialAmount, initialCategory]);

    // Automatically add yourself (the current user) to the friends list when the page loads
    useEffect(() => {
        if (users.length > 0 && selectedFriends.length === 0) {
            setSelectedFriends([users[0]]); // Add the current user (yourself) by default
        }
    }, [users, selectedFriends]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Calculate the amount owed per friend
        const amountPerFriend = parseFloat(amount) / selectedFriends.length;

        // Calculate the amounts owed for each friend
        const amountsOwed = selectedFriends.reduce((acc, friend) => {
            acc[friend.name] = amountPerFriend; // Each friend owes an equal share
            return acc;
        }, {} as { [key: string]: number });

        const newExpense: Expense = { 
            description, 
            amount: parseFloat(amount), 
            category,
            friends: selectedFriends,
            amountsOwed, // Include amountsOwed in the new expense
        };

        onAddExpense(newExpense);
        setDescription('');
        setAmount('');
        setCategory('');
        setSelectedFriends([users[0]]); // Reset selected friends with "me"
    };

    const handleDeleteFriend = (friendToDelete: User) => {
        if (friendToDelete.name === 'me') return; // Prevent deleting "yourself"
        setSelectedFriends((prevSelectedFriends) => 
            prevSelectedFriends.filter((friend) => friend.id !== friendToDelete.id)
        );
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

            {/* Friends selection */}
            <div className="flex flex-col mt-4">
                <span>Split with:</span>
                {users.map((user) => (
                    <label key={user.id} className="flex items-center">
                        <input
                            type="checkbox"
                            checked={selectedFriends.some((friend) => friend.id === user.id)}
                            onChange={() => {
                                if (selectedFriends.some((friend) => friend.id === user.id)) {
                                    // Remove friend if already selected (but not "me")
                                    if (user.name !== 'me') {
                                        setSelectedFriends(selectedFriends.filter((friend) => friend.id !== user.id));
                                    }
                                } else {
                                    // Add friend if not selected
                                    setSelectedFriends([...selectedFriends, user]);
                                }
                            }}
                        />
                        {user.name === 'me' ? 'Yourself' : user.name} {/* Label as "Yourself" for the current user */}
                        {/* Add Delete button */}
                        {selectedFriends.some((friend) => friend.id === user.id) && user.name !== 'me' && (
                            <button
                                type="button"
                                onClick={() => handleDeleteFriend(user)}
                                className="ml-2 text-red-500"
                            >
                                Delete
                            </button>
                        )}
                    </label>
                ))}
            </div>

            {/* Submit Button */}
            <button type="submit" className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                {initialDescription ? 'Update Expense' : 'Add Expense'}
            </button>
        </form>
    );
};

export default ExpenseForm;
