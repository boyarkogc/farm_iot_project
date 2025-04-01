import { Button } from "@/components/ui/button"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "./components/mode-toggle"
import React, { useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { auth } from './config/firebase'; // Import the configured auth instance

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null); // To store the logged-in user object
  const [loading, setLoading] = useState(true); // Track initial auth state loading
  const [error, setError] = useState('');

  // Listener for authentication state changes
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
          console.log('Auth State Changed:', currentUser);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleSignUp = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setError('');
      try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          console.log('Signed Up:', userCredential.user);
          // User state will be updated by onAuthStateChanged
      } catch (err) {
        console.error("Sign Up Error:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
            setError("An unknown sign-up error occurred.");
        }
      }
  };

  const handleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setError('');
      try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          console.log('Signed In:', userCredential.user);
          // User state will be updated by onAuthStateChanged
      } catch (err) {
          console.error("Sign In Error:", err);
          if (err instanceof Error) {
            setError(err.message);
          } else {
              setError("An unknown sign-in error occurred.");
          }
      }
  };

  const handleSignOut = async () => {
      setError('');
      try {
          await signOut(auth);
          console.log('Signed Out');
          // User state will be updated by onAuthStateChanged
      } catch (err) {
          console.error("Sign Out Error:", err);
          if (err instanceof Error) {
            setError(err.message);
          } else {
              setError("An unknown sign out error occurred.");
          }
      }
  };

  if (loading) {
      return <div>Loading user state...</div>;
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ModeToggle />
      <div>
        <h1>Firebase Auth with Emulators</h1>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {user ? (
            <div>
                <p>Welcome, {user.email}!</p>
                <p>User ID: {user.uid}</p>
                <button onClick={handleSignOut}>Sign Out</button>
            </div>
        ) : (
            <form>
                <h2>Sign In / Sign Up</h2>
                <div>
                    <label>Email: </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password: </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" onClick={handleSignIn} style={{ marginRight: '10px' }}>Sign In</button>
                <button type="submit" onClick={handleSignUp}>Sign Up</button>
            </form>
        )}
          <p>Using Emulators: {import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' ? 'Yes' : 'No'}</p>
        </div>
      {/*shadcn button*/}
      <div className="flex flex-col items-center justify-center min-h-svh">
        <Button>Click me</Button>
      </div>
    </ThemeProvider>
  )
}

export default App
