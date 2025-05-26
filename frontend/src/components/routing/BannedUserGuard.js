import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import BannedUser from '../BannedUser';

const BannedUserGuard = ({ children }) => {
    const { isBanned, banReason } = useContext(AuthContext);

    if (isBanned) {
        return <BannedUser banReason={banReason} />;
    }

    return children;
};

export default BannedUserGuard; 