import React, { useState, useRef, useEffect } from 'react';
import { useCallPopup } from '../context/CallPopupContext';

const CallPopup = () => {
  const {
    isVisible,
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
    currentDropdown,
    setCurrentDropdown,
  } = useCallPopup();

  if (!isVisible && !isEmbedded) return null;

  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const popupRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isResizing) {
        const newWidth = Math.max(300, e.clientX - position.x);
        const newHeight = Math.max(400, e.clientY - position.y);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle') && !e.target.closest('button')) {
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  if (isEmbedded) {
    return (
      <>
        <div
          ref={popupRef}
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
          }}
        >
          {/* Drag Handle */}
          <div className="drag-handle bg-gray-100 px-4 py-2 cursor-move border-b border-gray-200 flex items-center justify-between" onMouseDown={handleMouseDown}>
            <h2 className="text-lg font-bold text-gray-800">Call Tracker</h2>
            <button onClick={hidePopup} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
          </div>

          {/* Scrollable Content */}
          <div className="p-2 overflow-y-auto h-full">
          {/* Rest of the popup content */}
          <div className="">
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
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">Assumption</label>
            <div className="flex items-center gap-2">
              <select
                multiple
                value={selectedAssumption}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedAssumption(values);
                }}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size="3"
              >
                {assumptions?.map(assumption => (
                  <option key={assumption.id} value={assumption.id}>
                    {assumption.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setCurrentDropdown('assumption');
                  setShowCreateAssumptionModal(true);
                }}
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                title="Create new assumption"
              >
                +
              </button>
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assumption 2</label>
            <div className="flex items-center gap-2">
              <select
                multiple
                value={selectedAssumption2}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedAssumption2(values);
                }}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size="3"
              >
                {assumptions2?.map(assumption => (
                  <option key={assumption.id} value={assumption.id}>
                    {assumption.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setCurrentDropdown('assumption2');
                  setShowCreateAssumptionModal(true);
                }}
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                title="Create new assumption"
              >
                +
              </button>
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assumption 3</label>
            <div className="flex items-center gap-2">
              <select
                multiple
                value={selectedAssumption3}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedAssumption3(values);
                }}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                size="3"
              >
                {assumptions3?.map(assumption => (
                  <option key={assumption.id} value={assumption.id}>
                    {assumption.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setCurrentDropdown('assumption3');
                  setShowCreateAssumptionModal(true);
                }}
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                title="Create new assumption"
              >
                +
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

          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400"
            onMouseDown={handleResizeMouseDown}
          />
        </div>

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
      </>
    );
  }

    // Floating popup
    return (
      <>
        <div
          ref={popupRef}
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
          }}
        >
          {/* Drag Handle */}
          <div className="drag-handle bg-gray-100 px-4 py-2 cursor-move border-b border-gray-200 flex items-center justify-between" onMouseDown={handleMouseDown}>
            <h2 className="text-lg font-bold text-gray-800">Call Tracker</h2>
            <button onClick={hidePopup} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
          </div>

          {/* Scrollable Content */}
          <div className="p-4 overflow-y-auto h-full pb-16">
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
              <div className="flex items-center gap-2">
                <select
                  multiple
                  value={selectedAssumption}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedAssumption(values);
                  }}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  size="3"
                >
                  {assumptions?.map(assumption => (
                    <option key={assumption.id} value={assumption.id}>
                      {assumption.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setCurrentDropdown('assumption');
                    setShowCreateAssumptionModal(true);
                  }}
                  className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="Create new assumption"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Call Status</label>
              <div className="flex items-center gap-2">
                <select
                  multiple
                  value={selectedAssumption2}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedAssumption2(values);
                  }}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  size="3"
                >
                  {assumptions2?.map(assumption => (
                    <option key={assumption.id} value={assumption.id}>
                      {assumption.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setCurrentDropdown('assumption2');
                    setShowCreateAssumptionModal(true);
                  }}
                  className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="Create new assumption"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <div className="flex items-center gap-2">
                <select
                  multiple
                  value={selectedAssumption3}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedAssumption3(values);
                  }}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  size="3"
                >
                  {assumptions3?.map(assumption => (
                    <option key={assumption.id} value={assumption.id}>
                      {assumption.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setCurrentDropdown('assumption3');
                    setShowCreateAssumptionModal(true);
                  }}
                  className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="Create new assumption"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="1"
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

          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400"
            onMouseDown={handleResizeMouseDown}
          />
        </div>

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
      </>
    );
  };

export default CallPopup;
