'use client';

import React, { useState, useEffect } from "react";
import { UserContext } from '@/service/userService';
import base_url from "@/service/api";

export default function NewJob() {

    const [params, setParams] = useState({
        algorithm: "",
        dataset: "",
        minElements: "",
        minTimestamps: "",
        tEpsilon: "",
        name: "",
        convoy_id: "",
        index: ""
    });
    const [success, setSuccess] = useState(false);
    const userData = React.useContext(UserContext);
    const [datasets, setDatasets] = useState([]);
    const [error, setError] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [job, setJob] = useState({});

    const handleChange = (e) => {
        setParams({
            ...params,
            [e.target.name]: e.target.value
        })
        if(e.target.name === "dataset" && datasets !== undefined){
            const d_name = (datasets.find(dataset => dataset.dataset_id == e.target.value).dataset_name)
            getJobs(d_name);
        }
        if(e.target.name === "convoy_id"){
            getJob(e.target.value)
        }
    }

    const validateNumeric = (e) => {
        e.target.value = e.target.value.replace(/\D/g,'');
        handleChange(e);
    }

    const isValid = () => {
        return params.algorithm && params.dataset
        && params.minElements && params.minTimestamps
        && params.name && params.tEpsilon;
    }

    const onStartJob = async () => {
        console.log(params);
        const body = {
            k: Number(params.minElements),
            m: Number(params.minTimestamps),
            dataset_id: Number(params.dataset),
            eps: Number(params.tEpsilon),
            end: 500
        };
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + userData.token 
        };
        const response = await fetch(base_url + 'job/convoy',{ 
        method: 'POST', headers: headers,
        body: JSON.stringify(body)
        });
        if(response.ok){
            setSuccess(true);
        }

    }

    const onStartHbJob = async () => {
        const conStart = job.result[Number(params.index)].start_time
        const conEnd = job.result[Number(params.index)].end_time
        
        console.log(params);
        const body = {
            convoy_id: params.convoy_id,
            start: conStart,
            end: conEnd,
            index: Number(params.index)
        };
        const headers = { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + userData.token 
        };
        const response = await fetch(base_url + 'job/hbd',{ 
        method: 'POST', headers: headers,
        body: JSON.stringify(body)
        });
        if(response.ok){
            setSuccess(true);
        }

    }

    const isHbValid = () => {
        return params.algorithm && params.dataset,
        params.convoy_id, params.index
    }

    const getJobs = async (dataset) => {
        const headers = { 'Authorization': 'Bearer ' + userData.token };
        fetch(base_url + 'job', { headers })
        .then(async response => {
            if(response.ok){
                const data = await response.json();
                const filteredJobs = data.jobs.filter((job) => job.status === "SUCCESS" && job.dataset == dataset && job.job_name == "server.routes.jobs.convoy_job")
                console.log(filteredJobs);
                setJobs(filteredJobs.sort((a, b) => new Date(a.start_time) > new Date(b.start_time) ? -1 : 1));
                if(data.jobs.length == 0){
                    setError({message: "No jobs are available for this company."})
                }
            }
            else{
                setError({message: "There was an error retrieving the jobs for this company."});
            }
        });       
    }

    const getJob = async (convoy_id) => {
        const headers = { 'Authorization': 'Bearer ' + userData.token };
        fetch(base_url + 'job/' + convoy_id, { headers })
        .then(async response => {
            if(response.ok){
                const data = await response.json();
                setJob(data);
                console.log(data);
            }
            else{
                setError({message: "There was an error retrieving the requested job."});
            }
        });       
    }

    useEffect(() => {
        const getDatasets = async (token) => {
            const headers = { 'Authorization': 'Bearer ' + userData.token };
            fetch(base_url + 'dataset', { headers })
            .then(async response => {
                if(response.ok){
                    const data = await response.json();
                    setDatasets(data.datasets);
                }
                else{
                    setError(true);
                }
            });       
        }
        
        if(userData && userData.token){
            getDatasets(userData.token);
        }
    }, [userData]);

    if(!datasets || datasets.length == 0){
        return (
            <div>
            {error ?
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                    <span className="font-medium">There was an error loading new job information</span> {}
                </div>
            :
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
            }
            </div>
        );
    }

    return(
    <div className="p-6">
        <h2 className="text-gray-900 text-4xl font-extrabold dark:text-white pb-8">New Job</h2>
        {success && <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-100 dark:bg-gray-800 dark:text-green-400 max-w-xs" role="alert">
            <span className="font-medium">Success!</span> Job was successfully submitted.
        </div> }
        <div className="flex flex-row">
            <div className="basis-1/2 max-w-xs">
                <label htmlFor="algorithm" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Algorithm<span className="text-red-700">*</span></label>
                <select value={params.algorithm} onChange={handleChange} id="algorithm" type="algorithm" name="algorithm" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                    <option value="" disabled hidden>Choose here</option>
                    <option value="2">Basic Convoy Detection</option>
                    <option value="1">Convoy Detection with HB</option>
                </select>
            </div>
            <div className="basis-1/6 max-w-xs"/>
            <div className="basis-1/2 max-w-xs">
                <label htmlFor="dataset" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Dataset<span className="text-red-700">*</span></label>
                <select value={params.dataset} onChange={handleChange} id="dataset" type="dataset" name="dataset" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                    <option value="" disabled hidden>Choose here</option>
                    {datasets.map(dataset => <option key={dataset.dataset_id} value={dataset.dataset_id}>{dataset.dataset_name}</option>)}
                </select>
            </div>
        </div>
        <div>
            {(!params.algorithm || !params.dataset) ?
            <div className="flex content-center justify-center py-9">
                <p className="mb-3 text-gray-500 dark:text-gray-400">*Parameter forms will appear once algorithm and dataset is selected*</p>
            </div>
            :
            params.algorithm === '2' ?
            <div>
                <hr className="h-1 mx-auto my-4 bg-gray-300 border-0 rounded md:my-10 dark:bg-gray-700"></hr>
                <h5 className="text-xl text-gray-900 font-bold dark:text-white pb-4">Parameters</h5>
                <div className="flex flex-row pb-8">
                    <div className="basis-1/2 max-w-xs">
                        <label htmlFor="minElements" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Min Number of Elements<span className="text-red-700">*</span></label>
                        <input value={params.minElements} onChange={validateNumeric} type="minElements" name="minElements" id="minElements" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="50"/>
                    </div>
                    <div className="basis-1/6 max-w-xs"/>
                    <div className="basis-1/2 max-w-xs">
                        <label htmlFor="minTimestamps" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Min Number of Timestamps<span className="text-red-700">*</span></label>
                        <input value={params.minTimestamps} onChange={validateNumeric} type="minTimestamps" name="minTimestamps" id="minTimestamps" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="10"/>
                    </div>
                </div>
                <div className="flex flex-row">
                    <div className="basis-1/2 max-w-xs">
                        <label htmlFor="tEpsilon" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Distance Threshold Epsilon<span className="text-red-700">*</span> (Angstrom)</label>
                        <input value={params.tEpsilon} onChange={handleChange} type="number" step="0.01" min="0" max="100" name="tEpsilon" id="tEpsilon" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="2.35"/>
                    </div>
                </div>
                <hr className="h-1 mx-auto my-4 bg-gray-300 border-0 rounded md:my-10 dark:bg-gray-700"></hr>
                <div className="flex flex-row">
                    <div className="basis-1/2 max-w-xs">
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Job Name<span className="text-red-700">*</span></label>
                        <input value={params.name} onChange={handleChange} type="name" name="name" id="name" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Job Name"/>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={onStartJob} className={isValid() ? "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" : "bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed"}>
                        Start Job
                    </button>
                </div>
            </div>
            :
            params.algorithm === '1' &&
            <div>
                <hr className="h-1 mx-auto my-4 bg-gray-300 border-0 rounded md:my-10 dark:bg-gray-700"></hr>
                <h5 className="text-xl text-gray-900 font-bold dark:text-white pb-4">Parameters (Basic Convoy Job Must Be Ran First)</h5>
                {jobs.length === 0 ? 
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
                <div className="flex flex-row">
                    <div className="basis-1/2 max-w-xs">
                        <label htmlFor="convoy_id" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Convoy Job<span className="text-red-700">*</span></label>
                        <select value={params.convoy_id} onChange={handleChange} id="convoy_id" type="convoy_id" name="convoy_id" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                            <option value="" disabled hidden>Choose here</option>
                            {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.job_id}</option>)}
                        </select>
                    </div>
                </div>
                }
                <hr className="h-1 mx-auto my-4 bg-gray-300 border-0 rounded md:my-10 dark:bg-gray-700"></hr>
                {params.convoy_id &&
                <div>
                    {
                        !job || !job.result ? 
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
                        <div>
                        <div className="flex flex-row">
                            <div className="basis-1/2 max-w-xs">
                                <label htmlFor="index" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Convoy Index<span className="text-red-700">*</span></label>
                                <select value={params.index} onChange={handleChange} id="index" type="index" name="index" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                                    <option value="" disabled hidden>Choose here</option>
                                    {job.result.map((convoy, index)=> <option key={index} value={index}>{index + 1}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={onStartHbJob} className={isHbValid() ? "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" : "bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed"}>
                                Start Job
                            </button>
                        </div>
                        </div>
                    }
                </div>
                }
            </div>
            }
        </div>
        

    </div>
    )
}