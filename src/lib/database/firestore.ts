import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import type { ShapeData } from '../models/shapes';

function getDb(): Firestore {
	if (!getApps().length) {
		initializeApp(firebaseConfig);
	}
	return getFirestore(getApp());
}

export async function saveShapes(buildingName: string, shapes: ShapeData[]): Promise<void> {
	const db = getDb();
	const docRef = doc(db, 'buildings', buildingName);
	await setDoc(docRef, { shapes });
	console.log(`Shapes saved for ${buildingName}`);
}

export async function loadShapes(
	buildingName: string,
	fetcher: typeof fetch
): Promise<ShapeData[]> {
	const db = getDb();
	const docRef = doc(db, 'buildings', buildingName);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		console.log(`Shapes loaded for ${buildingName} from Firestore.`);
		return docSnap.data().shapes || [];
	} else {
		console.log(`No document found for ${buildingName}, returning default shapes via API.`);
		// Fallback to local API if no data in Firestore
		// Use the provided fetcher to make the request work in both SSR and client
		const res = await fetcher('/api/shapes');
		if (!res.ok) {
			console.error('Failed to fetch fallback shapes');
			return [];
		}
		return res.json();
	}
}
