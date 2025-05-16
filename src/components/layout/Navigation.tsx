
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="border-b border-wip-gray/30 bg-wip-darker">
      <div className="max-w-7xl mx-auto px-4">
        <NavigationMenu className="py-2">
          <NavigationMenuList>
            <NavigationMenuItem>
              <Button 
                className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-wip-gray/10 text-wip-pink")} 
                variant="ghost"
                onClick={() => navigate("/")}
              >
                Home
              </Button>
            </NavigationMenuItem>
            
            {user && (
              <NavigationMenuItem>
                <Button 
                  className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-wip-gray/10 text-wip-pink")} 
                  variant="ghost"
                  onClick={() => navigate("/profile")}
                >
                  My Profile
                </Button>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
};

export default Navigation;
