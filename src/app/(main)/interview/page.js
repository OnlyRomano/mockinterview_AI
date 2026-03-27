import Agent from '@/components/Agent'
import { getCurrentUser } from '@/lib/actions/auth.actions'
import React from 'react'

const page = async () => {

  const user = await getCurrentUser()
  
  return (
    <>
        <div className="bg-card border border-border shadow-[var(--shadow-sm)] rounded-3xl p-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-foreground">Create an interview</h3>
            <p className="text-sm text-muted-foreground">
              Generate a new interview, then start the call when you’re ready.
            </p>
          </div>
        </div>

        <Agent userName={user?.name} userId={user?.id} type="generate"/>
    </>
  )
}

export default page