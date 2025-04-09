import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "./components/auth-provider";
import { LoginForm } from "./components/login-form";
import NavBar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import Dashboard from "@/components/dashboard";
import ProtectedRoute from "./components/protected-route";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/login" element={<LoginForm isSignup={false} />} />
            <Route path="/signup" element={<LoginForm isSignup={true} />} />
            <Route path="/dashboard" element={<ProtectedRoute />}>
              <Route index element={<Dashboard />} />
            </Route>
          </Routes>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
