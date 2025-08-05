import { writable } from 'svelte/store';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '$lib/database/firebase';

export const user = writable<User | null | undefined>(undefined, (set) => {
	console.log('User store has a new subscriber');
	const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
		console.log('[Auth State Change] Received user:', currentUser);
		set(currentUser);
	});
	
	return unsubscribe;
});

