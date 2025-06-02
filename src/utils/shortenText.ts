export function shortedText(words) {
    const splitWords = fileContent.split(/\s+/);
    if (splitWords.length > 30) {
        const shortened = splitWords.slice(0, 30).join(' ') + '...';
        return shortened;
    }
    return words;
}