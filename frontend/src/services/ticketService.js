import api from './api';

const getUserTickets = () => {
    return api.get('/tickets/my-tickets');
};

const returnTicket = (ticketId) => {
    return api.post(`/tickets/${ticketId}/return`);
};

export const ticketService = {
    getUserTickets,
    returnTicket,
}; 