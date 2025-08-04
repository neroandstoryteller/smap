import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import type { ShapeData } from '../models/shapes';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

function getDb(): Firestore {
    if (!getApps().length) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
}

export async function saveShapes(mapName: string, shapes: ShapeData[]): Promise<void> {
    const db = getDb();
    const docRef = doc(db, 'mapName', mapName);
    await setDoc(docRef, { shapes });
    console.log(`Shapes saved for ${mapName}`);
}

export async function loadShapes(
    mapName: string,
    fetcher: typeof fetch
): Promise<ShapeData[]> {
    const db = getDb();
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

export async function uploadImage(file: File) {
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);

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
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);

    try {
        const storageRef = ref(storage, imageUrl);
        await deleteObject(storageRef);
        console.log(`Image deleted: ${imageUrl}`);
    } catch (error: any) {
        console.error('삭제 에러:', error.code, error.message);
        throw error;
    }
}
