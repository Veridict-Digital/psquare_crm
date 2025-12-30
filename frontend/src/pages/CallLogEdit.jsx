import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

const CallLogEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: callLog, isLoading, error } = useQuery({
    queryKey: ['callLog', id],
    queryFn: async () => {
      const response = await axios.get(`/api/calllogs/${id}/`);
      return response.data;
    },
  });

  const [formData, setFormData] = useState({
    customer: '',
    duration: '',
    note: '',
    status: '',
  });

  useEffect(() => {
    if (callLog) {
      setFormData({
        customer: callLog.customer || '',
        duration: callLog.duration || '',
        note: callLog.note || '',
        status: callLog.status || '',
      });
    }
  }, [callLog]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.put(`/api/calllogs/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calllogs']);
      navigate('/calllogs');
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-500 text-center">Error loading call log: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Call Log</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Customer ID</label>
          <input
            type="text"
            name="customer"
            value={formData.customer}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Duration</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="e.g., 00:05:30"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Note</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <input
            type="text"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? 'Updating...' : 'Update Call Log'}
        </button>
      </form>
    </div>
  );
};

export default CallLogEdit;
