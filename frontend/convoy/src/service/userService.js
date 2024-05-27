'use client';

import React, { createContext, useState, useEffect } from "react";
import { useRouter } from 'next/navigation';


const UserContext = createContext(undefined);


function UserProvider({ children }) {
    const [ userData, setUserData ] = useState({});
    const router = useRouter();
    
    useEffect (() => {
        const storedUserData = window.sessionStorage.getItem('userData');
            if (storedUserData) {
                setUserData(JSON.parse(storedUserData));
                console.log(userData);
            }
            else {
                router.push('/');
            }
    }, []);

  return (
    <UserContext.Provider value={userData}>
        {children}
    </UserContext.Provider>
  );
}

export { UserProvider, UserContext };