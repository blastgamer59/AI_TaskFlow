import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "../hooks/Firebase";

const userAuthContext = createContext();

export function UserAuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  function logIn(email, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const currentUser = userCredential.user;
        setUser(currentUser);

        // Fetch role from backend
        const res = await fetch(`https://ai-taskflow-ks8s.onrender.com/get-role?email=${currentUser.email}`);
        if (!res.ok) {
          throw new Error("Failed to fetch role");
        }
        const data = await res.json();
        setUserRole(data.role || "user");
        setIsLoading(false);
        resolve({ user: currentUser, role: data.role || "user" });
      } catch (error) {
        console.error("Login error:", error);
        setIsLoading(false);
        reject(error);
      }
    });
  }

  function signUp(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function logOut() {
    setUser(null);
    setUserRole(null);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth changed:", currentUser);
      setUser(currentUser);

      if (currentUser) {
        try {
          const res = await fetch(`https://ai-taskflow-ks8s.onrender.com/get-role?email=${currentUser.email}`);
          if (!res.ok) {
            throw new Error("Failed to fetch role");
          }
          const data = await res.json();
          setUserRole(data.role || "user");
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          setUserRole("user");
        }
      } else {
        setUserRole(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <userAuthContext.Provider value={{ user, userRole, isLoading, logIn, signUp, logOut }}>
      {children}
    </userAuthContext.Provider>
  );
}

export function useUserAuth() {
  return useContext(userAuthContext);
}