import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB-9vEr7Kpri1nnm-WoYw5u1M6fXnixzy0",
  authDomain: "gen-lang-client-0282938952.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function run() {
  try {
     console.log("Attempting to sign in anonymously...");
     const userCred = await signInAnonymously(auth);
     console.log("Anonymous Sign In successful! UID:", userCred.user.uid);
     process.exit(0);
  } catch (e) {
     console.log("Anonymous Sign In failed:", e.code, e.message);
     process.exit(1);
  }
}
run();
