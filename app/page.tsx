import React from 'react'
import Signin from "@/app/components/Signin"

const page = () => {
  return (
    <div>
      <Signin />
      <div className="text-center text-gray-500 mt-4">
        <p>Welcome to the Sign In page. Please enter your credentials to continue.</p>
      </div>
      <div className="text-center text-gray-500 mt-2">
        <p>If you don&apos;t have an account, please contact your administrator.</p>
      </div>
    </div>
  )
}

export default page
