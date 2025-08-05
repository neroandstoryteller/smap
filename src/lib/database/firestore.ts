import {
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
	signInWithPopup,
	signOut as firebaseSignOut,
	GoogleAuthProvider,
	type User
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from './firebase'; // <- 변경된 부분
import type { ShapeData } from '../models/shapes';
import { error } from '@sveltejs/kit';

// --- Auth ---
const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
	try {
		const result = await signInWithPopup(auth, provider);
		console.log('Sign-in successful, user:', result.user);
	} catch (error) {
		console.error('Sign-in failed:', error);
	}
}

export function signOut() {
	firebaseSignOut(auth);
}

// --- Firestore ---

export async function saveShapes(mapName: string, shapes: ShapeData[]): Promise<void> {
	await fetch('/api/embedding', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ mapName, shapes })
	});
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
	is_event?: boolean;
	event_date?: any;
	event_room?: string;
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
}): Promise<Post[]> {
	const postsCol = collection(db, 'posts');

	const queryConstraints: QueryConstraint[] = [
		where('building_name', '==', options.building_name),
		where('tag', '==', options.tag),
		orderBy('created_at', 'desc'),
		limit(options.limit)
	];

	if (options.skip > 0) {
		const q_for_startAfter = query(
			postsCol,
			where('building_name', '==', options.building_name),
			where('tag', '==', options.tag),
			orderBy('created_at', 'desc'),
			limit(options.skip)
		);
		const documentSnapshots = await getDocs(q_for_startAfter);
		const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
		if (lastVisible) {
			queryConstraints.push(startAfter(lastVisible));
		}
	}

	const q = query(postsCol, ...queryConstraints);

	const querySnapshot = await getDocs(q);
	const posts: Post[] = [];
	querySnapshot.forEach((doc) => {
		const data = doc.data();
		posts.push({
			id: doc.id,
			...data,
			created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
			event_date: data.event_date?.toDate ? data.event_date.toDate() : data.event_date
		} as Post);
	});
	return posts;
}

export async function getAllPosts(options: {
	building_name: string;
	limit: number;
	skip: number;
}): Promise<Post[]> {
	const postsCol = collection(db, 'posts');

	const queryConstraints: QueryConstraint[] = [
		where('building_name', '==', options.building_name),
		orderBy('created_at', 'desc'),
		limit(options.limit)
	];

	if (options.skip > 0) {
		const q_for_startAfter = query(
			postsCol,
			where('building_name', '==', options.building_name),
			orderBy('created_at', 'desc'),
			limit(options.skip)
		);
		const documentSnapshots = await getDocs(q_for_startAfter);
		const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
		if (lastVisible) {
			queryConstraints.push(startAfter(lastVisible));
		}
	}

	const q = query(postsCol, ...queryConstraints);

	const querySnapshot = await getDocs(q);
	const posts: Post[] = [];
	querySnapshot.forEach((doc) => {
		const data = doc.data();
		posts.push({
			id: doc.id,
			...data,
			created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
			event_date: data.event_date?.toDate ? data.event_date.toDate() : data.event_date
		} as Post);
	});
	return posts;
}

export async function getEvents(options: { building_name: string }): Promise<Post[]> {
	const postsCol = collection(db, 'posts');
	const q = query(
		postsCol,
		where('building_name', '==', options.building_name),
		where('is_event', '==', true),
		orderBy('event_date', 'asc')
	);

	const querySnapshot = await getDocs(q);
	const events: Post[] = [];
	querySnapshot.forEach((doc) => {
		const data = doc.data();
		events.push({
			id: doc.id,
			...data,
			created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
			event_date: data.event_date?.toDate ? data.event_date.toDate() : data.event_date
		} as Post);
	});
	return events;
}

export async function getPost(post_uid: string): Promise<Post | null> {
	const docRef = doc(db, 'posts', post_uid);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		const data = docSnap.data();
		return {
			id: docSnap.id,
			...data,
			created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
			event_date: data.event_date?.toDate ? data.event_date.toDate() : data.event_date
		} as Post;
	} else {
		return null;
	}
}

export async function uploadImage(file: File) {
    if (!file) throw new Error('파일 없음');
    
    try {
        const fileName = `img_${Date.now()}.png`;
        const storageRef = ref(storage, `images/${fileName}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error: any) {
        console.error('업로드 에러:', error.code, error.message);
        throw error;
    }
}

export async function deleteImage(imageUrl: string) {
    try {
        const storageRef = ref(storage, imageUrl);
        await deleteObject(storageRef);
        console.log(`Image deleted: ${imageUrl}`);
    } catch (error: any) {
        console.error('삭제 에러:', error.code, error.message);
        throw error;
    }
}
