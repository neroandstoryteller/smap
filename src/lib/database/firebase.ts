import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth as getFirebaseAuth, type Auth } from 'firebase/auth';
import { getStorage as getFirebaseStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';

let app: FirebaseApp;

function getApp(): FirebaseApp {
	if (!app) {
		app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
	}
	return app;
}

export function getDb(): Firestore {
	return getFirestore(getApp());
}

export function getAuth(): Auth {
	return getFirebaseAuth(getApp());
}

export function getStorage(): FirebaseStorage {
	return getFirebaseStorage(getApp());
}
