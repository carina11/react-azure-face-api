import firebase from "firebase";

  firebase.initializeApp({
    "YOUR FIREBASE CREDENTIALS"
  });

const auth = firebase.auth();
//const db = firebase.database();
const db = firebase.firestore();
//const db = admin.firestore();
export {auth, db}