// src/components/Navbar.js
"use client";

import { getCurrentUser, signOut } from '@/lib/actions/auth.actions';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { LogOut, User, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getLoggedInUser } from '@/lib/actions/auth.actions';

const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
  
  const handleLogout = async () => {
    await signOut();
    router.push('/sign-in');
  };

  return (
    <nav className="flex justify-between items-center">
      <Link href={"/"} className="flex items-center gap-2">
        <Image src={"/logo.svg"} alt="Logo" width={38} height={32} />
        <h2 className="text-primary-100"> HireReady AI </h2>
      </Link>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-white">
              <User className="w-4 h-4 mr-2" />
              {user?.name}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-48 p-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  );
};

export default Navbar;