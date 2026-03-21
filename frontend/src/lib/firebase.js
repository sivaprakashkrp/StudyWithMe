import firebase from 'firebase/app';
import 'firebase/firestore';
import { firebaseConfig } from "../secrets/index.js";

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();
const { FieldValue } = firebase.firestore;

export { firebase, firestore, FieldValue };
