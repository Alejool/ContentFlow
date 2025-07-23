import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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

// Minimalist SVG Icons
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

// Minimalist Metric Card
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

// Custom Chart Component
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
              <Select.ValueText placeholder="Period" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item item="7d">Last 7 days</Select.Item>
              <Select.Item item="30d">Last 30 days</Select.Item>
              <Select.Item item="90d">Last 90 days</Select.Item>
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

export default function Index() {
  const [timeRange, setTimeRange] = useState('30d');
  
  // Metric Data
  const analyticsData = [
    {
      id: 1,
      metric: 'Engagement Rate',
      value: '8.5%',
      change: '+2.3%',
      icon: 'stats',
      color: 'red'
    },
    {
      id: 2,
      metric: 'Impressions',
      value: '1.2M',
      change: '+15%',
      icon: 'eye',
      color: 'blue'
    },
    {
      id: 3,
      metric: 'Clicks',
      value: '45K',
      change: '+10%',
      icon: 'click',
      color: 'green'
    },
    {
      id: 4,
      metric: 'Shares',
      value: '12K',
      change: '+5%',
      icon: 'share',
      color: 'purple'
    },
  ];

  // Example data for the chart
  const engagementData = [
    { date: 'Jan 1', engagement: 4.2 },
    { date: 'Jan 5', engagement: 5.1 },
    { date: 'Jan 10', engagement: 4.8 },
    { date: 'Jan 15', engagement: 6.3 },
    { date: 'Jan 20', engagement: 7.2 },
    { date: 'Jan 25', engagement: 8.1 },
    { date: 'Jan 30', engagement: 8.5 },
    { date: 'Feb 5', engagement: 9.2 },
    { date: 'Feb 10', engagement: 8.8 },
    { date: 'Feb 15', engagement: 9.5 },
    { date: 'Feb 20', engagement: 10.1 },
    { date: 'Feb 25', engagement: 9.8 },
    { date: 'Today', engagement: 11.2 },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Analytics" />

      <Box minH="100vh" py={6}>
        <Container maxW="6xl">
          {/* Minimalist Header */}
          <Stack gap={6} mb={8}>
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "start", md: "center" }}
              gap={4}
            >
              <Box>
                <Heading
                  fontSize={{ base: "4xl", md: "5xl" }}
                  fontWeight="800"
                  size={{ base: "4xl" }}
                  textAlign={{ base: "center" }}
                  bgGradient="to-r"
                  height="60px"
                  gradientFrom="red.500"
                  gradientTo="orange.700"
                //   className="h-[400px] "
                  bgClip="text"
                >
                  Analytics
                </Heading>
                <Text color="gray.600" mt={6} fontSize="lg">
                  Real-time performance and engagement metrics
                </Text>
              </Box>

              <Badge
                colorScheme="green"
                variant="subtle"
                px={3}
                py={1}
                rounded="full"
              >
                Data updated
              </Badge>
            </Flex>
          </Stack>

          {/* Main Metrics */}
          <Grid
            templateColumns={{
              base: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            }}
            gap={6}
            mb={8}
          >
            {analyticsData.map((data) => (
              <MetricCard
                key={data.id}
                metric={data.metric}
                value={data.value}
                change={data.change}
                icon={data.icon}
                color={data.color}
              />
            ))}
          </Grid>

          {/* Engagement Chart */}
          <EngagementChart data={engagementData} timeRange={timeRange} />

          {/* Additional Metrics */}
          <Grid
            templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}
            gap={6}
            mt={8}
          >
            {/* Performance Summary */}
            <Card.Root
              bg="white"
              shadow="sm"
              border="1px"
              borderColor="gray.100"
            >
              <Card.Body p={6}>
                <Flex align="center" gap={3} mb={6}>
                  <Box p={2} bg="green.100" rounded="lg" color="green.600">
                    <Icon type="trending" size={20} />
                  </Box>
                  <Heading size="lg" color="gray.800">
                    Monthly Summary
                  </Heading>
                </Flex>

                <Stack gap={4}>
                  <Flex justify="space-between" align="center">
                    <Text color="gray.600">Best day</Text>
                    <Text fontWeight="bold" color="gray.800">
                      Friday
                    </Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text color="gray.600">Peak time</Text>
                    <Text fontWeight="bold" color="gray.800">
                      2:00 PM
                    </Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text color="gray.600">Growth</Text>
                    <Badge colorScheme="green" variant="subtle">
                      +23%
                    </Badge>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text color="gray.600">Total reach</Text>
                    <Text fontWeight="bold" color="gray.800">
                      2.8M
                    </Text>
                  </Flex>
                </Stack>
              </Card.Body>
            </Card.Root>

            {/* Top Content */}
            <Card.Root
              bg="white"
              shadow="sm"
              border="1px"
              borderColor="gray.100"
            >
              <Card.Body p={6}>
                <Flex align="center" gap={3} mb={6}>
                  <Box p={2} bg="purple.100" rounded="lg" color="purple.600">
                    <Icon type="stats" size={20} />
                  </Box>
                  <Heading size="lg" color="gray.800">
                    Top Content
                  </Heading>
                </Flex>

                <Stack gap={4}>
                  {[
                    { title: "Summer Campaign", engagement: "12.3%" },
                    { title: "New Product", engagement: "9.8%" },
                    { title: "Behind the Scenes", engagement: "8.5%" },
                    { title: "Quick Tutorial", engagement: "7.2%" },
                  ].map((item, index) => (
                    <Flex key={index} justify="space-between" align="center">
                      <Text color="gray.700" fontSize="sm">
                        {item.title}
                      </Text>
                      <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                        {item.engagement}
                      </Badge>
                    </Flex>
                  ))}
                </Stack>
              </Card.Body>
            </Card.Root>
          </Grid>
        </Container>
      </Box>
    </AuthenticatedLayout>
  );
}