'use client';

import React,{useState, useEffect} from 'react';
import { UserContext } from '@/service/userService';
import {useRouter} from 'next/navigation';
import base_url from '@/service/api';

export default function Visualizations() {
    
    const userData = React.useContext(UserContext);
    const[displayedJob, setDisplayedJob]  = useState("");
    const[error,setError] = useState('');
    //const[jobs, setJobs] = useState([]);
    const[completedJobs, setCompletedJobs] = useState([]);
    const router = useRouter();

    useEffect(()=>{
        const getJobs = async (token) => {
            const headers = {'Authorization': 'Bearer ' + userData.token};
            fetch(base_url + 'job', {headers}).then(async response => {
                if(response.ok){
                    const data = await response.json();

                    if(data.jobs.length == 0){
                        setError("No jobs are available for this company.");
                        console.error(error);
                    }

                    const filteredJobs = data.jobs.filter((job) => job.status === "SUCCESS")
                    console.log(filteredJobs)

                    setCompletedJobs(filteredJobs)
                }
                else{
                    console.log("there was an error");
                    setError("There was an error retriving the jobs for this company.");
                    console.error(error);
                }
            })
        }
        if(userData && userData.token){
            getJobs(userData.token);
        }
    },[userData]);

    if(completedJobs.length == 0){
        return(
            <>
                <h2 className="text-gray-900 text-4xl font-extrabold dark:text-white">Visualizations</h2>
                <h3>Currently no jobs are completed</h3>
            </>
        )
    }
    if(completedJobs.length > 0 || displayedJob == ""){
        return(
            <>
                <h2 className="text-gray-900 text-4xl font-extrabold dark:text-white">Visualizations</h2>
                <table>
                    <thead>
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            Completed Jobs
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                        {completedJobs.map(job =>
                            <tr key = {job.job_id}>
                                <button onClick ={() => router.push("/home/visualization/" + job.job_id)} className= "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-3">{job.job_id}</button>
                            </tr>
                        )}
                    </tbody>
                </table>
                
            </>
        )
    }
}