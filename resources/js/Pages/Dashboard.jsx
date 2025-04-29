import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { 
    Box, 
    Heading, 
    Text,
    SimpleGrid,
    Flex,
    Card,
    Icon,
    Button
} from "@chakra-ui/react";

export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <Box py="12">
                <Box mx="auto" maxW="7xl" px={{ base: "6", lg: "8" }}>
                    {/* Welcome Header */}
                    <Box mb="8" textAlign="center">
                        <Heading as="h1" size="xl" fontWeight="bold" color="gray.900">Welcome to ContentFlow</Heading>
                        <Text mt="2" fontSize="xl" color="gray.600">Manage your multimedia content efficiently with AI-powered tools.</Text>
                    </Box>

                    {/* Main Dashboard Grid */}
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing="8">
                        {/* Card 1: Content Management */}
                        <Card.Root overflow="hidden" shadow="xl" rounded="lg" _hover={{ transform: 'scale(1.05)', shadow: '2xl' }} transition="all 0.3s">
                            <Card.Body p="6">
                                <Flex align="center" justify="center" w="12" h="12" mb="4" bg="red.100" rounded="full">
                                    <Icon viewBox="0 0 24 24" w="6" h="6" color="red.600">
                                        <path 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth="2" 
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </Icon>
                                </Flex>
                                <Heading as="h3" size="md" fontWeight="semibold" color="gray.800">Content Management</Heading>
                                <Text mt="2" fontSize="sm" color="gray.600">
                                    Organize, edit, and schedule your multimedia content.
                                </Text>
                                <Box as={Link} 
                                    href="/manage-content"
                                    mt="4" 
                                    display="block" 
                                    w="full" 
                                    textAlign="center" 
                                    px="6" 
                                    py="3" 
                                    bg="red.600" 
                                    color="white" 
                                    rounded="lg" 
                                    _hover={{ bg: "red.700" }}
                                    transition="background 0.3s"
                                >
                                    Manage Content
                                </Box>
                            </Card.Body>
                        </Card.Root>

                        {/* Card 2: Schedule Posts */}
                        <Card.Root overflow="hidden" shadow="xl" rounded="lg" _hover={{ transform: 'scale(1.05)', shadow: '2xl' }} transition="all 0.3s">
                            <Card.Body p="6">
                                <Flex align="center" justify="center" w="12" h="12" mb="4" bg="red.100" rounded="full">
                                    <Icon viewBox="0 0 24 24" w="6" h="6" color="red.600">
                                        <path 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth="2" 
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </Icon>
                                </Flex>
                                <Heading as="h3" size="md" fontWeight="semibold" color="gray.800">Schedule Posts</Heading>
                                <Text mt="2" fontSize="sm" color="gray.600">
                                    Plan and schedule your social media posts with ease.
                                </Text>
                                <Box as={Link} 
                                    href="/schedule"
                                    mt="4" 
                                    display="block" 
                                    w="full" 
                                    textAlign="center" 
                                    px="6" 
                                    py="3" 
                                    bg="red.600" 
                                    color="white" 
                                    rounded="lg" 
                                    _hover={{ bg: "red.700" }}
                                    transition="background 0.3s"
                                >
                                    Schedule Now
                                </Box>
                            </Card.Body>
                        </Card.Root>

                        {/* Card 3: Analytics */}
                        <Card.Root overflow="hidden" shadow="xl" rounded="lg" _hover={{ transform: 'scale(1.05)', shadow: '2xl' }} transition="all 0.3s">
                            <Card.Body p="6">
                                <Flex align="center" justify="center" w="12" h="12" mb="4" bg="red.100" rounded="full">
                                    <Icon viewBox="0 0 24 24" w="6" h="6" color="red.600">
                                        <path 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth="2" 
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </Icon>
                                </Flex>
                                <Heading as="h3" size="md" fontWeight="semibold" color="gray.800">Analytics</Heading>
                                <Text mt="2" fontSize="sm" color="gray.600">
                                    Track engagement and performance metrics.
                                </Text>
                                <Box as={Link} 
                                    href="/analytics"
                                    mt="4" 
                                    display="block" 
                                    w="full" 
                                    textAlign="center" 
                                    px="6" 
                                    py="3" 
                                    bg="red.600" 
                                    color="white" 
                                    rounded="lg" 
                                    _hover={{ bg: "red.700" }}
                                    transition="background 0.3s"
                                >
                                    View Analytics
                                </Box>
                            </Card.Body>
                        </Card.Root>

                        {/* Card 4: AI Chat */}
                        <Card.Root overflow="hidden" shadow="xl" rounded="lg" _hover={{ transform: 'scale(1.05)', shadow: '2xl' }} transition="all 0.3s">
                            <Card.Body p="6">
                                <Flex align="center" justify="center" w="12" h="12" mb="4" bg="red.100" rounded="full">
                                    <Icon viewBox="0 0 24 24" w="6" h="6" color="red.600">
                                        <path 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth="2" 
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </Icon>
                                </Flex>
                                <Heading as="h3" size="md" fontWeight="semibold" color="gray.800">AI Chat</Heading>
                                <Text mt="2" fontSize="sm" color="gray.600">
                                    Get real-time recommendations and support from our AI.
                                </Text>
                                <Box as={Link} 
                                    href="/ai-chat"
                                    mt="4" 
                                    display="block" 
                                    w="full" 
                                    textAlign="center" 
                                    px="6" 
                                    py="3" 
                                    bg="red.600" 
                                    color="white" 
                                    rounded="lg" 
                                    _hover={{ bg: "red.700" }}
                                    transition="background 0.3s"
                                >
                                    Chat Now
                                </Box>
                            </Card.Body>
                        </Card.Root>
                    </SimpleGrid>

                    {/* Quick Actions Section */}
                    <Box mt="8">
                        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing="6">
                            {/* Quick Action 1: Upload Content */}
                            <Card.Root overflow="hidden" shadow="xl" rounded="lg" _hover={{ transform: 'scale(1.05)', shadow: '2xl' }} transition="all 0.3s">
                                <Card.Body p="6">
                                    <Button w="full" py="3" bg="red.600" color="white" rounded="lg" _hover={{ bg: "red.700" }} transition="background 0.3s">
                                        Upload Content
                                    </Button>
                                </Card.Body>
                            </Card.Root>

                            {/* Quick Action 2: Create Campaign */}
                            <Card.Root overflow="hidden" shadow="xl" rounded="lg" _hover={{ transform: 'scale(1.05)', shadow: '2xl' }} transition="all 0.3s">
                                <Card.Body p="6">
                                    <Button w="full" py="3" bg="red.600" color="white" rounded="lg" _hover={{ bg: "red.700" }} transition="background 0.3s">
                                        Create Campaign
                                    </Button>
                                </Card.Body>
                            </Card.Root>

                            {/* Quick Action 3: Team Collaboration */}
                            <Card.Root overflow="hidden" shadow="xl" rounded="lg" _hover={{ transform: 'scale(1.05)', shadow: '2xl' }} transition="all 0.3s">
                                <Card.Body p="6">
                                    <Button w="full" py="3" bg="red.600" color="white" rounded="lg" _hover={{ bg: "red.700" }} transition="background 0.3s">
                                        Team Collaboration
                                    </Button>
                                </Card.Body>
                            </Card.Root>

                            {/* Quick Action 4: Settings */}
                            <Card.Root overflow="hidden" shadow="xl" rounded="lg" _hover={{ transform: 'scale(1.05)', shadow: '2xl' }} transition="all 0.3s">
                                <Card.Body p="6">
                                    <Button w="full" py="3" bg="red.600" color="white" rounded="lg" _hover={{ bg: "red.700" }} transition="background 0.3s">
                                        Settings
                                    </Button>
                                </Card.Body>
                            </Card.Root>
                        </SimpleGrid>
                    </Box>
                </Box>
            </Box>
        </AuthenticatedLayout>
    );
}