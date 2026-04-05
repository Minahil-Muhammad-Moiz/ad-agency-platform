import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, AlertCircle, TrendingDown, DollarSign, Eye } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

const NotificationCenter = ({ userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const dropdownRef = useRef(null);

    // Get alert icon based on type
    const getAlertIcon = (type) => {
        switch(type) {
            case 'low_ctr': return <TrendingDown size={18} className="text-yellow-500" />;
            case 'budget_exceeded': return <DollarSign size={18} className="text-red-500" />;
            case 'low_roas': return <TrendingDown size={18} className="text-orange-500" />;
            case 'low_impressions': return <Eye size={18} className="text-blue-500" />;
            default: return <AlertCircle size={18} className="text-gray-500" />;
        }
    };

    // Get severity color
    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'critical': return 'bg-red-100 dark:bg-red-900/20 border-red-500';
            case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500';
            default: return 'bg-blue-100 dark:bg-blue-900/20 border-blue-500';
        }
    };

    // Fetch unread notifications
    const fetchUnreadNotifications = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/notifications/unread');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setUnreadCount(prev => prev - 1);
            toast.success('Notification marked as read');
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await axios.put('http://localhost:5000/api/notifications/read-all');
            setNotifications([]);
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Setup WebSocket connection
    useEffect(() => {
        const newSocket = io('http://localhost:5000', {
            transports: ['websocket'],
            autoConnect: true
        });
        
        newSocket.on('connect', () => {
            console.log('🔌 Connected to notification server');
            newSocket.emit('register-user', userId);
        });
        
        newSocket.on('new_alert', (alert) => {
            console.log('📢 New alert received:', alert);
            setNotifications(prev => [alert, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast notification
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                {getAlertIcon(alert.alert_type)}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {alert.alert_type.replace('_', ' ').toUpperCase()}
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {alert.message}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                markAsRead(alert.id);
                            }}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
                        >
                            Mark Read
                        </button>
                    </div>
                </div>
            ), { duration: 5000 });
            
            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio play failed:', e));
        });
        
        setSocket(newSocket);
        fetchUnreadNotifications();
        
        return () => {
            newSocket.disconnect();
        };
    }, [userId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">
                                    {unreadCount} unread
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-primary-600 hover:text-primary-700"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <Bell size={40} className="mx-auto mb-2 opacity-50" />
                                <p>No new notifications</p>
                                <p className="text-sm mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${getSeverityColor(notification.severity)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            {getAlertIcon(notification.alert_type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {notification.campaign_name}
                                                </p>
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                {notification.message}
                                            </p>
                                            {notification.recommendation && (
                                                <p className="text-xs text-primary-600 dark:text-primary-400 mt-2">
                                                    💡 {notification.recommendation}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                        <button
                            onClick={() => {
                                // Open notification history
                                console.log('Open history');
                            }}
                            className="w-full text-center text-sm text-primary-600 hover:text-primary-700"
                        >
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;