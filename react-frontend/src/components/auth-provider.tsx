import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/config/firebase";

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
  signUp: async () => new Promise(() => { }), // Promise that never resolves
  login: async () => new Promise(() => { }), // Promise that never resolves
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

  console.log("auth provider loading")

  function signUp(email: string, password: string) {
    console.log("test");
    setIsAuthenticating(true);
    return createUserWithEmailAndPassword(auth, email, password).finally(() =>
      setIsAuthenticating(false),
    );
  }

  function login(email: string, password: string) {
    setIsAuthenticating(true);
    return signInWithEmailAndPassword(auth, email, password).finally(() =>
      setIsAuthenticating(false),
    );
  }

  function logout() {
    setIsAuthenticating(true);
    return signOut(auth).finally(() => setIsAuthenticating(false));
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
