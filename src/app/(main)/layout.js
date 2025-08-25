import { signOut } from '@/lib/actions/auth.actions'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const MainLayout = ({children}) => {
  return (
    <div className='root-layout'>
      <nav>
        <Link href={"/"} className='flex items-center gap-2'>
          <Image src={"/logo.svg"} alt='Logo' width={38} height={32}/>
          <h2 className='text-primary-100'> HireReady AI </h2>
        </Link>
        {/* <Link href={"/sign-in"}>
        <button
          className="ml-4 px-4 py-2 bg-red-600 text-white rounded"
          onClick={signOut}
        >
          Logout
        </button>
        </Link> */}
        {children}
      </nav>

    </div>
  )
}
export default MainLayout
