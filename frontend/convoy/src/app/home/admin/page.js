'use client';

import React, { useState, useEffect } from "react";
import { UserContext } from "@/service/userService";
import base_url from "@/service/api";
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const userData = React.useContext(UserContext);
  const [userRole, setUserRole] = useState("");
  const [error, setError] = useState({});
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newOwnerUsername, setNewOwnerUsername] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyDesc, setNewCompanyDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (userData.token) {
      fetchUserRole();
    }
  }, [userData]);

  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + userData.token,
  };

  const fetchUserRole = () => {
    if (userData.token) {
      fetch(base_url + "users/" + userData.username, { headers })
        .then(async response => {
          if (response.ok) {
            const data = await response.json();
            setUserRole(data.role_id);
          } else {
            setError({ message: "Failed to fetch role" });
          }
          setLoading(false);
        })
    }
  };

  const handleRoleChange = (username, roleId) => {
    if (userData.token) {
      fetch(base_url + "update_role/" + username, {
        method: "PUT",
        headers,
        body: JSON.stringify({ role_id: roleId }),
      })
        .then(response => {
          if (!response.ok) {
            setError({message: "Failed to change role"});
          } else {
            setNewAdminUsername("");
            setError({});
          }
        })
    }
  };

  const handleCreateCompany = () => {
    if (userData.token) {
      fetch(base_url + "companies/add", {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          company_name: newCompanyName,
          company_desc: newCompanyDesc,
        }),
      })
        .then(response => {
          if (!response.ok) {
            setError({message: "Failed to create company"});
          } else {
            setNewCompanyName("");
            setNewCompanyDesc("");
            setError({});
          }
        })
    }
  };

  if (userRole !== 1) {
    return (
      <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
        <span className="font-medium">{"Insufficient Privileges"}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 h-full">
        <div role="status" className='h-full flex justify-center content-center'>
          <div className="flex items-center content-center">
            <svg aria-hidden="true" className="content-center w-20 h-20 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
          </div>
          <span className="sr-only">Loading...</span>
        </div>
      </section>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-gray-900 text-4xl font-extrabold dark:text-white pb-8">Admin Page</h2>
      {error && error.message && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
          <span className="font-medium">{error.message}</span>
        </div>
      )}
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-4">
          <h3 className="text-gray-900 text-xl font-semibold dark:text-white">Add System Admin:</h3>
          <input
            type="text"
            value={newAdminUsername}
            onChange={(e) => setNewAdminUsername(e.target.value)}
            placeholder="Enter username"
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
          />
          <button onClick={() => handleRoleChange(newAdminUsername, 1)} className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
            Make Admin
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <h3 className="text-gray-900 text-xl font-semibold dark:text-white">Add Company Owner:</h3>
          <input
            type="text"
            value={newOwnerUsername}
            onChange={(e) => setNewOwnerUsername(e.target.value)}
            placeholder="Enter username"
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
          />
          <button onClick={() => handleRoleChange(newOwnerUsername, 2)} className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
            Make Company Owner
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <h3 className="text-gray-900 text-xl font-semibold dark:text-white">Create New Company:</h3>
          <input
            type="text"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder="Enter company name"
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={newCompanyDesc}
            onChange={(e) => setNewCompanyDesc(e.target.value)}
            placeholder="Enter description"
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleCreateCompany} className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
            Create Company
          </button>
        </div>
      </div>
    </div>
  );
}
