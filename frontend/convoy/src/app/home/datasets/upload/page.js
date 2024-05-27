'use client'

import React, { useState } from "react";
import { UserContext } from '@/service/userService';
import base_url from "@/service/api";
import { useRouter } from 'next/navigation';


export default function Upload() {

    const [file, setFile] = useState();
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState("");
    const userData = React.useContext(UserContext);
    const [loading, setLoading] = useState(false);
    const router = useRouter();


    //TO:DO Implement Upload Logic

    function getExtension(filename) {
        return filename.split('.').pop()
    }

    const onFileChange = (event) => {
        setError("");
        if (getExtension(event.target.files[0].name) != 'npy'){
            setError("Dataset must be in '.npy' format");
        }
        else {
            setFile(event.target.files[0]);
            setFileName(event.target.files[0].name);
        }
    };

    const onUpload = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        const headers = { 
            'Authorization': 'Bearer ' + userData.token 
        };

        try {
        // You can write the URL of your server or any other endpoint used for file upload
            const result = await fetch(base_url + 'dataset', {
                method: "POST",
                headers: headers,
                body: formData,
            });
    
            const data = await result.json();
            console.log(data);

            router.push("/home/datasets");
        } catch (error) {
            console.log(error);
            setError('Unexpected error.');
        }
        setLoading(false);
    }

    if(loading){
        return(
        <section className="bg-gray-50 dark:bg-gray-900 h-full p-6">
            <h2 className="text-gray-900 text-4xl font-extrabold dark:text-white pb-8">Uploading... (This might take a while)</h2><br/>
            <div role="status" className='h-full flex justify-center content-center'>
                <div className="flex items-center content-center">
                <svg aria-hidden="true" className="content-center w-20 h-20 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                </div>
                <span className="sr-only">Uploading Dataset</span>
            </div>
        </section>)
    }

    return(
        <div className="p-6">
            <h2 className="text-gray-900 text-4xl font-extrabold dark:text-white pb-8">Upload Dataset</h2>
            {error && 
            <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                <span className="font-medium">{error}</span>
            </div>
            }
        
            <div class="flex items-center justify-center w-full">
                <label for="dropzone-file" class="flex basis-3/4 flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Click to upload</span> or drag and drop</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">.npy (MAX. 5GB)</p>
                    </div>
                    <input id="dropzone-file" type="file" class="hidden" onChange={onFileChange}/>
                </label>
            </div>
            {fileName && 
            <div className="py-6 flex flex-col items-center">
                    <button onClick={onUpload} className={"bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"}>
                        Upload New Dataset ({fileName})
                    </button>
            </div> }
            


        </div>
    )
}