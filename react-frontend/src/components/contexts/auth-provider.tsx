import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { doc, setDoc } from "firebase/firestore";

type AuthProviderProps = {
  children: React.ReactNode;
};

type AuthContextType = {
  user: User | null;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  isAuthenticating: boolean;
};

const initialValue: AuthContextType = {
  user: null,
  signUp: async () => new Promise(() => {}), // Promise that never resolves
  login: async () => new Promise(() => {}), // Promise that never resolves
  logout: async () => Promise.resolve(),
  isAuthenticating: false,
};

const AuthContext = createContext<AuthContextType>(initialValue);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  console.log("auth provider loading");

  async function signUp(email: string, password: string) {
    console.log("Creating new user account");
    setIsAuthenticating(true);
    try {
      // 1. Create the authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 2. Create a corresponding document in Firestore
      await createUserDocument(userCredential.user);
      
      return userCredential;
    } catch (error) {
      console.error("Error during sign up:", error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }
  
  // Helper function to create user document in Firestore
  async function createUserDocument(user: User) {
    try {
      // Create a reference to the user document
      const userDocRef = doc(db, "users", user.uid);
      
      // Create the user document with initial data
      await setDoc(userDocRef, {
        display_name: user.displayName || user.email?.split('@')[0] || "New User",
        email: user.email,
        created_at: new Date(),
        last_login: new Date()
      });
      
      console.log("User document created in Firestore:", user.uid);
    } catch (error) {
      console.error("Error creating user document:", error);
      // We don't throw here to prevent blocking authentication if document creation fails
    }
  }

  async function login(email: string, password: string) {
    setIsAuthenticating(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update the last_login field in the user document
      try {
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userDocRef, { last_login: new Date() }, { merge: true });
      } catch (error) {
        console.error("Error updating last login:", error);
      }
      
      return userCredential;
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }

  function logout() {
    setIsAuthenticating(true);
    return signOut(auth).finally(() => setIsAuthenticating(false));
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // If a user is logged in, ensure they have a Firestore document
      if (currentUser) {
        try {
          // Create a reference to check if the user document exists
          const userDocRef = doc(db, "users", currentUser.uid);
          
          // We don't need to check if the document exists here,
          // as we're using merge: true to safely upsert the document
          await setDoc(userDocRef, { 
            last_login: new Date(),
            // Include these fields only if it's a new document
            ...(!userDocRef && {
              display_name: currentUser.displayName || currentUser.email?.split('@')[0] || "User",
              email: currentUser.email,
              created_at: new Date()
            })
          }, { merge: true });
        } catch (error) {
          console.error("Error ensuring user document exists:", error);
        }
      }
      
      setIsAuthReady(true); // This should be set to true when auth state is determined
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    signUp,
    login,
    logout,
    isAuthenticating,
  };

  return (
    <AuthContext.Provider value={value}>
      {isAuthReady ? children : <div>Loading authentication...</div>}
    </AuthContext.Provider>
  );
}
