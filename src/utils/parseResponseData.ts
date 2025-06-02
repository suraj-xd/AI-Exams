export const parseResponseData = (data: string) => {
    const parsedData = JSON.parse(data);
    const quizTypes = ['mcq', 'fill', 'true', 'short', 'long'];
    const quizData = quizTypes.reduce((acc, type) => {
        const keys = Object.keys(parsedData).filter(key => key.includes(type));
        acc[type] = keys.reduce((acc, key) => [...acc, ...parsedData[key]], []);
        return acc;
    }, {} as Record<string, any[]>);
    return quizData;
};
