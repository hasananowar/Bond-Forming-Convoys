'use client';

import React, { useState, useEffect } from "react";
import { UserContext } from '@/service/userService';
import base_url from "@/service/api";
import { useRouter } from 'next/navigation';

export default function Page({ params }) {
    
    const [job, setJob] = useState([]);
    const [error, setError] = useState({});
    const userData = React.useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    

    useEffect(() => {
        const getJobs = async (token) => {
            const headers = { 'Authorization': 'Bearer ' + userData.token };
            fetch(base_url + 'job/' + params.id, { headers })
            .then(async response => {
                if(response.ok){
                    const data = await response.json();
                    setJob(data);
                    console.log(data);
                }
                else{
                    setError({message: "There was an error retrieving the requested job."});
                }
                setLoading(false);
            });       
        }
        
        if(userData && userData.token){
            getJobs(userData.token);
        }
    }, [userData]);

    if(loading){
        return(
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
        </section>)
    }
    
    return (
        <div className="p-6">
            <h2 className="text-gray-900 text-4xl font-extrabold dark:text-white pb-8">Job {params.id}</h2>
            <h4 className="text-gray-700 text-lg font-semibold dark:text-white pb-2" >Status: {job.status}</h4>
            <h4 className="text-gray-700 text-lg font-semibold dark:text-white pb-2" >Job Type: {job.job_name === "server.routes.jobs.convoy_job" ? "Basic Convoy" : "HB"}</h4>
            <h4 className="text-gray-700 text-lg font-semibold dark:text-white pb-8" >Start Date: {new Date(job.date_done).toLocaleString()}</h4>
            {(job.result && job.result.length && job.result[0] !== null) && 
            <div>
            <div className="flex flex-row">
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg basis-3/4">
                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" class="px-6 py-3">
                                Convoy Number
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Number of Indices
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Start Time
                            </th>
                            <th scope="col" class="px-6 py-3">
                                End Time
                            </th>
                            <th scope="col" class="px-6 py-3">
                                Visualize Convoy
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {job.result.map((convoy, index) => 
                        <tr key={index} class="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                            <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                Convoy {index + 1}
                            </th>
                            <td class="px-6 py-4">
                                {convoy.num_of_indices}
                            </td>
                            <td class="px-6 py-4">
                                {convoy.start_time}
                            </td>
                            <td class="px-6 py-4">
                                {convoy.end_time}
                            </td>
                            <td class="px-6 py-4">
                                <a className="hover:underline" onClick={() => router.push("/home/visualization/" + params.id + "/" + index)}>Visualize</a>
                            </td>
                        </tr>
                        )}
                    </tbody>
                </table>
            </div>
            </div>
            <button onClick ={() => router.push("/home/visualization/" + params.id)} className= "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded my-4 mx-0">Visualize Convoy Context</button>
            </div>
            }
            {job.job_name === "server.routes.jobs.hb_detection" &&
            <button onClick ={() => router.push("/home/visualization/" + params.id + "/hb")} className= "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded my-4 mx-0">Visualize HB</button>
            }            
        </div>
    )

}