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
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
  
  const confirmLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
    router.push('/sign-in');
  };
  
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  return (
    <nav className="flex justify-between items-center relative z-50">
      <Link href={"/"} className="flex items-center gap-2">
        <Image src={"/logo.svg"} alt="Logo" width={38} height={32} />
        <h2 className="text-primary-100"> HireReady AI </h2>
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-dark-100 px-2 py-2 rounded-md">
          <User className="size-4" />
          <span>hello, {user?.name || 'User'}</span>
        </div>
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-2 bg-red-700 px-2 py-2 rounded-md hover:bg-red-500 transition text-red-200 hover:text-white"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>

      {showLogoutModal && (
        <>
          <div className="fixed inset-0 backdrop-blur-md z-[99]"></div>
          <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="bg-dark-200 rounded-lg p-6 w-96 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Confirm Logout</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white transition"
              >
                No, Stay Logged In
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-md bg-red-700 hover:bg-red-500 text-red-200 transition"
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