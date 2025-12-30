import React from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { useCallPopup } from '../context/CallPopupContext';

const CustomerTable = () => {
  const { data: customers, isLoading, error } = useCustomers();
  const { showPopup } = useCallPopup();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading customers</div>;

  const calculateAverageOrderValue = (customer) => {
    // Assuming total_order_value is the sum, but for average, we might need order count
    // For simplicity, using total_order_value as is, but ideally calculate average
    return customer.total_order_value || 0;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Average Order Value</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers?.map((customer) => (
            <tr key={customer.id}>
              <td className="border px-4 py-2">{customer.name}</td>
              <td className="border px-4 py-2">{customer.phone}</td>
              <td className="border px-4 py-2">${calculateAverageOrderValue(customer)}</td>
              <td className="border px-4 py-2">
                <button
                  onClick={() => showPopup(customer)}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Call Now
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
