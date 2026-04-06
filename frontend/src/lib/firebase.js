import firebase from 'firebase/app';
import 'firebase/firestore';
import { firebaseConfig } from "/home/raj-jagadeesh/Documents/College Files/Sem 4/Web Programming/StudyWithMe/frontend/secrets/index.js";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();
const { FieldValue } = firebase.firestore;

export { firebase, firestore, FieldValue };
