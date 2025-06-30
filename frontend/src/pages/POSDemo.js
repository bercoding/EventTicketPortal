import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import eventAPI from '../services/api';
import paymentAPI from '../services/paymentService';
import { toast } from 'react-hot-toast';

const POSDemo = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await eventAPI.getEvents();
            setEvents(response.events || response.data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Không thể tải danh sách sự kiện');
        }
    };

    const handleEventSelect = (event) => {
        setSelectedEvent(event);
        setSelectedTickets([]);
        setSelectedSeats([]);
        setPaymentResult(null);
    };

    const handleTicketAdd = (ticketType) => {
        const existingTicket = selectedTickets.find(t => t.ticketTypeId === ticketType._id);
        if (existingTicket) {
            setSelectedTickets(prev => 
                prev.map(t => 
                    t.ticketTypeId === ticketType._id 
                        ? { ...t, quantity: t.quantity + 1 }
                        : t
                )
            );
        } else {
            setSelectedTickets(prev => [...prev, {
                ticketTypeId: ticketType._id,
                name: ticketType.name,
                price: ticketType.price,
                quantity: 1
            }]);
        }
    };

    const handleTicketRemove = (ticketTypeId) => {
        setSelectedTickets(prev => {
            const ticket = prev.find(t => t.ticketTypeId === ticketTypeId);
            if (ticket && ticket.quantity > 1) {
                return prev.map(t => 
                    t.ticketTypeId === ticketTypeId 
                        ? { ...t, quantity: t.quantity - 1 }
                        : t
                );
            } else {
                return prev.filter(t => t.ticketTypeId !== ticketTypeId);
            }
        });
    };

    const calculateTotal = () => {
        const ticketsTotal = selectedTickets.reduce((sum, ticket) => 
            sum + (ticket.price * ticket.quantity), 0
        );
        const seatsTotal = selectedSeats.reduce((sum, seat) => 
            sum + seat.price, 0
        );
        return ticketsTotal + seatsTotal;
    };

    const handlePOSPayment = async () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để thanh toán');
            return;
        }

        if (!selectedEvent) {
            toast.error('Vui lòng chọn sự kiện');
            return;
        }

        if (selectedTickets.length === 0 && selectedSeats.length === 0) {
            toast.error('Vui lòng chọn ít nhất 1 vé');
            return;
        }

        setLoading(true);
        try {
            const paymentData = {
                eventId: selectedEvent._id,
                selectedSeats: selectedSeats,
                selectedTickets: selectedTickets,
                totalAmount: calculateTotal(),
                bookingType: selectedSeats.length > 0 ? 'seating' : 'general',
                userId: user.id
            };

            console.log('🏦 Creating POS payment with data:', paymentData);

            const response = await paymentAPI.createPOSPayment(paymentData);
            console.log('✅ POS Payment response:', response);

            setPaymentResult(response);
            toast.success('Tạo thanh toán POS thành công!');
            
        } catch (error) {
            console.error('❌ POS Payment error:', error);
            toast.error('Tạo thanh toán POS thất bại: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
                    🏪 Demo Thanh Toán POS
                </h1>
                <p>Demo page for POS payment</p>
            </div>
        </div>
    );
};

export default POSDemo; 