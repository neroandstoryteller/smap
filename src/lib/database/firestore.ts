import { initializeApp, getApps } from 'firebase/app';
import {
	getFirestore,
	doc,
	setDoc,
	getDoc,
	collection,
	addDoc,
	serverTimestamp,
	query,
	where,
	orderBy,
	limit,
	getDocs,
	startAfter,
	type QueryConstraint
} from 'firebase/firestore';
import { 
    getAuth, 
    signInWithPopup, // signInWithRedirect 대신 signInWithPopup을 사용합니다.
    signOut as firebaseSignOut, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    type User 
} from "firebase/auth";
import { firebaseConfig } from './firebaseConfig';
import type { ShapeData } from '../models/shapes';
import { error } from '@sveltejs/kit';
import { writable } from "svelte/store";

// --- Initialization (Single Point of Truth) ---
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Auth ---
const provider = new GoogleAuthProvider();
export const user = writable<User | null | undefined>(undefined, () => {
    console.log('User store has a new subscriber');
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log('[Auth State Change] Received user:', currentUser);
        user.set(currentUser);
    });
    // onAuthStateChanged는 unsubscribe 함수를 반환합니다.
    // 스토어의 구독자가 0이 되면 이 함수가 호출되어 리스너를 정리합니다.
    return unsubscribe;
});


export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        // signInWithPopup이 성공하면 onAuthStateChanged가 자동으로 호출되므로,
        // 여기서 user.set()을 다시 할 필요는 없습니다.
        console.log("Sign-in successful, user:", result.user);
    } catch (error) {
        console.error("Sign-in failed:", error);
    }
}

export function signOut() {
  firebaseSignOut(auth);
}

// --- Firestore ---

export async function saveShapes(mapName: string, shapes: ShapeData[]): Promise<void> {
	const docRef = doc(db, 'mapName', mapName);
	await setDoc(docRef, { shapes });
	console.log(`Shapes saved for ${mapName}`);
}

export async function loadShapes(
	mapName: string,
	fetcher: typeof fetch
): Promise<ShapeData[]> {
	const docRef = doc(db, 'mapName', mapName);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		console.log(`Shapes loaded for ${mapName} from Firestore.`);
		return docSnap.data().shapes || [];
	} else {
		console.log(`No document found for ${mapName}, returning default shapes via API.`);
		const res = await fetcher('/api/shapes');
		if (!res.ok) {
			console.error('Failed to fetch fallback shapes');
			return [];
		}
		return res.json();
	}
}

export interface Post {
	id?: string;
	title: string;
	building_name: string;
	post_photo_url: string;
	content: string;
	author: string;
	created_at: any; // Firestore Timestamp
	tag: '질문' | '공지' | '일반';
}

export async function savePost(postData: Omit<Post, 'created_at' | 'id'>): Promise<string> {
	try {
		const docRef = await addDoc(collection(db, 'posts'), {
			...postData,
			created_at: serverTimestamp()
		});
		console.log('Post written with ID: ', docRef.id);
		return docRef.id;
	} catch (e) {
		console.error('Error adding document: ', e);
		throw error(500, 'Failed to save post');
	}
}

export async function getPosts(options: {
	building_name: string;
	tag: '질문' | '공지' | '일반';
	limit: number;
	skip: number; 
	startAfterDoc?: any;
}): Promise<Post[]> {
	const postsCol = collection(db, 'posts');
	
	const queryConstraints: QueryConstraint[] = [
		where('building_name', '==', options.building_name),
		where('tag', '==', options.tag),
		orderBy('created_at', 'desc'),
	];

	if (options.startAfterDoc) {
		queryConstraints.push(startAfter(options.startAfterDoc));
	}
	
	queryConstraints.push(limit(options.limit));

	const q = query(postsCol, ...queryConstraints);


	const querySnapshot = await getDocs(q);
	const posts: Post[] = [];
	querySnapshot.forEach((doc) => {
		const data = doc.data();
		posts.push({
			id: doc.id,
			...data,
			created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at
		} as Post);
	});

	if (options.skip > 0 && !options.startAfterDoc) {
		const allDocsQuery = query(
			postsCol,
			where('building_name', '==', options.building_name),
			where('tag', '==', options.tag),
			orderBy('created_at', 'desc'),
			limit(options.skip + options.limit)
		)
		const allDocsSnapshot = await getDocs(allDocsQuery);
		const slicedDocs = allDocsSnapshot.docs.slice(options.skip);
		
		const slicedPosts: Post[] = [];
		slicedDocs.forEach((doc) => {
			const data = doc.data();
			slicedPosts.push({
				id: doc.id,
				...data,
				created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at
			} as Post);
		});
		return slicedPosts;
	}

	return posts;
}
