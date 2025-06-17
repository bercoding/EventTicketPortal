import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { searchUsersAPI } from '../../services/api';

const UserSearch = ({ onSelectUser, currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(debounce(async (term) => {
        if (term.trim().length > 1) {
            setIsLoading(true);
            setError(null);
            try {
                const response = await searchUsersAPI(term);
                const users = response.data || []; // Lấy data từ response
                const finalResults = users.filter(u => u._id !== currentUser?._id); // Lọc bỏ user hiện tại
                setResults(finalResults);
            } catch (err) {
                console.error("UserSearch: Error searching users:", err);
                setError(err.message || 'Lỗi khi tìm kiếm người dùng.');
                setResults([]);
            }
            setIsLoading(false);
        } else {
            setResults([]);
            setError(null);
        }
    }, 500), [currentUser?._id]);

    useEffect(() => {
        if (searchTerm.trim().length > 1) {
            debouncedSearch(searchTerm);
        } else {
            setResults([]);
            setError(null);
        }
        return () => {
            debouncedSearch.cancel(); 
        };
    }, [searchTerm, debouncedSearch]);

    const handleSelect = (user) => {
        onSelectUser(user);
        setSearchTerm('');
        setResults([]);
        setError(null);
    };

    return (
        <div className="my-3 relative">
            <input 
                type="text"
                placeholder="Tìm bạn bè..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2.5 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-sm shadow-sm"
            />
            {isLoading && <p className="absolute w-full text-center p-2 text-xs text-gray-500 top-full mt-1">Đang tìm...</p>}
            {error && <p className="absolute w-full p-2 text-xs text-red-500 top-full mt-1">{error}</p>}
            {results.length > 0 && (
                <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-md mt-1.5 max-h-60 overflow-y-auto shadow-lg custom-scrollbar">
                    {results.map(userRes => (
                        <li 
                            key={userRes._id}
                            onClick={() => handleSelect(userRes)}
                            className="flex items-center p-2.5 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                        >
                            <img 
                                src={userRes.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userRes.username)}&background=random&color=fff&font-size=0.5`}
                                alt={userRes.username}
                                className="w-8 h-8 rounded-full mr-2.5 object-cover"
                            />
                            <div>
                                <span className="font-medium text-gray-700">{userRes.username}</span>
                                <span className="text-gray-500 ml-1.5 text-xs">({userRes.email})</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {!isLoading && !error && searchTerm && results.length === 0 && searchTerm.length > 1 &&
                 <p className="absolute w-full p-2 text-xs text-gray-500 top-full mt-1">Không tìm thấy người dùng nào.</p>}
        </div>
    );
};

export default UserSearch;
