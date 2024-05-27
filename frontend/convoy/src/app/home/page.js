'use client';

import React, { useEffect, useState } from 'react';
import { UserContext } from '@/service/userService';
import base_url from '@/service/api';


export default function Home() {
    const userData = React.useContext(UserContext);
    const [jobs, setJobs] = useState([]);
    const [jobsProcessing, setJobsProcessing] = useState(0);
    const [datasetsCount, setDatasetsCount] = useState(0);
    const [visualizationsCount, setVisualizationsCount] = useState(0);

    useEffect(() => {
        fetchDatasetsCount();
        fetchJobInfo();
    }, [userData]);
    const headers = { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + userData.token
    };
    const fetchJobInfo = async () => {
        if(userData.token){
            try {
                const response = await fetch(base_url + 'job', {
                    headers: headers
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log(data.jobs);
                    setJobs(data.jobs);
                    setJobsProcessing(data.jobs.filter(job => job.status == "PENDING").length);
                } else {
                    console.error('Failed to fetch processing jobs');
                }
            } catch (error) {
                console.error('Error fetching processing jobs:', error);
            }
        }
    };

    const fetchVisualizationCount = async () => {
        if(userData.token){
            setVisualizationsCount(0); //not sure how to implement yet
        }
    }

    const fetchDatasetsCount = async () => {
        if(userData.token){
            try {
                const response = await fetch(base_url + 'dataset', {
                    headers: headers,
                });
                if (response.ok) {
                    const data = await response.json();
                    setDatasetsCount(data.datasets.length);
                } else {
                    console.error('Failed to fetch datasets count');
                }
            } catch (error) {
                console.error('Error fetching datasets count:', error);
            }
        }
    };

    return (
        <div className='h-full'>
            {Object.keys(userData).length === 0 ? 
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

            :
            <section className="bg-gray-50 dark:bg-gray-900 h-full">
                <h2 className="mb-8 text-4xl font-bold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Welcome <span className="text-blue-600 dark:text-blue-500">{userData.fullName}</span>!</h2>
                <div className="flex flex-wrap">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-blue-600 border-2 w-36 h-36 mr-16 mb-8 flex flex-col justify-center items-center">
                        <div className="text-4xl font-bold text-blue-500">{jobsProcessing}</div>
                        <div className="text-sm font-bold text-blue-500">Jobs Processing</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-blue-600 border-2 w-36 h-36 mr-16 mb-8 flex flex-col justify-center items-center">
                        <div className="text-4xl font-bold text-blue-500">{datasetsCount}</div>
                        <div className="text-sm font-bold text-blue-500">Datasets</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-blue-600 border-2 w-36 h-36 mr-16 mb-8 flex flex-col justify-center items-center">
                        <div className="text-4xl font-bold text-blue-500">{visualizationsCount}</div>
                        <div className="text-sm font-bold text-blue-500">Visualizations</div>
                    </div>
                </div>
                <div className="max-w-3xl">
                    <table className="overflow-hidden divide-y divide-gray-200 border border-2 border-blue-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th colSpan="3" className="px-6 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider border border-blue-600">Recent Jobs</th>
                            </tr>
                            <tr>
                                <th className="px-16 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border border-blue-600">Started By</th>
                                <th className="px-16 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border border-blue-600">Start Time</th>
                                <th className="px-16 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border border-blue-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                            {jobs.slice(0, 5).map(job => (
                                <tr key={job.id}>
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap border border-blue-600">{job.user}</td>
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap border border-blue-600">{job.start_time}</td>
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap border border-blue-600">{job.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>


            }
        </div>
        
      
    );
  }