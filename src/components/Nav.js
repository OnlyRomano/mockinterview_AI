"use client";

import { getCurrentUser, signOut } from '@/lib/actions/auth.actions';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);
  
  const confirmLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
    router.push('/sign-in');
  };
  
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  return (
    <nav className="flex justify-between items-center relative z-50 py-2">
      <Link href={"/"} className="flex items-center gap-2 no-underline hover:no-underline">
        <h2 className="text-foreground">HireReady AI</h2>
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl text-foreground shadow-[var(--shadow-sm)]">
          <User className="size-4" />
          <span>hello, {user?.name || 'User'}</span>
        </div>
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-2 bg-destructive px-3 py-2 rounded-xl hover:bg-destructive/90 transition text-white shadow-[var(--shadow-sm)]"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>

      {showLogoutModal && (
        <>
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[99]"></div>
          <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="bg-card border border-border rounded-2xl p-6 w-96 shadow-[var(--shadow-lg)]">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-muted-foreground mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground transition shadow-[var(--shadow-sm)]"
              >
                No, Stay Logged In
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-white transition shadow-[var(--shadow-sm)]"
              >
                Yes, Logout
              </button>
            </div>
          </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;