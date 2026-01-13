import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import CallPopup from '../components/CallPopup';

const CallPopupContext = createContext();

export const useCallPopup = () => useContext(CallPopupContext);

export const CallPopupProvider = ({ children }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [lead, setLead] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [callId, setCallId] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [selectedAssumption, setSelectedAssumption] = useState([]);
  const [selectedAssumption2, setSelectedAssumption2] = useState([]);
  const [selectedAssumption3, setSelectedAssumption3] = useState([]);
  const [showCreateAssumptionModal, setShowCreateAssumptionModal] = useState(false);
  const [newAssumptionName, setNewAssumptionName] = useState('');
  const [showManageAssumptionsModal, setShowManageAssumptionsModal] = useState(false);
  const [editingAssumption, setEditingAssumption] = useState(null);
  const [editAssumptionName, setEditAssumptionName] = useState('');
  const [currentDropdown, setCurrentDropdown] = useState(''); // Track which dropdown is creating assumption

  // Separate assumption lists
  const { data: assumptions, refetch: refetchAssumptions } = useQuery({
    queryKey: ['assumptions'],
    queryFn: async () => {
      const response = await axios.get('/api/assumptions/');
      console.log('Assumptions data:', response.data);
      return response.data;
    },
  });
  const { data: assumptions2, refetch: refetchAssumptions2 } = useQuery({
    queryKey: ['assumptions2'],
    queryFn: async () => {
      const response = await axios.get('/api/assumptions2/');
      console.log('Assumptions2 data:', response.data);
      return response.data;
    },
  });
  const { data: assumptions3, refetch: refetchAssumptions3 } = useQuery({
    queryKey: ['assumptions3'],
    queryFn: async () => {
      const response = await axios.get('/api/assumptions3/');
      console.log('Assumptions3 data:', response.data);
      return response.data;
    },
  });
  const queryClient = useQueryClient();

  // Fetch assumptions (handled below with separate queries)

  const openPopup = (data) => {
    if (data.phone) {
      // Check if it's a lead (has status) or customer
      if (data.status) {
        setLead(data);
        setCustomer(null);
      } else {
        setCustomer(data);
        setLead(null);
      }
    }
    setIsVisible(true);
    setIsEmbedded(false);
    // Only reset call state if not already running a call
    if (!isRunning) {
      setTimer(0);
      setNotes('');
      setCallId(null);
      setSelectedAssumption([]);
      setSelectedAssumption2([]);
      setSelectedAssumption3([]);
    }
  };

  const startEmbeddedCall = (data) => {
    if (data.phone) {
      // Check if it's a lead (has status) or customer
      if (data.status) {
        setLead(data);
        setCustomer(null);
      } else {
        setCustomer(data);
        setLead(null);
      }
    }
    setIsEmbedded(true);
    setIsVisible(true);
    // Only reset call state if not already running a call
    if (!isRunning) {
      setTimer(0);
      setNotes('');
      setCallId(null);
      setSelectedAssumption([]);
      setSelectedAssumption2([]);
      setSelectedAssumption3([]);
    }
  };

  const hidePopup = () => {
    setIsVisible(false);
    setIsEmbedded(false);
    // Do not reset call state here; just hide the popup
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
          duration: timer, // Send duration in seconds as integer
          note: notes,
          status: 'Completed',
          call_id: callId, // Include the call tracker ID
        };

        // Set customer or lead based on which one is active
        if (customer) {
          callLogData.customer = customer.id;
        } else if (lead) {
          callLogData.lead = lead.id;
        }

        // If order ID is provided, include it
        if (orderId.trim()) {
          callLogData.order_id = orderId.trim();
        }

        // If assumption is selected, include it
        if (selectedAssumption) {
          callLogData.assumption = selectedAssumption;
        }
        if (selectedAssumption2) {
          callLogData.assumption2 = selectedAssumption2;
        }
        if (selectedAssumption3) {
          callLogData.assumption3 = selectedAssumption3;
        }

        await axios.post('/api/calllogs/', callLogData);
        queryClient.invalidateQueries(['call-logs']);
        queryClient.invalidateQueries(['customer-details']);
      } catch (error) {
        console.error('Error saving call log:', error.response?.data || error.message);
      }
    }
    // Now reset all call state after ending the call
    setIsVisible(false);
    setIsEmbedded(false);
    setCustomer(null);
    setLead(null);
    setTimer(0);
    setIsRunning(false);
    setNotes('');
    setOrderId('');
    setSelectedAssumption('');
    setSelectedAssumption2('');
    setSelectedAssumption3('');
    setCallId(null);
  };


  // Create, edit, delete for each assumption type
  const createNewAssumption = async () => {
    if (!newAssumptionName.trim()) return;
    try {
      let response;
      if (currentDropdown === 'assumption2') {
        response = await axios.post('/api/assumptions2/', { name: newAssumptionName.trim(), is_active: true });
        refetchAssumptions2();
        setSelectedAssumption2([...selectedAssumption2, response.data.id]);
      } else if (currentDropdown === 'assumption3') {
        response = await axios.post('/api/assumptions3/', { name: newAssumptionName.trim(), is_active: true });
        refetchAssumptions3();
        setSelectedAssumption3([...selectedAssumption3, response.data.id]);
      } else {
        response = await axios.post('/api/assumptions/', { name: newAssumptionName.trim(), is_active: true });
        refetchAssumptions();
        setSelectedAssumption([...selectedAssumption, response.data.id]);
      }
      setShowCreateAssumptionModal(false);
      setNewAssumptionName('');
      setCurrentDropdown('');
    } catch (error) {
      console.error('Error creating assumption:', error.response?.data || error.message);
    }
  };

  const editAssumption = async () => {
    if (!editAssumptionName.trim() || !editingAssumption) return;
    try {
      let url = '/api/assumptions/';
      let refetch = refetchAssumptions;
      if (currentDropdown === 'assumption2') {
        url = '/api/assumptions2/';
        refetch = refetchAssumptions2;
      } else if (currentDropdown === 'assumption3') {
        url = '/api/assumptions3/';
        refetch = refetchAssumptions3;
      }
      await axios.put(`${url}${editingAssumption.id}/`, { name: editAssumptionName.trim(), is_active: editingAssumption.is_active });
      refetch();
      setShowManageAssumptionsModal(false);
      setEditingAssumption(null);
      setEditAssumptionName('');
    } catch (error) {
      console.error('Error editing assumption:', error.response?.data || error.message);
    }
  };

  const deleteAssumption = async (assumptionId) => {
    if (!confirm('Are you sure you want to delete this assumption?')) return;
    try {
      let url = '/api/assumptions/';
      let refetch = refetchAssumptions;
      if (currentDropdown === 'assumption2') {
        url = '/api/assumptions2/';
        refetch = refetchAssumptions2;
      } else if (currentDropdown === 'assumption3') {
        url = '/api/assumptions3/';
        refetch = refetchAssumptions3;
      }
      await axios.delete(`${url}${assumptionId}/`);
      refetch();
      if (selectedAssumption === assumptionId) setSelectedAssumption('');
      if (selectedAssumption2 === assumptionId) setSelectedAssumption2('');
      if (selectedAssumption3 === assumptionId) setSelectedAssumption3('');
    } catch (error) {
      console.error('Error deleting assumption:', error.response?.data || error.message);
    }
  };

  const startEditingAssumption = (assumption, dropdownType = '') => {
    setEditingAssumption(assumption);
    setEditAssumptionName(assumption.name);
    setCurrentDropdown(dropdownType);
  };

  const cancelEditing = () => {
    setEditingAssumption(null);
    setEditAssumptionName('');
    setCurrentDropdown('');
  };

  const placeOrder = () => {
    navigate('/orders/new?customer=' + customer.id);
  };

  const convertToCustomer = async () => {
    if (!lead) return;
    try {
      const response = await axios.post(`/api/leads/${lead.id}/convert_to_customer/`);
      // Update state to show the new customer
      setCustomer(response.data.customer);
      setLead(null);
      // Optionally, show a success message or navigate
      alert('Lead converted to customer successfully!');
    } catch (error) {
      console.error('Error converting lead to customer:', error.response?.data || error.message);
      alert('Failed to convert lead to customer.');
    }
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
    <CallPopupContext.Provider value={{ isVisible, isEmbedded, customer, lead, timer, isRunning, notes, setNotes, orderId, setOrderId, selectedAssumption, setSelectedAssumption, selectedAssumption2, setSelectedAssumption2, selectedAssumption3, setSelectedAssumption3, assumptions, assumptions2, assumptions3, openPopup, hidePopup, startEmbeddedCall, startTimer, stopTimer, endCall, placeOrder, convertToCustomer, showCreateAssumptionModal, setShowCreateAssumptionModal, newAssumptionName, setNewAssumptionName, createNewAssumption, showManageAssumptionsModal, setShowManageAssumptionsModal, editAssumption, deleteAssumption, startEditingAssumption, cancelEditing, editingAssumption, editAssumptionName, setEditAssumptionName, callId, currentDropdown, setCurrentDropdown }}>
      {children}
      <CallPopup />

      {/* Create New Assumption Modal */}
      {showCreateAssumptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative border border-gray-200">
            <button
              onClick={() => {
                setShowCreateAssumptionModal(false);
                setNewAssumptionName('');
                setCurrentDropdown('');
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >&times;</button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create New Assumption</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assumption Name</label>
              <input
                type="text"
                value={newAssumptionName}
                onChange={(e) => setNewAssumptionName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter assumption name..."
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateAssumptionModal(false);
                  setNewAssumptionName('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createNewAssumption}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Assumptions Modal */}
      {showManageAssumptionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full relative border border-gray-200 max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowManageAssumptionsModal(false);
                setEditingAssumption(null);
                setEditAssumptionName('');
                setCurrentDropdown('');
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >&times;</button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Manage Assumptions</h3>
            <div className="space-y-3">
              {(currentDropdown === 'assumption2' ? assumptions2 : currentDropdown === 'assumption3' ? assumptions3 : assumptions)?.map(assumption => (
                <div key={assumption.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  {editingAssumption?.id === assumption.id ? (
                    <input
                      type="text"
                      value={editAssumptionName}
                      onChange={(e) => setEditAssumptionName(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-gray-900">{assumption.name}</span>
                  )}
                  <div className="flex gap-2">
                    {editingAssumption?.id === assumption.id ? (
                      <>
                        <button
                          onClick={editAssumption}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditingAssumption(assumption, currentDropdown)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAssumption(assumption.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </CallPopupContext.Provider>
  );
};
