import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "./components/contexts/auth-provider";
import { LoginForm } from "./components/login-form";
import NavBar from "@/components/navbar";
import Footer from "@/components/footer";
import ProtectedRoute from "./components/protected-route";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";

const Dashboard = lazy(() => import("@/components/dashboard"));
function App() {
  console.log("App");
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <Toaster richColors position="top-right" />
          <NavBar />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginForm isSignup={false} />} />
            <Route path="/signup" element={<LoginForm isSignup={true} />} />
            <Route path="/dashboard" element={<ProtectedRoute />}>
              <Route
                index
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <Dashboard />
                  </Suspense>
                }
              />
              <Route
                path=":deviceId"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <Dashboard />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
