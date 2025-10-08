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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator 
} from './ui/dropdown-menu';

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
    <nav className="flex justify-between items-center relative z-50">
      <Link href={"/"} className="flex items-center gap-2">
        <Image src={"/logo.svg"} alt="Logo" width={38} height={32} />
        <h2 className="text-primary-100"> HireReady AI </h2>
      </Link>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="flex items-center gap-2 bg-dark-100 px-2 py-2 rounded-md hover:bg-gray-800 transition">
            <User className="size-4" />
            {user?.name || 'User'}
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          sideOffset={8}
          className="w-56 z-[60]"
        >
          <DropdownMenuItem 
            onClick={handleLogout}
            className="cursor-pointer flex items-center gap-2 text-red-500 hover:bg-red-400 hover:text-red-500"
          >
            <LogOut className="size-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default Navbar;