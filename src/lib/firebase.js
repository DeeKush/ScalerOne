import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

export function getFirebaseAuth() {
  return getAuth(getApp());
}

/** Uses the nameless `(default)` database from google-services.json (scalerone-746d8). */
export function getFirebaseDb() {
  return getFirestore(getApp());
}
