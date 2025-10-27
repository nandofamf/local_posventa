import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDLfECiL9rl5JOB0nlEF0ekdabzjx3ibQ0",
  authDomain: "localnuevo-8d0d0.firebaseapp.com",
  databaseURL: "https://localnuevo-8d0d0-default-rtdb.firebaseio.com",
  projectId: "localnuevo-8d0d0",
  storageBucket: "localnuevo-8d0d0.firebasestorage.app",
  messagingSenderId: "992287053803",
  appId: "1:992287053803:web:20402414ff55bd04366bae",
  measurementId: "G-JSKLGJTY1K"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
