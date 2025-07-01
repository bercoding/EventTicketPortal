import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userProfileAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaBuilding, FaBriefcase, FaPaperPlane } from 'react-icons/fa';

const BecomeOwnerPage = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        businessType: 'individual',
        businessDescription: '',
        contactInfo: {
            phone: '',
            email: '',
            website: '',
        },
        estimatedEventFrequency: 'occasional',
        previousExperience: '',
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            contactInfo: {
                ...prev.contactInfo,
                [name]: value,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await userProfileAPI.submitOwnerRequest(formData);
            toast.success('Your request has been submitted successfully! We will review it shortly.');
            navigate('/profile');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };
    
    const backgroundImageUrl = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80';

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>
            
            <div className="relative z-10 bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl">
                {/* Nút Thoát */}
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-lg font-bold focus:outline-none"
                    title="Thoát"
                >
                    ×
                </button>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Become an Event Organizer</h1>
                    <p className="text-gray-600 mt-2">Fill out the form below to start hosting your own events.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Business Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                             <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 flex items-center">
                                <FaBuilding className="mr-3 text-indigo-500" />
                                Business Information
                            </h2>
                        </div>
                       
                        <div>
                            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">Business Name</label>
                            <input type="text" name="businessName" id="businessName" value={formData.businessName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        
                        <div>
                            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">Business Type</label>
                            <select name="businessType" id="businessType" value={formData.businessType} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="individual">Individual</option>
                                <option value="company">Company</option>
                                <option value="organization">Organization</option>
                                <option value="non_profit">Non-Profit</option>
                            </select>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700">Business Description</label>
                            <textarea name="businessDescription" id="businessDescription" value={formData.businessDescription} onChange={handleChange} rows="4" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                        </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                             <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 flex items-center">
                                <FaBriefcase className="mr-3 text-indigo-500" />
                                Contact & Experience
                            </h2>
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Contact Phone</label>
                            <input type="tel" name="phone" id="phone" value={formData.contactInfo.phone} onChange={handleContactChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                         <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Contact Email</label>
                            <input type="email" name="email" id="email" value={formData.contactInfo.email} onChange={handleContactChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                            <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website (Optional)</label>
                            <input type="url" name="website" id="website" value={formData.contactInfo.website} onChange={handleContactChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                            <label htmlFor="estimatedEventFrequency" className="block text-sm font-medium text-gray-700">How often do you plan to host events?</label>
                            <select name="estimatedEventFrequency" id="estimatedEventFrequency" value={formData.estimatedEventFrequency} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="occasional">Occasionally</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>

                         <div className="md:col-span-2">
                            <label htmlFor="previousExperience" className="block text-sm font-medium text-gray-700">Previous Experience (Optional)</label>
                            <textarea name="previousExperience" id="previousExperience" value={formData.previousExperience} onChange={handleChange} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                        </div>
                    </div>
                    
                    {/* Submission */}
                    <div className="pt-5">
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:w-auto inline-flex justify-center items-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                <FaPaperPlane className="mr-2" />
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BecomeOwnerPage; 