// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvHSAYdsQrykOvi7CohCHhNDwb6PRz3SM",
  authDomain: "internal-support-ddb4c.firebaseapp.com",
  projectId: "internal-support-ddb4c",
  storageBucket: "internal-support-ddb4c.appspot.com",
  messagingSenderId: "1075175910762",
  appId: "1:1075175910762:web:6282d0a08113a435050913"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {db};