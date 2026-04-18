import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import { firebaseConfig } from "/home/raj-jagadeesh/Documents/College Files/Sem 4/Web Programming/StudyWithMe/frontend/secrets/index.js";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();
const storage = firebase.storage();

export { firebase, firestore, storage };
