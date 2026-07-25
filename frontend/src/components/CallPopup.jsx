import React, { useState, useRef, useEffect } from 'react';
import { useCallPopup } from '../context/CallPopupContext';
import { Phone, Minimize2, Maximize2 } from 'lucide-react';

const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = phone.toString().replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  return phone;
};

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
    saveInfo,
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
    isEditingLastCall,
    isEndingCall,
    isMinimized,
    setIsMinimized
  } = useCallPopup();

  if (!isVisible && !isEmbedded) return null;

  const [position, setPosition] = useState({ x: 1400, y: 350 });
  const [size, setSize] = useState({ width: 600, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const popupRef = useRef(null);
  const embeddedNotesRef = useRef(null);
  const floatingNotesRef = useRef(null);
  const [isCallStatusOpen, setIsCallStatusOpen] = useState(false);
  const [isPaymentStatusOpen, setIsPaymentStatusOpen] = useState(false);
  const [isAssumptionOpen, setIsAssumptionOpen] = useState(false);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isResizing) {
        const newWidth = Math.max(400, e.clientX - position.x);
        const newHeight = Math.max(450, e.clientY - position.y);
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

  useEffect(() => {
    if (embeddedNotesRef.current) {
      embeddedNotesRef.current.style.height = 'auto';
      embeddedNotesRef.current.style.height = `${embeddedNotesRef.current.scrollHeight}px`;
    }
  }, [notes, isVisible, isEmbedded]);

  useEffect(() => {
    if (floatingNotesRef.current) {
      floatingNotesRef.current.style.height = 'auto';
      floatingNotesRef.current.style.height = `${floatingNotesRef.current.scrollHeight}px`;
    }
  }, [notes, isVisible, isEmbedded]);

  useEffect(() => {
    if (isVisible && !isMinimized) {
      const focusTimer = setTimeout(() => {
        if (isEmbedded && embeddedNotesRef.current) {
          embeddedNotesRef.current.focus();
        } else if (!isEmbedded && floatingNotesRef.current) {
          floatingNotesRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(focusTimer);
    }
  }, [isVisible, isMinimized, isEmbedded]);

  const handleMouseDown = (e) => {
    if ((e.target.closest('.drag-handle') && !e.target.closest('button')) || e.target.closest('.minimized-icon')) {
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
            <div className="flex items-center gap-2">
              <button onClick={toggleMinimize} className="text-gray-400 hover:text-gray-600 text-lg">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={hidePopup} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-2 overflow-y-auto h-full">
            {/* Rest of the popup content */}
             <div className="">
               <div className="flex justify-between items-center font-mono">
                 <span className="text-gray-900">{customer?.name || lead?.name} - {formatPhoneNumber(customer?.phone || lead?.phone)}</span>
                 <span className="font-medium text-gray-700">Timer:</span>
                 <span className="text-2xl font-mono text-blue-600">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
               </div>
             </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assumption</label>
              <div className="flex flex-wrap gap-2">
                {assumptions?.map(assumption => (
                  <label key={assumption.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selectedAssumption.includes(assumption.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssumption([...selectedAssumption, assumption.id]);
                        } else {
                          setSelectedAssumption(selectedAssumption.filter(id => id !== assumption.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{assumption.name}</span>
                  </label>
                ))}
                <button
                  onClick={() => {
                    setCurrentDropdown('assumption');
                    setShowCreateAssumptionModal(true);
                  }}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                  title="Create new assumption"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assumption 2</label>
              <div className="flex flex-wrap gap-2">
                {assumptions2?.map(assumption => (
                  <label key={assumption.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selectedAssumption2.includes(assumption.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssumption2([...selectedAssumption2, assumption.id]);
                        } else {
                          setSelectedAssumption2(selectedAssumption2.filter(id => id !== assumption.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{assumption.name}</span>
                  </label>
                ))}
                <button
                  onClick={() => {
                    setCurrentDropdown('assumption2');
                    setShowCreateAssumptionModal(true);
                  }}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                  title="Create new assumption"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assumption 3</label>
              <div className="flex flex-wrap gap-2">
                {assumptions3?.map(assumption => (
                  <label key={assumption.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selectedAssumption3.includes(assumption.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssumption3([...selectedAssumption3, assumption.id]);
                        } else {
                          setSelectedAssumption3(selectedAssumption3.filter(id => id !== assumption.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{assumption.name}</span>
                  </label>
                ))}
                <button
                  onClick={() => {
                    setCurrentDropdown('assumption3');
                    setShowCreateAssumptionModal(true);
                  }}
                  className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                  title="Create new assumption"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                ref={embeddedNotesRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden"
                rows="8"
                placeholder="Add notes about the call..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {(!isRunning && !isEndingCall) ? (
                <button onClick={startTimer} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-shrink-0">Start Call</button>
              ) : (
                <>
                  <button
                    onClick={endCall}
                    disabled={isEndingCall}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEndingCall ? "Ending..." : "End Call"}
                  </button>
                </>
              )}
              {isEditingLastCall && (
                <button onClick={() => { console.log('Save Info button clicked'); saveInfo(true); }} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-shrink-0">Save Info</button>
              )}
              {customer && <button onClick={placeOrder} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-shrink-0">Place Order</button>}
              {lead && <button onClick={convertToCustomer} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex-shrink-0">Convert to Customer</button>}

              {/* Embedded Order ID Input side by side with the buttons */}
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="flex-1 min-w-[150px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-sm text-gray-800"
                placeholder="Order ID..."
              />
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
      {isMinimized ? (
        <div
          className="fixed bg-blue-600 rounded-full shadow-lg border border-gray-200 z-50 cursor-pointer hover:bg-blue-700 transition-colors minimized-icon"
          style={{
            left: position.x,
            top: position.y,
            width: 48,
            height: 48,
          }}
          onMouseDown={handleMouseDown}
          onClick={toggleMinimize}
          title="Restore Call Tracker"
        >
          <div className="w-full h-full flex items-center justify-center">
            <Phone className="w-6 h-6 text-white" />
          </div>
        </div>
      ) : (
        <div
          ref={popupRef}
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col"
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
          }}
        >
          {/* Drag Handle */}
          <div className="drag-handle bg-gray-100 px-4 py-2 cursor-move border-b border-gray-200 flex items-center justify-between flex-shrink-0" onMouseDown={handleMouseDown}>
            <h2 className="text-lg font-bold text-gray-800">Call Tracker</h2>
            <div className="flex items-center gap-2">
              <button onClick={toggleMinimize} className="text-gray-400 hover:text-gray-600 text-lg">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={hidePopup} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>
          </div>

          {/* Frozen / Sticky Call Tracker Header & Controls Section */}
          <div>
            <div className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
              {/* Left: Avatar & Name/Phone */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-white font-bold text-xs">
                    {(customer?.name?.[0] || lead?.name?.[0] || 'C').toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-xs truncate leading-tight">
                    {customer?.name || lead?.name}
                  </h3>
                  <p className="text-gray-500 text-[10px] truncate leading-normal font-mono">
                    {formatPhoneNumber(customer?.phone || lead?.phone)}
                  </p>
                </div>
              </div>

              {/* Middle: Controls (Start/End/Save, Order, Order ID input) */}
              <div className="flex items-center gap-1.5 flex-1 max-w-xl min-w-0">
                {!isEditingLastCall && (
                  <>
                     {(!isRunning && !isEndingCall) ? (
                      <button
                        onClick={startTimer}
                        className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-2 py-1.5 rounded text-[10px] font-bold transition-all duration-200 shadow-sm flex-shrink-0 uppercase"
                      >
                        Start
                      </button>
                    ) : (
                      <button
                        onClick={endCall}
                        disabled={isEndingCall}
                        className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-2 py-1.5 rounded text-[10px] font-bold transition-all duration-200 shadow-sm flex-shrink-0 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isEndingCall ? "Ending..." : "End"}
                      </button>
                    )}
                  </>
                )}
                {isEditingLastCall && (
                  <button
                    onClick={() => { console.log('Save Info button clicked (floating)'); saveInfo(true); }}
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-2 py-1.5 rounded text-[10px] font-bold transition-all duration-200 shadow-sm flex-shrink-0 uppercase"
                  >
                    Save Info
                  </button>
                )}
                {/* {customer && (
                  <button
                    onClick={placeOrder}
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-2 py-1.5 rounded text-[10px] font-bold transition-all duration-200 shadow-sm flex-shrink-0 uppercase"
                  >
                    Order
                  </button>
                )} */}

                {/* Order ID Input */}
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="flex-1 min-w-[80px] max-w-[160px] px-2 py-1.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 h-7 font-medium"
                  placeholder="Order ID..."
                />
              </div>

              {/* Right: Duration */}
              <div className="flex flex-col items-end flex-shrink-0 bg-blue-50/60 border border-blue-100/50 rounded px-2 py-1">
                <span className="text-[9px] uppercase tracking-wider font-bold text-blue-500 leading-none mb-0.5">Duration</span>
                <span className="text-sm font-mono font-black text-blue-700 leading-none">
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Content Section */}
          <div className="p-3 overflow-y-auto flex-1 pb-2">

            {/* Assumption Section */}
            <div className="mb-2">
              <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
                <button
                  onClick={() => setIsAssumptionOpen(!isAssumptionOpen)}
                  className="w-full px-3 py-1.5 bg-gradient-to-r from-blue-50/60 to-blue-50/30 border-b border-gray-100 flex items-center justify-between hover:bg-blue-50/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-3.5 bg-blue-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-800 text-xs uppercase tracking-wide">Assumption</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {selectedAssumption?.length || 0}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isAssumptionOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isAssumptionOpen && (
                  <div className="p-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-1 max-h-20 overflow-y-auto pr-1">
                      {assumptions?.map(assumption => (
                        <label
                          key={assumption.id}
                          className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssumption.includes(assumption.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssumption([...selectedAssumption, assumption.id]);
                              } else {
                                setSelectedAssumption(selectedAssumption.filter(id => id !== assumption.id));
                              }
                            }}
                            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700 truncate">{assumption.name}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setCurrentDropdown('assumption');
                        setShowCreateAssumptionModal(true);
                      }}
                      className="w-full mt-1.5 text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded border border-blue-100 font-medium transition-colors"
                    >
                      + New Assumption
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Call Status Accordion */}
            <div className="mb-2">
              <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
                <button
                  onClick={() => setIsCallStatusOpen(!isCallStatusOpen)}
                  className="w-full px-3 py-1.5 bg-gradient-to-r from-green-50/60 to-green-50/30 border-b border-gray-100 flex items-center justify-between hover:bg-green-50/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-3.5 bg-green-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-800 text-xs uppercase tracking-wide">Call Status</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                      {selectedAssumption2?.length || 0}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isCallStatusOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isCallStatusOpen && (
                  <div className="p-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-1 max-h-20 overflow-y-auto pr-1">
                      {assumptions2?.map(assumption => (
                        <label
                          key={assumption.id}
                          className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssumption2.includes(assumption.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssumption2([...selectedAssumption2, assumption.id]);
                              } else {
                                setSelectedAssumption2(selectedAssumption2.filter(id => id !== assumption.id));
                              }
                            }}
                            className="w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-xs text-gray-700 truncate">{assumption.name}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setCurrentDropdown('assumption2');
                        setShowCreateAssumptionModal(true);
                      }}
                      className="w-full mt-1.5 text-xs px-2 py-1 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 rounded border border-green-100 font-medium transition-colors"
                    >
                      + New Call Status
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Status Accordion */}
            <div className="mb-3">
              <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
                <button
                  onClick={() => setIsPaymentStatusOpen(!isPaymentStatusOpen)}
                  className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-50/60 to-purple-50/30 border-b border-gray-100 flex items-center justify-between hover:bg-purple-50/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-3.5 bg-purple-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-800 text-xs uppercase tracking-wide">Payment Status</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      {selectedAssumption3?.length || 0}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isPaymentStatusOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isPaymentStatusOpen && (
                  <div className="p-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-1 max-h-20 overflow-y-auto pr-1">
                      {assumptions3?.map(assumption => (
                        <label
                          key={assumption.id}
                          className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssumption3.includes(assumption.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAssumption3([...selectedAssumption3, assumption.id]);
                              } else {
                                setSelectedAssumption3(selectedAssumption3.filter(id => id !== assumption.id));
                              }
                            }}
                            className="w-3 h-3 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-xs text-gray-700 truncate">{assumption.name}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setCurrentDropdown('assumption3');
                        setShowCreateAssumptionModal(true);
                      }}
                      className="w-full mt-1.5 text-xs px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 rounded border border-purple-100 font-medium transition-colors"
                    >
                      + New Payment Status
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Notes */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Notes</label>
                <span className="text-xs text-gray-500">{notes.length}/200</span>
              </div>
              <textarea
                ref={floatingNotesRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 placeholder-gray-400 resize-none overflow-hidden"
                rows="10"
                placeholder="Call notes..."
              />
            </div>
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400"
            onMouseDown={handleResizeMouseDown}
          />
        </div>
      )}

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
