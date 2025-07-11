import api from './api';

const getUserTickets = async () => {
    try {
        console.log('Calling API to get user tickets...');
        const response = await api.get('/tickets/my-tickets');
        console.log('API response for tickets:', response.status);
        return response;
    } catch (error) {
        console.error('Error in getUserTickets service:', error);
        // Trả về một response giả để tránh lỗi
        return { data: [] };
    }
};

const returnTicket = (ticketId) => {
    return api.post(`/tickets/${ticketId}/return`);
};

export const ticketService = {
    getUserTickets,
    returnTicket,
}; 