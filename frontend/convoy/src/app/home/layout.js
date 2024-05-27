import LeftNav from "@/components/login/leftNav";
import { UserProvider } from "@/service/userService";
import React from "react";

export default function Layout({ children }) {
    
    return (
      <>
        <UserProvider>
        <LeftNav/>
        <div className="p-4 sm:ml-64">
            {children}
        </div>
        </UserProvider>
      </>
    )
  }