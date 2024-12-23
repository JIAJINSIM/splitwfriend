// ExpenseForm.tsx
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Expense, AppUser } from './types';
import { updateUserBalance } from './firebaseOperation';

interface ExpenseFormProps {
    onAddExpense: (expense: Expense) => void;
    users: AppUser[];
    initialExpense: Expense | null;
    setUsers: Dispatch<SetStateAction<AppUser[]>>;
    userId?: string; // Made optional since it might not always be needed
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
    onAddExpense,
    users: initialUsers,
    initialExpense,
    setUsers,
    userId = ''
}) => {
    const [description, setDescription] = useState(initialExpense?.description || '');
    const [amount, setAmount] = useState(initialExpense?.amount.toString() || '');
    const [category, setCategory] = useState(initialExpense?.category || '');
    const [users, setLocalUsers] = useState<AppUser[]>(initialUsers);
    const [selectedFriends, setSelectedFriends] = useState<AppUser[]>(
        initialExpense?.friends 
            ? initialUsers.filter(user => 
                initialExpense.friends.some(friend => friend.id === user.id)
              )
            : initialUsers.length > 0 ? [initialUsers[0]] : []
    );

    useEffect(() => {
        setLocalUsers(initialUsers);
    }, [initialUsers]);

    useEffect(() => {
        if (initialExpense) {
            setDescription(initialExpense.description);
            setAmount(initialExpense.amount.toString());
            setCategory(initialExpense.category);
            setSelectedFriends(
                initialUsers.filter(user => 
                    initialExpense.friends.some(friend => friend.id === user.id)
                )
            );
        }
    }, [initialExpense, initialUsers]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const amountPerFriend = parseFloat(amount) / selectedFriends.length;
        const amountsOwed = selectedFriends.reduce((acc, friend) => {
            acc[friend.name] = amountPerFriend;
            return acc;
        }, {} as { [key: string]: number });

        const expenseData: Expense = {
            id: initialExpense?.id || '', // Will be set by Firebase for new expenses
            description,
            amount: parseFloat(amount),
            category,
            friends: selectedFriends.map(f => ({ id: f.id, name: f.name })),
            amountsOwed,
            createdBy: userId,
            createdAt: initialExpense?.createdAt || new Date()
        };

        try {
            onAddExpense(expenseData);
    
            // Only update balances if it's a new expense
            if (!initialExpense) {
                for (const friend of selectedFriends) {
                    // Skip balance update for the current user (me)
                    if (friend.name === 'me') continue;
                    
                    const newBalance = friend.balance - amountPerFriend;
                    await updateUserBalance(friend.id, newBalance);
                    setUsers(prevUsers =>
                        prevUsers.map(u =>
                            u.id === friend.id ? { ...u, balance: newBalance } : u
                        )
                    );
                }
            }
    
            // Reset form if it's not an edit
            if (!initialExpense) {
                setDescription('');
                setAmount('');
                setCategory('');
                setSelectedFriends(users.length > 0 ? [users[0]] : []);
            }
        } catch (error) {
            console.error("Error submitting expense:", error);
        }
    };

    const renderUsersList = () => {
        // Remove duplicates based on user ID
        const uniqueUsers = users.filter((user, index, self) =>
            index === self.findIndex((u) => u.id === user.id)
        );
    
        return uniqueUsers.map((user) => (
            <label key={user.id} className="flex items-center">
                <input
                    type="checkbox"
                    checked={selectedFriends.some((friend) => friend.id === user.id)}
                    onChange={() => {
                        if (selectedFriends.some((friend) => friend.id === user.id)) {
                            if (user.name !== 'me') {
                                setSelectedFriends(prev => prev.filter((friend) => friend.id !== user.id));
                            }
                        } else {
                            setSelectedFriends(prev => [...prev, user]);
                        }
                    }}
                />
                {user.name === 'me' ? 'Yourself' : user.name}
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
        ));
    };

    const handleDeleteFriend = (friendToDelete: AppUser) => {
        if (friendToDelete.name === 'me') return;
        setSelectedFriends(prev => prev.filter(friend => friend.id !== friendToDelete.id));
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
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
            </select>

            <div className="flex flex-col mt-4">
                <span>Split with:</span>
                {renderUsersList()}
            </div>

            <button type="submit" className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                {initialExpense ? 'Update Expense' : 'Add Expense'}
            </button>
        </form>
    );
};

export default ExpenseForm;