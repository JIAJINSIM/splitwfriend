// firebaseOperations.tsx
import { db } from '../firebase';
import { 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where,
    DocumentData,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { Expense, AppUser } from './types';

const convertToUser = (doc: DocumentData): AppUser => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name,
        balance: data.balance,
        email: data.email,
        createdBy: data.createdBy
    };
};

export const getUsersForUser = async (userId: string): Promise<AppUser[]> => {
    try {
        // Only filter by createdBy, don't exclude the current user
        const q = query(
            collection(db, 'users'), 
            where('createdBy', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => convertToUser(doc));
    } catch (error) {
        console.error('Error getting users: ', error);
        throw error;
    }
};

export const updateUserInDb = async (userId: string, updates: Partial<AppUser>) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
};

export const addExpenseToDb = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    try {
        const docRef = await addDoc(collection(db, 'expenses'), expense);
        return { ...expense, id: docRef.id };
    } catch (error) {
        console.error('Error adding expense: ', error);
        throw error;
    }
};

export const getExpensesForUser = async (userId: string): Promise<Expense[]> => {
    try {
        const q = query(collection(db, 'expenses'), where('createdBy', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate()
        } as Expense));
    } catch (error) {
        console.error('Error getting expenses: ', error);
        throw error;
    }
};

export const updateExpenseInDb = async (
    expenseId: string, 
    updatedExpense: Partial<Expense>
): Promise<boolean> => {
    try {
        const expenseRef = doc(db, 'expenses', expenseId);
        await updateDoc(expenseRef, updatedExpense);
        return true;
    } catch (error) {
        console.error('Error updating expense: ', error);
        throw error;
    }
};

export const deleteExpenseFromDb = async (expenseId: string): Promise<boolean> => {
    try {
        await deleteDoc(doc(db, 'expenses', expenseId));
        return true;
    } catch (error) {
        console.error('Error deleting expense: ', error);
        throw error;
    }
};

// Update firebaseOperations.tsx - Add error handling for user operations
export const updateUserBalance = async (userId: string, newBalance: number): Promise<boolean> => {
    try {
        // Skip update if trying to update the current user's balance
        //if (userId === 'me') return true;
        
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { balance: newBalance });
        return true;
    } catch (error) {
        console.error('Error updating user balance:', error);
        throw error;
    }
};

// Add a function to handle initial user setup
export const setupInitialUser = async (userId: string, name: string = 'me'): Promise<AppUser> => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef); // Add this import from firebase/firestore

        if (!userSnap.exists()) {
            const userData = {
                name,
                balance: 0,
                createdBy: userId,
                createdAt: new Date()
            };
            await setDoc(userRef, userData);
            return { ...userData, id: userId };
        }
        
        // If user exists, return existing data
        const existingData = userSnap.data();
        return { ...existingData, id: userId } as AppUser;
    } catch (error) {
        console.error('Error setting up initial user:', error);
        throw error;
    }
};

export const addUserToDb = async (user: { 
    name: string;
    balance: number;
    createdBy: string;
}): Promise<AppUser> => {
    try {
        const docRef = await addDoc(collection(db, 'users'), user);
        return { ...user, id: docRef.id };
    } catch (error) {
        console.error('Error adding user: ', error);
        throw error;
    }
};