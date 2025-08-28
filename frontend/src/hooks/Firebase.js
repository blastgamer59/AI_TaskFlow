import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBR613uH4RJprczgzsgQ_y8wNYXeCEAxCg",
  authDomain: "smart-taskflow.firebaseapp.com",
  projectId: "smart-taskflow",
  storageBucket: "smart-taskflow.firebasestorage.app",
  messagingSenderId: "174463612186",
  appId: "1:174463612186:web:363a3b6a5879103798a8a3",
  measurementId: "G-CC6T1TPKY3",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
