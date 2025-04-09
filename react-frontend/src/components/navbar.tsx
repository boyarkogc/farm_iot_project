import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { Link } from "react-router-dom";

export default function NavBar() {
  const { user, logout } = useAuth();
  //const location = useLocation();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
    } catch (err) {
      console.error("Failed to log out. Error: ", err);
    }
  };

  return (
    <nav className="flex justify-between">
      <ModeToggle />
      <ul className="flex items-center gap-2">
        {<li>{user && `Logout link goes here...`}</li>}
        <li>Nav link 1 goes here</li>
        <li>
          <Link to="/">Home</Link>
        </li>
        {user && (
          <li>
            <Button onClick={handleLogout}>Log out</Button>
          </li>
        )}
      </ul>
    </nav>
  );
}
