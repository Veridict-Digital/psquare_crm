import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useQueryClient } from '@tanstack/react-query';

const CallPopupContext = createContext();

export const useCallPopup = () => useContext(CallPopupContext);

export const CallPopupProvider = ({ children }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [callId, setCallId] = useState(null);
  const [orderId, setOrderId] = useState('');
  const queryClient = useQueryClient();

  const openPopup = (customerData) => {
    setCustomer(customerData);
    setIsVisible(true);
    setTimer(0);
    setIsRunning(false);
    setNotes('');
    setCallId(null);
  };

  const hidePopup = () => {
    setIsVisible(false);
    setCustomer(null);
    setTimer(0);
    setIsRunning(false);
    setNotes('');
    setOrderId(''); // Clear order ID when hiding popup
  };

  const startTimer = () => {
    setCallId(Date.now().toString());
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
  };

  const endCall = async () => {
    if (timer > 0) {
      try {
        const callLogData = {
          customer: customer.id,
          duration: timer, // Send duration in seconds as integer
          note: notes,
          status: 'Completed',
        };

        // If order ID is provided, include it
        if (orderId.trim()) {
          callLogData.order_id = orderId.trim();
        }

        await axios.post('/api/calllogs/', callLogData);
        queryClient.invalidateQueries(['call-logs']);
      } catch (error) {
        console.error('Error saving call log:', error.response?.data || error.message);
      }
    }
    hidePopup();
  };

  const placeOrder = () => {
    window.open('/orders/new?customer=' + customer.id, '_blank');
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <CallPopupContext.Provider value={{ isVisible, customer, timer, isRunning, notes, setNotes, orderId, setOrderId, openPopup, hidePopup, startTimer, stopTimer, endCall, placeOrder }}>
      {children}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full relative border border-gray-200">
            <button onClick={hidePopup} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Call Tracker</h2>
            {callId && <p className="text-sm text-gray-600 mb-4">Call ID: {callId}</p>}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Customer:</span>
                <span className="text-gray-900">{customer?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="text-gray-900">{customer?.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Timer:</span>
                <span className="text-2xl font-mono text-blue-600">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Add notes about the call..."
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Order ID (if placing order)</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter order ID..."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {!isRunning ? (
                <button onClick={startTimer} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">Start Call</button>
              ) : (
                <button onClick={stopTimer} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">Pause Call</button>
              )}
              <button onClick={endCall} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">End Call</button>
              <button onClick={placeOrder} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">Place Order</button>
            </div>
          </div>
        </div>
      )}
    </CallPopupContext.Provider>
  );
};
