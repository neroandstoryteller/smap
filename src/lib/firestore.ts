import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import type { ShapeData } from './models/shapes';

let app: FirebaseApp;
let db: Firestore;

function getDb() {
	if (!app) {
		app = initializeApp(firebaseConfig);
		db = getFirestore(app);
	}
	return db;
}

export async function saveShapes(buildingName: string, shapes: ShapeData[]): Promise<void> {
	const db = getDb();
	const docRef = doc(db, 'buildings', buildingName);
	await setDoc(docRef, { shapes });
	console.log(`Shapes saved for ${buildingName}`);
}

export async function loadShapes(buildingName: string): Promise<ShapeData[]> {
	const db = getDb();
	const docRef = doc(db, 'buildings', buildingName);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		console.log(`Shapes loaded for ${buildingName}`);
		return docSnap.data().shapes || [];
	} else {
		console.log(`No document found for ${buildingName}, returning default shapes.`);
		// Fallback to local API if no data in Firestore
		const res = await fetch('/api/shapes');
		return res.json();
	}
}
