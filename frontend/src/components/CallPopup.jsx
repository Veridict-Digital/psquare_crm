import React from 'react';
import { useCallPopup } from '../context/CallPopupContext';

const CallPopup = () => {
  const {
    isEmbedded,
    customer,
    lead,
    timer,
    isRunning,
    notes,
    setNotes,
    orderId,
    setOrderId,
    selectedAssumption,
    setSelectedAssumption,
    selectedAssumption2,
    setSelectedAssumption2,
    selectedAssumption3,
    setSelectedAssumption3,
    assumptions,
    hidePopup,
    startTimer,
    stopTimer,
    endCall,
    placeOrder,
    convertToCustomer,
    showCreateAssumptionModal,
    setShowCreateAssumptionModal,
    newAssumptionName,
    setNewAssumptionName,
    createNewAssumption,
    showManageAssumptionsModal,
    setShowManageAssumptionsModal,
    editAssumption,
    deleteAssumption,
    startEditingAssumption,
    cancelEditing,
    editingAssumption,
    editAssumptionName,
    setEditAssumptionName,
    assumptions2,
    assumptions3,
  } = useCallPopup();

  return (
    <div className={isEmbedded ? "bg-white p-6 rounded-lg shadow-xl max-w-lg w-full relative border border-gray-200 mb-4" : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"}>
      {!isEmbedded && (
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full relative border border-gray-200">
          <button onClick={hidePopup} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Call Tracker</h2>
          {/* Rest of the popup content */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">{customer ? 'Customer:' : 'Lead:'}</span>
              <span className="text-gray-900">{customer?.name || lead?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="text-gray-900">{customer?.phone || lead?.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Timer:</span>
              <span className="text-2xl font-mono text-blue-600">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assumption</label>
            <select
              value={selectedAssumption}
              onChange={(e) => {
                if (e.target.value === 'create-new') {
                  setCurrentDropdown('assumption');
                  setShowCreateAssumptionModal(true);
                } else {
                  setSelectedAssumption(e.target.value);
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an assumption...</option>
              {assumptions?.map(assumption => (
                <option key={assumption.id} value={assumption.id}>
                  {assumption.name}
                </option>
              ))}
              <option value="create-new" className="text-blue-600 font-medium">+ Create new assumption</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assumption 2</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedAssumption2}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'create-new') {
                    setCurrentDropdown('assumption2');
                    setShowCreateAssumptionModal(true);
                  } else {
                    setSelectedAssumption2(value);
                  }
                }}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an assumption...</option>
                {assumptions2?.map(assumption => (
                  <option key={assumption.id} value={assumption.id}>
                    {assumption.name}
                  </option>
                ))}
                <option value="create-new" className="text-blue-600 font-medium">+ Create new assumption</option>
              </select>
              <button
                onClick={() => {
                  if (selectedAssumption2) {
                    const assumption = assumptions2.find(a => a.id == selectedAssumption2);
                    if (assumption) {
                      startEditingAssumption(assumption, 'assumption2');
                      setShowManageAssumptionsModal(true);
                    }
                  }
                }}
                disabled={!selectedAssumption2}
                className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                title="Edit assumption"
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  if (selectedAssumption2) {
                    setCurrentDropdown('assumption2');
                    deleteAssumption(selectedAssumption2);
                  }
                }}
                disabled={!selectedAssumption2}
                className="p-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                title="Delete assumption"
              >
                🗑️
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assumption 3</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedAssumption3}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'create-new') {
                    setCurrentDropdown('assumption3');
                    setShowCreateAssumptionModal(true);
                  } else {
                    setSelectedAssumption3(value);
                  }
                }}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an assumption...</option>
                {assumptions3?.map(assumption => (
                  <option key={assumption.id} value={assumption.id}>
                    {assumption.name}
                  </option>
                ))}
                <option value="create-new" className="text-blue-600 font-medium">+ Create new assumption</option>
              </select>
              <button
                onClick={() => {
                  if (selectedAssumption3) {
                    const assumption = assumptions3.find(a => a.id == selectedAssumption3);
                    if (assumption) {
                      startEditingAssumption(assumption, 'assumption3');
                      setShowManageAssumptionsModal(true);
                    }
                  }
                }}
                disabled={!selectedAssumption3}
                className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                title="Edit assumption"
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  if (selectedAssumption3) {
                    setCurrentDropdown('assumption3');
                    deleteAssumption(selectedAssumption3);
                  }
                }}
                disabled={!selectedAssumption3}
                className="p-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                title="Delete assumption"
              >
                🗑️
              </button>
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
          <div className="flex flex-wrap gap-3 mb-4">
            {!isRunning ? (
              <button onClick={startTimer} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">Start Call</button>
            ) : (
              <button onClick={stopTimer} className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">Pause Call</button>
            )}
            <button onClick={endCall} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">End Call</button>
            {customer && <button onClick={placeOrder} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">Place Order</button>}
            {lead && <button onClick={convertToCustomer} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">Convert to Customer</button>}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => setShowManageAssumptionsModal(true)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Manage Assumptions
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default CallPopup;
