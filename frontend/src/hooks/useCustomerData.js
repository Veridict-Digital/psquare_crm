import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';

export const useCustomerData = (viewType, dateFrom, dateTo, contactType) => {
  const queryClient = useQueryClient();

  // Data fetching - only fetch what's needed based on viewType
  const customersQuery = useQuery({
    queryKey: ['customers', dateFrom, dateTo, contactType],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('contact_type', 'Customer');
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (contactType) params.append('contact_type', contactType);

      const response = await axios.get(`/api/customers/?${params.toString()}`);
      return response.data;
    },
    enabled: viewType === 'customers'
  });

  const leadsQuery = useQuery({
    queryKey: ['leads', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('contact_type', 'Lead');
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await axios.get(`/api/customers/?${params.toString()}`);
      return response.data;
    },
    enabled: viewType === 'leads'
  });

  const data = viewType === 'leads' ? leadsQuery.data : customersQuery.data;
  const isLoading = customersQuery.isLoading || leadsQuery.isLoading;
  const error = customersQuery.error || leadsQuery.error;

  // Mutations
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, appointment_date }) => {
      const response = await axios.patch(`/api/customers/${id}/`, { appointment_date });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['leads']);
    },
    onError: (error) => {
      console.error('Error updating appointment date:', error);
      alert('Failed to update appointment date');
    }
  });

  const updateTimeMutation = useMutation({
    mutationFn: async ({ id, appointment_time }) => {
      const response = await axios.patch(`/api/customers/${id}/`, { appointment_time });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['leads']);
    },
    onError: (error) => {
      console.error('Error updating appointment time:', error);
      alert('Failed to update appointment time');
    }
  });

  return {
    data,
    isLoading,
    error,
    updateAppointmentMutation,
    updateTimeMutation
  };
};

export const useCustomerFilters = (data, search, filterAgent, contactType, viewType) => {
  // Memoized calculations
  const agents = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map(customer => customer.agent_name).filter(Boolean))];
  }, [data]);

  const filteredCustomers = useMemo(() => {
    if (!data) return [];

    let filtered = data.filter(customer =>
      customer.name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.email?.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone?.includes(search) ||
      customer.id?.toString().includes(search)
    );

    if (filterAgent) {
      filtered = filtered.filter(customer => customer.agent_name === filterAgent);
    }

    if (contactType && viewType === 'customers') {
      filtered = filtered.filter(customer => customer.contact_type === 'Customer');
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.appointment_date || a.created_at);
      const dateB = new Date(b.appointment_date || b.created_at);
      return dateA - dateB;
    });
  }, [data, search, filterAgent, contactType, viewType]);

  return { agents, filteredCustomers };
};

export const useCustomerStats = (filteredCustomers) => {
  return useMemo(() => {
    const totalCustomers = filteredCustomers.length;
    const totalOrderValue = filteredCustomers.reduce((sum, customer) => sum + (customer.total_order_value || 0), 0);
    const activeAgents = new Set(filteredCustomers.map(customer => customer.agent_name).filter(Boolean)).size;
    const avgOrderValue = totalCustomers > 0 ? totalOrderValue / totalCustomers : 0;
    const customersWithOutstanding = filteredCustomers.filter(customer =>
      customer.contact_type === 'Customer' && customer.outstanding_amount && customer.outstanding_amount > 0
    ).length;

    return {
      totalCustomers,
      totalOrderValue,
      activeAgents,
      avgOrderValue,
      customersWithOutstanding
    };
  }, [filteredCustomers]);
};
