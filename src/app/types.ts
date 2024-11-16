// src/app/types.ts
export interface Expense {
    description: string;
    amount: number;
    category: string; // Add the category field
    friends: User[]; // Array of friends who are splitting the expense
}

export interface User {
    id: string;
    name: string;
    balance: number; // Tracks how much they owe or are owed
}