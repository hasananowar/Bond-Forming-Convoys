'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import base_url from '@/service/api';


const SignUpForm = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [roleId, setRoleId] = useState('3');
    const [error, setError] = useState('');
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
      fetchCompanies();
    }, []);

  const fetchCompanies = async () => {
      try {
          const response = await fetch(base_url + 'companies');
          if (response.ok) {
              const data = await response.json();
              setCompanies(data.companies);
              console.log(data.companies);
          } else {
              setError('Failed to fetch companies');
          }
      } catch (error) {
          console.error('Error fetching companies:', error);
          setError('Unexpected error.');
      }
  };

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };
  
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleFullNameChange = (e) => {
        setFullName(e.target.value);
    };

    const handleRoleIdChange = (e) => {
      setRoleId(e.target.value);
    };

    const handleCompanyIdChange = (e) => {
      setCompanyId(e.target.value);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');

      try {
        const response = await fetch(base_url + 'register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 'username': username, 'password': password, 'full_name': fullName, 'company_id': companyId, 'role_id': roleId, 'email': email }),
        });
    
        if (response.ok) {
          // Successful sign up, handle the response accordingly
          const data = await response.json();
          console.log('Sign up successful:', data);
          const newUserData = {
            isAuth: true,
            token: data.access_token,
            fullName: data.full_name,
            username: data.username
          };
          window.sessionStorage.setItem('userData', JSON.stringify(newUserData));
          router.push('/signup');
        } else {
          // Handle unsuccessful sign up
          const errorData = await response.json();
          setError(errorData.message);
        }
      } catch (error) {
        // Handle network errors or other exceptions
        console.error('Error during sign up:', error);
        setError('Unexpected error.');
      }
    };
  
    return (
        <section className="bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
            <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
                Convoy Detect    
            </a>
            {error && 
            <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                <span className="font-medium">Sign up failed:</span> {error}
            </div>
            }
            <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
                <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                    
                    <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                        Create New User
                    </h1>
                    <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
                            <input value={username} onChange={handleUsernameChange} type="username" name="username" id="username" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Username"/>
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                            <input value={password} onChange={handlePasswordChange} type="password" name="password" id="password" placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required=""/>
                        </div>
                        <div>
                            <label htmlFor="fullName" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Full Name</label>
                            <input value={fullName} onChange={handleFullNameChange} type="fullName" name="fullName" id="fullName" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="John Doe"/>
                        </div>
                        <div>
                            <label htmlFor="companyId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Company</label>
                            <select value={companyId} onChange={handleCompanyIdChange} id="companyId" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required="">
                                <option value="">Select Company</option>
                                {companies.map(company => (
                                    <option key={company.company_id} value={company.company_id}>{company.company_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="roleId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Role Id</label>
                            <select value={roleId} onChange={handleRoleIdChange} id="roleId" type="roleId" name="roleId" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                <option value="3">User</option>
                                <option value="2">Company Owner</option>
                                <option value="1">System Admin</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
                            <input value={email} onChange={handleEmailChange} type="email" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="user@example.com"/>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                </div>
                                <div className="ml-3 text-sm">
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Register</button>
                    </form>
                </div>
            </div>
        </div>
      </section>
    );
  };
  
  export default SignUpForm;