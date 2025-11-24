import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DashboardCard from "./Components/DashboardCard";
import { Head } from "@inertiajs/react";
import { theme } from "@/theme";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  Button,
  Container,
  VStack,
  HStack,
  Stat,
  Icon,
} from "@chakra-ui/react";

export default function Dashboard() {
  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />
      <Box bg={theme.colors.gray[50]} minH="100vh">
        <Container maxW="7xl" py={8}>
          <VStack spacing={8} align="stretch">
            <Box textAlign="center" py={6}>
              <Heading
                size="2xl"
                mb={3}
                color={theme.colors.gray[900]}
                fontWeight="800"
              >
                ContentFlow
              </Heading>
              <Text fontSize="lg" color={theme.colors.gray[600]}>
                Manage your content with modern tools
              </Text>
            </Box>

            {/* Stats Cards */}
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
              <Card.Root
                bg={theme.colors.white}
                shadow="sm"
                border="1px"
                borderColor={theme.colors.gray[200]}
              >
                <Card.Body p={6}>
                  <Stat.Root>
                    <Stat.Label color={theme.colors.gray[600]}>
                      Total Posts
                    </Stat.Label>
                    <Stat.ValueText
                      color={theme.colors.primary[600]}
                      fontSize="2xl"
                    >
                      1,234
                    </Stat.ValueText>
                  </Stat.Root>
                </Card.Body>
              </Card.Root>
              <Card.Root
                bg={theme.colors.white}
                shadow="sm"
                border="1px"
                borderColor={theme.colors.gray[200]}
              >
                <Card.Body p={6}>
                  <Stat.Root>
                    <Stat.Label color={theme.colors.gray[600]}>
                      Campaigns
                    </Stat.Label>
                    <Stat.ValueText
                      color={theme.colors.primary[600]}
                      fontSize="2xl"
                    >
                      56
                    </Stat.ValueText>
                  </Stat.Root>
                </Card.Body>
              </Card.Root>
              <Card.Root
                bg={theme.colors.white}
                shadow="sm"
                border="1px"
                borderColor={theme.colors.gray[200]}
              >
                <Card.Body p={6}>
                  <Stat.Root>
                    <Stat.Label color={theme.colors.gray[600]}>
                      Engagement
                    </Stat.Label>
                    <Stat.ValueText
                      color={theme.colors.primary[600]}
                      fontSize="2xl"
                    >
                      89%
                    </Stat.ValueText>
                  </Stat.Root>
                </Card.Body>
              </Card.Root>
              <Card.Root
                bg={theme.colors.white}
                shadow="sm"
                border="1px"
                borderColor={theme.colors.gray[200]}
              >
                <Card.Body p={6}>
                  <Stat.Root>
                    <Stat.Label color={theme.colors.gray[600]}>
                      Revenue
                    </Stat.Label>
                    <Stat.ValueText
                      color={theme.colors.primary[600]}
                      fontSize="2xl"
                    >
                      $12.5K
                    </Stat.ValueText>
                  </Stat.Root>
                </Card.Body>
              </Card.Root>
            </SimpleGrid>

            {/* Main Features */}
            <Box>
              <Heading size="lg" mb={6} color={theme.colors.gray[800]}>
                Main Features
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={6}>
                <DashboardCard
                  title="Content Management"
                  description="Organize and schedule your content"
                  href="/manage-content"
                  buttonText="Manage"
                  icon="icon-[mdi--rolodex]"
                />
                <DashboardCard
                  title="Schedule Posts"
                  description="Plan your social media posts"
                  href="/schedule"
                  buttonText="Schedule"
                  icon="icon-[iconoir--post]"
                />
                <DashboardCard
                  title="Analytics"
                  description="Track performance metrics"
                  href="/analytics"
                  buttonText="View Stats"
                  icon="icon-[pixel--analytics]"
                />
                <DashboardCard
                  title="AI Assistant"
                  description="Get AI-powered recommendations"
                  href="/ai-chat"
                  buttonText="Chat"
                  icon="icon-[hugeicons--ai-beautify]"
                />
              </SimpleGrid>
            </Box>

            {/* Quick Actions */}
            <Box>
              <Heading size="lg" mb={6} color={theme.colors.gray[800]}>
                Quick Actions
              </Heading>
              <HStack spacing={4} flexWrap="wrap">
                <Button
                  bg={theme.colors.primary[600]}
                  color={theme.colors.white}
                  _hover={{ bg: theme.colors.primary[700] }}
                  size="lg"
                  px={8}
                >
                  Upload Content
                </Button>
                <Button
                  bg={theme.colors.white}
                  color={theme.colors.gray[700]}
                  border="1px"
                  borderColor={theme.colors.gray[300]}
                  _hover={{ bg: theme.colors.gray[50] }}
                  size="lg"
                  px={8}
                >
                  New Campaign
                </Button>
                <Button
                  bg={theme.colors.white}
                  color={theme.colors.gray[700]}
                  border="1px"
                  borderColor={theme.colors.gray[300]}
                  _hover={{ bg: theme.colors.gray[50] }}
                  size="lg"
                  px={8}
                >
                  Team Settings
                </Button>
              </HStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </AuthenticatedLayout>
  );
}
