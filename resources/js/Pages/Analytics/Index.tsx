import React from 'react'; // Imported React
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.tsx';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  Card,
  Badge,
  Stack,
  Flex,
  Stat,
  Select,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// Iconos SVG minimalistas
const Icon = ({ type, size = 20, className = "" }) => {
  const icons = {
    trending: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <polyline points="22,6 13.5,15.5 8.5,10.5 1,18" />
        <polyline points="22,6 18,6 18,10" />
      </svg>
    ),
    stats: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
    eye: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    click: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
      </svg>
    ),
    share: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16,6 12,2 8,6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    ),
  };

  return <Box as="span" display="inline-flex" alignItems="center">{icons[type]}</Box>;
};

// Componente de métrica minimalista
const MetricCard = ({ metric, value, change, icon, color = "red" }) => {
  const isPositive = change.startsWith('+');
  
  return (
    <Card.Root 
      bg="white" 
      shadow="sm" 
      border="1px" 
      borderColor="gray.100"
      transition="all 0.2s"
      _hover={{ shadow: "md", transform: "translateY(-1px)" }}
    >
      <Card.Body p={6}>
        <Flex justify="space-between" align="start" mb={4}>
          <Box p={2} bg={`${color}.100`} rounded="lg" color={`${color}.600`}>
            <Icon type={icon} size={20} />
          </Box>
          <Badge 
            colorScheme={isPositive ? "green" : "red"} 
            variant="subtle" 
            rounded="full"
            fontSize="xs"
          >
            {change}
          </Badge>
        </Flex>
        
        <Stack gap={1}>
          <Text fontSize="sm" color="gray.600" fontWeight="500">
            {metric}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            {value}
          </Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
};

// Componente de gráfica personalizada
const EngagementChart = ({ data, timeRange }) => {
  return (
    <Card.Root bg="white" shadow="sm" border="1px" borderColor="gray.100">
      <Card.Body p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Flex align="center" gap={3}>
            <Box p={2} bg="blue.100" rounded="lg" color="blue.600">
              <Icon type="trending" size={20} />
            </Box>
            <Heading size="lg" color="gray.800">Engagement Over Time</Heading>
          </Flex>
          
          <Select.Root size="sm" width="150px" defaultValue={timeRange}>
            <Select.Trigger>
              <Select.ValueText placeholder="Período" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item item="7d">Últimos 7 días</Select.Item>
              <Select.Item item="30d">Últimos 30 días</Select.Item>
              <Select.Item item="90d">Últimos 90 días</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
        
        <Box h="300px">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#E53E3E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="engagement" 
                stroke="#E53E3E" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorEngagement)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Card.Body>
    </Card.Root>
  );
};
