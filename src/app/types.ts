// types.ts
export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    friends: Array<{ id: string; name: string }>;
    amountsOwed: { [key: string]: number };
    createdBy: string;
    createdAt: Date;
}

export interface AppUser {
    id: string;
    name: string;
    balance: number;
    email?: string;
    createdBy?: string;
}