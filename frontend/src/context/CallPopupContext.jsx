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
  const [isMinimized, setIsMinimized] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [lead, setLead] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [callId, setCallId] = useState(null); // This will store the DATABASE ID after first save
  const [callIdString, setCallIdString] = useState(null); // Store the string version separately
  const [orderId, setOrderId] = useState('');
  const [selectedAssumption, setSelectedAssumption] = useState([]);
  const [selectedAssumption2, setSelectedAssumption2] = useState([]);
  const [selectedAssumption3, setSelectedAssumption3] = useState([]);
  const [showCreateAssumptionModal, setShowCreateAssumptionModal] = useState(false);
  const [newAssumptionName, setNewAssumptionName] = useState('');
  const [showManageAssumptionsModal, setShowManageAssumptionsModal] = useState(false);
  const [editingAssumption, setEditingAssumption] = useState(null);
  const [editAssumptionName, setEditAssumptionName] = useState('');
  const [currentDropdown, setCurrentDropdown] = useState('');
  const [externalSaveFn, setExternalSaveFn] = useState(null);
  const [isEditingLastCall, setIsEditingLastCall] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);

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

  // Reset call state function
  const resetCallState = () => {
    console.log('Resetting call state');
    setTimer(0);
    setIsRunning(false);
    setNotes('');
    setOrderId('');
    setSelectedAssumption([]);
    setSelectedAssumption2([]);
    setSelectedAssumption3([]);
    setCallId(null);
    setCallIdString(null);
    setIsVisible(false);
    setIsEmbedded(false);
    setIsEndingCall(false);
    setIsMinimized(false);
  };

  const openPopup = (data, saveFn = null) => {
    console.log('openPopup called with data:', data);
    
    let customerData = null;
    let leadData = null;
    
    if (data.phone) {
        if (data.status) {
            leadData = data;
            customerData = null;
        } else {
            customerData = {
                ...data,
                id: data.id,
                customer_id: data.id
            };
            leadData = null;
        }
    }

    // Check if another call is already active
    if (isRunning) {
        const isSameTarget = 
            (customer && customerData && customer.id === customerData.id) || 
            (lead && leadData && lead.id === leadData.id);
            
        if (isSameTarget) {
            setIsVisible(true);
            setIsMinimized(false);
            return;
        } else {
            alert('A call is already active. Please end the current call first.');
            return;
        }
    }
    
    setCustomer(customerData);
    setLead(leadData);
    setIsVisible(true);
    setIsEmbedded(false);
    setIsMinimized(false);
    
    // Set editing mode based on isEditing flag
    const isEditMode = !!data.isEditing;
    setIsEditingLastCall(isEditMode);
    console.log('Edit mode:', isEditMode);
    
    // If a save function is passed (for editing), store it
    if (saveFn) setExternalSaveFn(() => saveFn);
    else setExternalSaveFn(null);
    
    if (!isRunning) {
        setTimer(data.timer || 0);
        setNotes(data.notes || '');
        
        // CRITICAL: Handle call ID for edit mode
        if (isEditMode) {
            // For editing existing calls
            if (data.callId) {
                // This is the call_id string from the database
                setCallIdString(data.callId);
                console.log('Set callIdString for edit:', data.callId);
            }
            
            // Store the database ID if provided (for the update endpoint)
            if (data.dbId) {
                setCallId(data.dbId);
                console.log('Set database ID for edit:', data.dbId);
            } else if (data.id && typeof data.id === 'number' && data.id > 1000) {
                // If id looks like a database ID (likely > 1000), use it
                setCallId(data.id);
                console.log('Set database ID from id field:', data.id);
            } else {
                // No database ID yet - this might be a problem
                console.warn('Edit mode but no database ID provided');
                setCallId(null);
            }
        } else {
            // New call - generate a temporary ID
            const newStringId = Date.now().toString();
            setCallIdString(data.callId || newStringId);
            setCallId(null); // Database ID not known yet
            console.log('New call - generated ID:', newStringId);
            setIsRunning(true); // Automatically start call timer
        }
        
        setSelectedAssumption(data.selectedAssumption || []);
        setSelectedAssumption2(data.selectedAssumption2 || []);
        setSelectedAssumption3(data.selectedAssumption3 || []);
        setOrderId(data.orderId || '');
    }
    
    console.log('Customer set to:', customerData);
    console.log('Lead set to:', leadData);
    console.log('Is editing:', isEditMode);
    console.log('Call ID (db):', callId);
    console.log('Call ID (string):', callIdString);
  };

  const startEmbeddedCall = (data) => {
    let customerData = null;
    let leadData = null;
    
    if (data.phone) {
      if (data.status) {
        leadData = data;
      } else {
        customerData = data;
      }
    }

    if (isRunning) {
      const isSameTarget = 
          (customer && customerData && customer.id === customerData.id) || 
          (lead && leadData && lead.id === leadData.id);
          
      if (isSameTarget) {
          setIsVisible(true);
          setIsMinimized(false);
          setIsEmbedded(true);
          return;
      } else {
          alert('A call is already active. Please end the current call first.');
          return;
      }
    }

    if (data.phone) {
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
    setIsMinimized(false);
    if (!isRunning) {
      setTimer(0);
      setNotes('');
      const newStringId = Date.now().toString();
      setCallIdString(newStringId);
      setCallId(null);
      setSelectedAssumption([]);
      setSelectedAssumption2([]);
      setSelectedAssumption3([]);
    }
  };

  const hidePopup = () => {
    resetCallState();
  };

  const startTimer = () => {
    const newStringId = Date.now().toString();
    setCallIdString(newStringId);
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
  };

  const performOptimisticUpdate = (statusToSave = 'Completed') => {
    if (customer && customer.id) {
      try {
        const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
        const employeeName = loggedInUser.username || loggedInUser.name || 'You';

        const getAssumptionNames = (selectedIds, list) => {
          if (!selectedIds || !list) return [];
          return selectedIds
            .map((id) => {
              const item = list.find((a) => a.id === id || String(a.id) === String(id));
              return item ? item.name : null;
            })
            .filter(Boolean);
        };

        const tempCallLog = {
          id: callId || Date.now(), // DB ID or temp ID
          call_id: callIdString,
          date: new Date().toISOString(),
          employee_name: employeeName,
          duration_minutes: timer / 60,
          status: statusToSave,
          order_placed: orderId && orderId.trim() ? 'Yes' : 'No',
          order_id: orderId || null,
          assumption_names: getAssumptionNames(selectedAssumption, assumptions),
          assumption2_names: getAssumptionNames(selectedAssumption2, assumptions2),
          assumption3_names: getAssumptionNames(selectedAssumption3, assumptions3),
          note: notes,
        };

        const customerId = String(customer.id);
        queryClient.setQueryData(['customer-details', customerId], (oldData) => {
          if (!oldData) return oldData;

          const callLogs = oldData.call_logs || [];

          const existsIdx = callLogs.findIndex(
            (log) => log.id === tempCallLog.id || log.call_id === tempCallLog.call_id
          );

          let newCallLogs = [...callLogs];
          if (existsIdx >= 0) {
            newCallLogs[existsIdx] = {
              ...newCallLogs[existsIdx],
              ...tempCallLog,
            };
          } else {
            newCallLogs.unshift(tempCallLog);
          }

          return {
            ...oldData,
            call_logs: newCallLogs,
          };
        });
      } catch (err) {
        console.error('Failed to perform optimistic update:', err);
      }
    }
  };

  const saveInfo = async (isEditing = false, statusToSave = 'In Progress') => {
    // If editing and externalSaveFn is provided, use it for instant update
    if (externalSaveFn && callId) {
        // Compose the payload for edit
        const payload = {
            id: callId, // always the DB id
            note: notes,
            duration: timer,
            order_id: orderId,
            assumption: selectedAssumption,
            assumption2: selectedAssumption2,
            assumption3: selectedAssumption3,
        };
        try {
            performOptimisticUpdate(statusToSave);
            await externalSaveFn(payload);
            resetCallState();
            return callId;
        } catch (e) {
            alert('Failed to update call log.');
            return null;
        }
    }
    
    console.log('saveInfo called with isEditing:', isEditing, 'statusToSave:', statusToSave);
    console.log('callId (db):', callId);
    console.log('callIdString:', callIdString);
    console.log('Current customer:', customer);

    if (!callIdString) {
        console.log('No callIdString, returning early');
        alert('No call ID found. Please start a call first.');
        return null;
    }

    let isValid = false;
    let customerId = null;
    let leadId = null;

    if (customer && customer.id) {
        isValid = true;
        customerId = customer.id;
        console.log('Using customer ID:', customerId);
    } else if (lead && lead.id) {
        isValid = true;
        leadId = lead.id;
        console.log('Using lead ID:', leadId);
    }

    if (!isValid) {
        alert('Cannot save call log: No valid customer or lead selected.');
        console.error('Missing customer/lead:', { customer, lead });
        return null;
    }

    try {
        performOptimisticUpdate(statusToSave);
        const callLogData = {
            duration: timer,
            note: notes,
            status: statusToSave,
            call_id: callIdString,
        };

        if (customerId) {
            callLogData.customer = customerId;
            delete callLogData.lead;
        } else if (leadId) {
            callLogData.lead = leadId;
        }

        if (orderId && orderId.trim()) {
            callLogData.order_id = orderId.trim();
        }

        if (selectedAssumption && selectedAssumption.length > 0) {
            callLogData.assumption = selectedAssumption;
        }
        if (selectedAssumption2 && selectedAssumption2.length > 0) {
            callLogData.assumption2 = selectedAssumption2;
        }
        if (selectedAssumption3 && selectedAssumption3.length > 0) {
            callLogData.assumption3 = selectedAssumption3;
        }

        // CRITICAL: Add is_editing flag if this is an edit operation
        if (isEditing && callId) {
            callLogData.is_editing = true;
            console.log('Sending as EDIT operation with call_id:', callIdString);
        } else {
            console.log('Sending as NEW call operation');
        }

        console.log('Sending callLogData:', callLogData);

        const response = await axios.post('/api/calllogs/save_info/', callLogData);
        console.log('Save info response:', response);

        // CRITICAL: Save the database ID from the response
        if (response.data && response.data.id) {
            console.log('Received database ID from API:', response.data.id);
            setCallId(response.data.id); // Store the database ID for future updates
            
            // Also store the call_id if returned
            if (response.data.call_id) {
                setCallIdString(response.data.call_id);
            }
            
            queryClient.invalidateQueries(['call-logs']);
            queryClient.invalidateQueries(['customer-details']);
            
            if (isEditing || isEditingLastCall) {
                resetCallState();
            }
            return response.data.id;
        }

        queryClient.invalidateQueries(['call-logs']);
        queryClient.invalidateQueries(['customer-details']);

        return null;
    } catch (error) {
        console.error('Error saving info:', error.response?.data || error.message);
        alert(`Failed to save info: ${error.response?.data?.error || error.message}`);
        return null;
    }
  };

  const endCall = async () => {
    if (isEndingCall) return;
    setIsEndingCall(true);
    setIsRunning(false);
    
    // Close the popup visually immediately for an instant response!
    setIsVisible(false);
    setIsEmbedded(false);
    setIsMinimized(false);

    // Optimistically update the list/notes in history
    performOptimisticUpdate('Completed');

    let latestCallId = callId;
    
    // If info is not saved (no callId but timer > 0), save it directly as 'Completed' in a single request!
    if ((!callId || callId === null) && timer > 0 && callIdString) {
        const newId = await saveInfo(isEditingLastCall, 'Completed');
        if (newId) {
            latestCallId = newId;
            setCallId(newId);
            resetCallState();
        } else {
            setIsEndingCall(false); // Let them retry if saveInfo failed
            resetCallState();
        }
        return;
    }

    // Now update the call as completed if callId exists
    if (latestCallId && timer > 0) {
        try {
            const callLogData = {
                duration: timer,
                note: notes,
                status: 'Completed',
            };

            if (customer && customer.id) {
                callLogData.customer = customer.id;
            } else if (lead && lead.id) {
                callLogData.lead = lead.id;
            }

            if (orderId && orderId.trim()) {
                callLogData.order_id = orderId.trim();
            }

            if (selectedAssumption && selectedAssumption.length > 0) {
                callLogData.assumption = selectedAssumption;
            }
            if (selectedAssumption2 && selectedAssumption2.length > 0) {
                callLogData.assumption2 = selectedAssumption2;
            }
            if (selectedAssumption3 && selectedAssumption3.length > 0) {
                callLogData.assumption3 = selectedAssumption3;
            }

            console.log('Ending call with data:', callLogData);
            await axios.put(`/api/calllogs/${latestCallId}/`, callLogData);
            queryClient.invalidateQueries(['call-logs']);
            queryClient.invalidateQueries(['customer-details']);
            resetCallState();
        } catch (error) {
            console.error('Error ending call:', error.response?.data || error.message);
            resetCallState();
        }
    } else {
        // Fallback: if no latestCallId and timer is 0, just reset
        resetCallState();
    }
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
    navigate('/orders/new?customer=' + customer.id + '&customer_name=' + encodeURIComponent(customer.name || ''));
  };

  const convertToCustomer = async () => {
    if (!lead) return;
    try {
      const response = await axios.post(`/api/leads/${lead.id}/convert_to_customer/`);
      setCustomer(response.data.customer);
      setLead(null);
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
    <CallPopupContext.Provider value={{ 
      isVisible, isEmbedded, customer, lead, timer, isRunning, 
      notes, setNotes, orderId, setOrderId, 
      selectedAssumption, setSelectedAssumption, 
      selectedAssumption2, setSelectedAssumption2, 
      selectedAssumption3, setSelectedAssumption3, 
      assumptions, assumptions2, assumptions3, 
      openPopup, hidePopup, startEmbeddedCall, startTimer, stopTimer, 
      endCall, saveInfo, placeOrder, convertToCustomer, 
      showCreateAssumptionModal, setShowCreateAssumptionModal, 
      newAssumptionName, setNewAssumptionName, createNewAssumption, 
      showManageAssumptionsModal, setShowManageAssumptionsModal, 
      editAssumption, deleteAssumption, startEditingAssumption, cancelEditing, 
      editingAssumption, editAssumptionName, setEditAssumptionName, 
      callId, currentDropdown, setCurrentDropdown, 
      isEditingLastCall, isEndingCall,
      isMinimized, setIsMinimized
    }}>
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