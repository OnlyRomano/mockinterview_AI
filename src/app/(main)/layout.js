import Navbar from '@/components/Nav';
import React from 'react';

const MainLayout = ({ children }) => {
  return (
    <div className='root-layout'>
      <Navbar/>
      {children}
    </div>
  );
};

export default MainLayout;
