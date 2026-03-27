"use client";

import { getCurrentUser, signOut } from '@/lib/actions/auth.actions';
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
    <nav className="relative z-50 flex items-center justify-between py-3">
      <Link
        href={"/"}
        className="flex items-center gap-3 no-underline hover:no-underline"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-xs font-semibold text-primary border border-border shadow-[var(--shadow-sm)]">
          HR
        </div>
        <div className="leading-tight">
          <p className="text-lg font-semibold text-foreground">HireReady AI</p>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-full text-foreground shadow-[var(--shadow-sm)]">
          <User className="size-4" />
          <span className="text-sm">
            <span className="text-muted-foreground">hello,</span>{" "}
            <span className="font-semibold">{user?.name || "User"}</span>
          </span>
        </div>
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-2 bg-destructive px-4 py-2 rounded-full hover:bg-destructive/90 transition text-white text-sm font-semibold shadow-[var(--shadow-sm)]"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>

      {showLogoutModal && (
        <>
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[99]"></div>
          <div className="fixed inset-0 flex items-center justify-center z-[100]">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-[0_22px_60px_rgba(15,23,42,0.25)]">
              <h3 className="text-lg font-semibold text-foreground mb-2">Confirm logout</h3>
              <p className="text-sm text-muted-foreground mb-6">Are you sure you want to log out?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground transition shadow-[var(--shadow-sm)] text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 rounded-full bg-destructive hover:bg-destructive/90 text-white transition shadow-[var(--shadow-sm)] text-sm font-semibold"
                >
                  Logout
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