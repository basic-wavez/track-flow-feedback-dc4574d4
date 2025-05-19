
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

const AuthPage = () => {
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the return URL from location state
  const from = location.state?.from?.pathname || "/";
  
  useEffect(() => {
    console.log("AuthPage - Auth state:", { 
      isAuthenticated: !!user,
      redirectTo: from
    });
    
    // Redirect if already logged in
    if (user) {
      console.log("AuthPage - User is logged in, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === "signup") {
        await signUp(email, password, username);
      } else {
        await signIn(email, password);
      }
      // Note: We don't need to manually navigate here as the useEffect will handle it
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // No need to set loading state as we're redirecting to Google
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b border-wip-gray/30">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold gradient-text">
            Demo Manager
          </h1>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto bg-wip-gray/5 p-8 rounded-xl border border-wip-gray/30">
          <h2 className="text-center gradient-text text-2xl font-bold mb-8">
            {tab === "login" ? "Welcome Back" : "Join Demo Manager"}
          </h2>
          
          <Tabs defaultValue="login" value={tab} onValueChange={(val) => setTab(val as "login" | "signup")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full gradient-bg hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-wip-dark px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleSignIn}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M21.64 12.32c0-.78-.07-1.53-.2-2.25H12v4.25h5.42c-.23 1.17-.93 2.17-1.97 2.85v2.37h3.18c1.86-1.7 2.94-4.2 2.94-7.22z" fill="#4285F4"/>
                    <path d="M12 22c2.66 0 4.9-.87 6.54-2.35l-3.19-2.47c-.88.59-2.01.94-3.35.94-2.57 0-4.75-1.74-5.52-4.07H3.27v2.55C4.91 19.53 8.22 22 12 22z" fill="#34A853"/>
                    <path d="M6.48 14.08c-.2-.58-.31-1.21-.31-1.85s.11-1.27.31-1.85V7.83H3.27C2.48 9.1 2 10.5 2 12c0 1.5.48 2.9 1.27 4.17l3.21-2.09z" fill="#FBBC05"/>
                    <path d="M12 5.98c1.45 0 2.75.5 3.77 1.48l2.83-2.83C16.9 3.06 14.66 2 12 2 8.22 2 4.91 4.47 3.27 8.17l3.21 2.09c.77-2.33 2.95-4.07 5.52-4.07z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full gradient-bg hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-wip-dark px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleSignIn}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M21.64 12.32c0-.78-.07-1.53-.2-2.25H12v4.25h5.42c-.23 1.17-.93 2.17-1.97 2.85v2.37h3.18c1.86-1.7 2.94-4.2 2.94-7.22z" fill="#4285F4"/>
                    <path d="M12 22c2.66 0 4.9-.87 6.54-2.35l-3.19-2.47c-.88.59-2.01.94-3.35.94-2.57 0-4.75-1.74-5.52-4.07H3.27v2.55C4.91 19.53 8.22 22 12 22z" fill="#34A853"/>
                    <path d="M6.48 14.08c-.2-.58-.31-1.21-.31-1.85s.11-1.27.31-1.85V7.83H3.27C2.48 9.1 2 10.5 2 12c0 1.5.48 2.9 1.27 4.17l3.21-2.09z" fill="#FBBC05"/>
                    <path d="M12 5.98c1.45 0 2.75.5 3.77 1.48l2.83-2.83C16.9 3.06 14.66 2 12 2 8.22 2 4.91 4.47 3.27 8.17l3.21 2.09c.77-2.33 2.95-4.07 5.52-4.07z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
