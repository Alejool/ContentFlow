import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DashboardCard from './Components/DashboardCard';
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
        <Box py="12" mt={5}>
          <Box mx="auto" maxW="1300px" px={{ base: "6", lg: "8" }}>
            {/* Welcome Header */}
            <Box mb="8" textAlign="center">
              <Heading
                as="h1"
                fontSize="5xl"
                mb="10"
                fontWeight="bold"
                color="gray.900"
              >
                Welcome to ContentFlow
              </Heading>
              <Text mt="2" fontSize="2xl" color="gray.600">
                Manage your multimedia content efficiently with AI-powered
                tools.
              </Text>
            </Box>

            {/* Main Dashboard Grid */}
            <SimpleGrid columns={{ base: 1, md:2, '2xl':4 }} spacing="8" gap="6">
              <DashboardCard
                title="Content Management"
                description="Organize, edit, and schedule your multimedia content."
                href="/manage-content"
                buttonText="Manage Content"
                icon="icon-[mdi--rolodex]"
              />
              <DashboardCard
                title="Schedule Posts"
                description="Plan and schedule your social media posts with ease."
                href="/schedule"
                buttonText="Schedule Now"
                icon="icon-[iconoir--post]"
              />
              <DashboardCard
                title="Analytics"
                description="Track engagement and performance metrics."
                href="/analytics"
                buttonText="View Analytics"
                icon="icon-[pixel--analytics]"
              />
              <DashboardCard
                title="AI Chat"
                description="Get real-time recommendations and support from our AI."
                href="/ai-chat"
                buttonText="Chat Now"
                icon="icon-[hugeicons--ai-beautify]"
              />
            </SimpleGrid>

            <Box mt={20}>
              <Heading
                as="h2"
                fontSize="6xl"
                fontWeight="bold"
                color="gray.900"
              >
                Quick Actions
              </Heading>
            </Box>

            {/* Quick Actions Section */}
            <Box mt={20}>
              <SimpleGrid
                columns={{ base: 1, sm: 2, lg: 4 }}
                gap="6"
                spacing="6"
              >
                {/* Quick Action 1: Upload Content */}
                <Card.Root
                  overflow="hidden"
                  shadow="xl"
                  rounded="lg"
                  _hover={{ transform: "scale(1.05)", shadow: "2xl" }}
                  transition="all 0.3s"
                >
                  <Card.Body p="6">
                    <Button
                      w="full"
                      py="3"
                      bg="red.600"
                      color="white"
                      rounded="lg"
                      _hover={{ bg: "red.700" }}
                      transition="background 0.3s"
                    >
                      Upload Content
                    </Button>
                  </Card.Body>
                </Card.Root>

                {/* Quick Action 2: Create Campaign */}
                <Card.Root
                  overflow="hidden"
                  shadow="xl"
                  rounded="lg"
                  _hover={{ transform: "scale(1.05)", shadow: "2xl" }}
                  transition="all 0.3s"
                >
                  <Card.Body p="6">
                    <Button
                      w="full"
                      py="3"
                      bg="red.600"
                      color="white"
                      rounded="lg"
                      _hover={{ bg: "red.700" }}
                      transition="background 0.3s"
                    >
                      Create Campaign
                    </Button>
                  </Card.Body>
                </Card.Root>

                {/* Quick Action 3: Team Collaboration */}
                <Card.Root
                  overflow="hidden"
                  shadow="xl"
                  rounded="lg"
                  _hover={{ transform: "scale(1.05)", shadow: "2xl" }}
                  transition="all 0.3s"
                >
                  <Card.Body p="6">
                    <Button
                      w="full"
                      py="3"
                      bg="red.600"
                      color="white"
                      rounded="lg"
                      _hover={{ bg: "red.700" }}
                      transition="background 0.3s"
                    >
                      Team Collaboration
                    </Button>
                  </Card.Body>
                </Card.Root>

                {/* Quick Action 4: Settings */}
                <Card.Root
                  overflow="hidden"
                  shadow="xl"
                  rounded="lg"
                  _hover={{ transform: "scale(1.05)", shadow: "2xl" }}
                  transition="all 0.3s"
                >
                  <Card.Body p="6">
                    <Button
                      w="full"
                      py="3"
                      bg="red.600"
                      color="white"
                      rounded="lg"
                      _hover={{ bg: "red.700" }}
                      transition="background 0.3s"
                    >
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