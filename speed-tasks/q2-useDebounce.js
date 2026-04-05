/**
 * TASK Q2: React Custom Hook - useDebounce
 * 
 * Delays API calls in a search input by 300ms
 * Prevents excessive API calls while user is typing
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useDebounce Hook
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {any} - Debounced value
 */
function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
        // Set timeout to update debounced value after delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        
        // Cleanup timeout if value changes before delay completes
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);
    
    return debouncedValue;
}

/**
 * Alternative: useDebouncedCallback (more advanced)
 * Returns a debounced version of the callback function
 */
function useDebouncedCallback(callback, delay = 300) {
    const timeoutRef = useRef(null);
    
    const debouncedCallback = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    
    return debouncedCallback;
}

// Example usage component
const SearchComponent = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Debounce the search term
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    // Effect that runs when debounced value changes
    useEffect(() => {
        if (debouncedSearchTerm) {
            searchAPI(debouncedSearchTerm);
        }
    }, [debouncedSearchTerm]);
    
    const searchAPI = async (term) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/search?q=${term}`);
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div>
            <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
            />
            {isLoading && <div>Loading...</div>}
            {results.map(result => (
                <div key={result.id}>{result.name}</div>
            ))}
        </div>
    );
};

export { useDebounce, useDebouncedCallback, SearchComponent };

/**
 * USAGE EXAMPLES:
 * 
 * 1. Basic usage:
 *    const debouncedValue = useDebounce(searchInput, 300);
 * 
 * 2. With API call:
 *    useEffect(() => {
 *        if (debouncedValue) {
 *            fetchResults(debouncedValue);
 *        }
 *    }, [debouncedValue]);
 * 
 * 3. With debounced callback:
 *    const debouncedSave = useDebouncedCallback(saveData, 500);
 *    debouncedSave(formData);
 */