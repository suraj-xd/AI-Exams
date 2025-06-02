import { useEffect, useState } from 'react';

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import useQuestionsData from '../store/useQuestionsData';
import usePromptStore from '~/store/usePromptStore';
import useLoadingStore from '~/store/useLoadingStore';


export function TopicInputComponent() {
    const [topic, setTopic] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const { prompt, setPrompt } = usePromptStore();
    const { isLoading, setIsLoading } = useLoadingStore();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!prompt) {
            alert('Please enter a prompt.');
            return;
        }

        console.log(prompt);
        console.log("Making request");
        setIsLoading(true);
        const uniqueId = uuidv4();
        let attempts = 0;
        const maxAttempts = 3;
        let success = false;

        while (attempts < maxAttempts && !success) {
            try {
                const response = await axios.post('http://localhost:3001/getjson', { topic:prompt, uuid: uniqueId }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                console.log("made request");

                if (response.status === 200 && response.data) {
                    const parsedData = JSON.parse(response.data.data);
                    console.log(parsedData);
                    // check if it's valid json data.
                    setResult(parsedData);
                    success = true;
                } else {
                    toast.error('Failed to fetch data. Please try again later.');
                    success = true; // Exit loop on API error, not retrying further
                }
            } catch (error) {
                console.error('Attempt', attempts + 1, 'Error:', error);
                attempts += 1;
                if (attempts >= maxAttempts) {
                    toast.error('An error occurred while fetching data. Please try again later.');
                }
            }
        }
        setIsLoading(false);
    }
    useEffect(() => {
        console.log(prompt);
    }, [prompt])

    useEffect(() => {
        const parseResponseData = (data) => {
            console.log("Data in JSON Parse");
            console.log(data);
            
            
            const parsedData = data;
            const quizTypes = ['mcq', 'fill', 'true', 'short', 'long'];
            const quizData = quizTypes.reduce((acc, type) => {
                const keys = Object.keys(parsedData).filter(key => key.includes(type));
                acc[type] = keys.reduce((acc, key) => [...acc, ...parsedData[key]], []);
                return acc;
            }, {} as Record<string, any[]>);
            return quizData;
        };
    
        if (result) {
    
            
            const { mcq, fill, true: trueFalse, short, long } = parseResponseData(result);
            const { setMcqData, setFillData, setTrueFalseData, setShortData, setLongData } = useQuestionsData.getState();
            setMcqData(mcq);
            setFillData(fill);
            setTrueFalseData(trueFalse);
            setShortData(short);
            setLongData(long);
        }
    }, [result]);
    
    const { mcqData, fillData, trueFalseData, shortData, longData } = useQuestionsData();
    
    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter prompt"
                />
                <button type="submit">Submit</button>
            </form>
            {isLoading ? "loading..." :
                (result && 
                    <AnalyzeQuestions/>
                // <div><pre>{JSON.stringify(result, null, 2)}</pre></div>
                )
            }
            {/* {result && <AnalyzeQuestions/>} */}
            {error && <p>{error}</p>}
        </div>
    );
}


export const AnalyzeQuestions = () => {

        const { shortData, longData } = useQuestionsData();

        return (
            <>
               <div>
                        <h3>Short Answer</h3>
                        {shortData.map((short, index) => (
                            <div key={index}>
                                <p>{short.question}</p>
                                <strong>Answer: {short.answer}</strong>
                            </div>
                        ))}
                    </div>
                    <div>
                        <h3>Long Answer</h3>
                        {longData.map((long, index) => (
                            <div key={index}>
                                <p>{long.question}</p>
                                <strong>Answer: {long.answer}</strong>
                            </div>
                        ))}
                    </div>
            </>
        );
    };


export function ImageUploadComponent() {
    const [image, setImage] = useState(null);
    const [imageType, setImageType] = useState('');
    const [responseData, setResponseData] = useState('');

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) {
            return;
        }
        if (file.size > 1024 * 1024) { // 1MB
            toast.error('File size limit is 1MB');
            setImage(null);
            setImageType(null);

            return;
        }
        setImage(file);
        setImageType(file.type);
    };
    const { prompt, setPrompt } = usePromptStore();
    const { isLoading, setIsLoading } = useLoadingStore();

    const handleSubmit = async () => {
        if (!image) {
            alert('Please select an image first.');
            return;
        }
        setIsLoading(true);
        const formData = new FormData();
        formData.append('image', image);
        formData.append('imageType', imageType);
        try {
            const response = await axios.post('http://localhost:3000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log("Made Request");
            console.log(response);

            if (response.status !== 200) {
                throw new Error('Network response was not ok');
            }

            setResponseData(JSON.stringify(response.data));
        } catch (e) {
            if (axios.isAxiosError(e) && e.code === 'ERR_NETWORK') {
                console.log('A network error occurred. This could be due to server unavailability or connectivity issues.');
            } else {
                console.log(e);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const words = responseData.split(/\s+/);
        if (words.length > 30) {
            const shortened = words.slice(0, 30).join(' ') + '...';
            setResponseData(shortened);
            setPrompt(shortened);

        }
    }, [responseData]);


    return (
        <div>
            <input type="file" placeholder='none' accept="image/*" onChange={handleImageChange} />
            <button onClick={handleSubmit}>Upload Image</button>
            <div>
                <h3>Response Data:</h3>
                {isLoading ? "Loading..." :
                    <pre>{JSON.stringify(responseData, null, 2)}</pre>
                }
            </div>

        </div>
    );
}


// Upload Doc(Txt)
export function UploadPage() {
    const [fileContent, setFileContent] = useState('');
    const { prompt, setPrompt } = usePromptStore();
    const { isLoading, setIsLoading } = useLoadingStore();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) {
            return;
        }

        if (file.type !== "text/plain") {
            toast.error("Only txt files are allowed");
            return;
        }
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const result = e.target ? e.target.result : '';
            setFileContent(result.toString());
        };
        reader.readAsText(file);
        setIsLoading(false);
    };
    useEffect(() => {
        const words = fileContent.split(/\s+/);
        if (words.length > 30) {
            const shortened = words.slice(0, 30).join(' ') + '...';
            setFileContent(shortened);
            setPrompt(shortened);
        }
    }, [fileContent]);

    return (
        <div>
            <input type="file" onChange={handleFileChange} accept=".txt" />
            <div>
                <h3>File Content:</h3>
                {isLoading ? "Loading..." :
                    <pre>{"promt-Content: " + fileContent}</pre>
                }

            </div>
        </div>
    );
}
