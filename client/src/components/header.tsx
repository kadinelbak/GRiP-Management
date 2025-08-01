import { Menu, Newspaper, Home as HomeIcon, Users, Wrench, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/use-auth";
import { Link, useLocation } from "wouter";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const [location] = useLocation();

  // Base navigation items available to all users
  const baseNavigationItems = [
    { path: "/", label: "Home", icon: HomeIcon },
    { path: "/news", label: "News", icon: Newspaper },
  ];

  // Additional items for authenticated users
  const memberNavigationItems = [
    { path: "/member-services", label: "Member Services", icon: Users },
  ];

  // Items for users with special roles (non-members)
  const specialRoleNavigationItems = [
    { path: "/tools", label: "Tools", icon: Wrench },
  ];

  // Admin-only items
  const adminNavigationItems = [
    { path: "/admin", label: "Admin Dashboard", icon: Settings },
  ];

  // Determine which navigation items to show based on user role
  const getNavigationItems = () => {
    let items = [...baseNavigationItems];
    
    if (isAuthenticated) {
      items = [...items, ...memberNavigationItems];
      
      // Add special role items for coordinators, managers, president, admin
      if (user?.role && user.role !== 'member') {
        items = [...items, ...specialRoleNavigationItems, ...adminNavigationItems];
      }
    }
    
    return items;
  };

  const navigationItems = getNavigationItems();

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="flex-shrink-0">
                  <img 
                    src="/attached_assets/LogoEmblem_1753688453831.png" 
                    alt="GRiP Logo" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-blue-600">GRiP</h1>
                  <p className="text-xs text-slate-600">Generational Relief in Prosthetics</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {user?.firstName} {user?.lastName}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Menu className="text-lg" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}