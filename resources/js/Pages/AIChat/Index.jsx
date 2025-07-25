import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import useAIChat from "@/Hooks/useAIChat";
import { useState } from "react";
import { usePage } from "@inertiajs/react";
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  Card,
  Badge,
  Button,
  Textarea,
  Stack,
  Flex,
  Avatar,
  Spinner,
  Drawer,
  IconButton,
  useDisclosure,
  Stat,
  Separator,
} from "@chakra-ui/react";

// Minimalist SVG Icons
const Icon = ({ type, size = 20, className = "" }) => {
  const icons = {
    ai: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6" />
        <path d="m21 12-6-6-6 6-6-6" />
      </svg>
    ),
    send: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="m22 2-7 20-4-9-9-4Z" />
      </svg>
    ),
    lightbulb: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    ),
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
  };

  return <Box as="span" display="inline-flex" alignItems="center">{icons[type]}</Box>;
};

// Minimalist Chat Message
const ChatMessage = ({ message, user }) => {
  const isAI = message.sender === "AI";
  
  return (
    <Flex 
      gap={4}
      p={2}
      direction={isAI ? "row" : "row-reverse"}
          className="text-white  "
      >
      <Avatar.Root 
        // size="2xl" 
        flexShrink={0}
        >
        <Avatar.Fallback 
          bg={isAI ? "orange.600" : "purple.500"} 
          color="white"
          fontSize="sm"
          h={10}
          p={2}
          w={10}
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          className="mx-auto"
        >
          {isAI ? "AI" :  user.name?.charAt(0)?.toUpperCase()+1 || 'U'}
        </Avatar.Fallback>
      </Avatar.Root>
      
      <Box 
        bg={isAI ? "white" : "red.50"}
        px={4} 
        py={3} 
        rounded="2xl"
        maxW="80%"
        shadow="sm"
        border="1px"
        borderColor={isAI ? "gray.100" : "red.100"}
      >
        <Text fontSize="sm" color="gray.700" lineHeight="1.5">
          {message.message}
        </Text>
        <Text fontSize="xs" color="gray.400" mt={1}>
          {message.timestamp}
        </Text>
      </Box>
    </Flex>
  );
};

// Compact Statistics
const CompactStats = ({ campaigns }) => {
  const active = campaigns.filter(c => c.status === "active").length;
  const total = campaigns.length;

  return (
    <Flex gap={6}>
      <Box textAlign="center">
        <Text fontSize="lg" fontWeight="bold" color="red.600">{active}</Text>
        <Text fontSize="xs" color="gray.500">Active</Text>
      </Box>
      <Box textAlign="center">
        <Text fontSize="lg" fontWeight="bold" color="blue.600">{total}</Text>
        <Text fontSize="xs" color="gray.500">Total</Text>
      </Box>
    </Flex>
  );
};

// Minimalist Idea Card
const IdeaCard = ({ idea, onUse }) => (
  <Button
    variant="ghost"
    h="auto"
    p={4}
    justifyContent="start"
    textAlign="left"
    onClick={() => onUse(idea)}
    _hover={{ bg: "red.50", transform: "translateY(-1px)" }}
    transition="all 0.2s"
  >
    <Flex align="start" gap={3} w="full" flex={1}>
      <Text fontSize="lg">{idea.icon}</Text>
      <Box flex={1}>
        <Text fontSize="sm" fontWeight="600" color="gray.800" mb={1}>
          {idea.title}
        </Text>
        <Text fontSize="xs" color="gray.600" lineHeight="1.4" textWrap="wrap">
          {idea.description}
        </Text>
      </Box>
    </Flex>
  </Button>
);

// Ideas Panel
const IdeasPanel = ({ ideas, onUse }) => (
  <Card.Root bg="white" shadow="sm" border="1px" borderColor="gray.100">
    <Card.Body p={5}>
      <Flex align="center" gap={3} mb={5}>
        <Box p={2} bg="red.100" rounded="lg" color="red.600">
          <Icon type="lightbulb" size={18} />
        </Box>
        <Heading size="md" color="gray.800">Ideas</Heading>
      </Flex>
      
      <Stack gap={2}>
        {ideas.map(idea => (
          <IdeaCard key={idea.id} idea={idea} onUse={onUse} />
        ))}
      </Stack>
    </Card.Body>
  </Card.Root>
);

// Mobile Drawer
const MobileIdeasDrawer = ({ isOpen, onClose, ideas, onUse }) => (
  <Drawer.Root open={isOpen} onOpenChange={onClose} placement="bottom">
    <Drawer.Backdrop />
    <Drawer.Positioner>
      <Drawer.Content>
        <Drawer.Header borderBottom="1px" borderColor="gray.100">
          <Drawer.Title>💡 Campaign Ideas</Drawer.Title>
          <Drawer.CloseTrigger />
        </Drawer.Header>
        <Drawer.Body p={4}>
          <Stack gap={2}>
            {ideas.map(idea => (
              <IdeaCard 
                key={idea.id} 
                idea={idea} 
                onUse={(idea) => { onUse(idea); onClose(); }} 
              />
            ))}
          </Stack>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Positioner>
  </Drawer.Root>
);

export default function Index() {
  const {
    messages,
    inputMessage,
    campaigns,
    loading,
    handleInputChange,
    handleKeyPress,
    sendMessage,
  } = useAIChat();

  const { open, onOpen, onClose } = useDisclosure();

  const [ideas] = useState([
    {
      id: 1,
      title: "Visual Marketing",
      description: "Visual content generates 40% more engagement",
      icon: "📸",
    },
    {
      id: 2,
      title: "Sustainability",
      description: "Eco-friendly brands retain 25% more customers",
      icon: "🌱",
    },
    {
      id: 3,
      title: "Micro-Influencers",
      description: "Higher conversion than celebrities",
      icon: "👥",
    },
    {
      id: 4,
      title: "UGC Content",
      description: "Increases authenticity and reduces costs",
      icon: "👤",
    },
  ]);
  const user = usePage().props.auth.user || {};

  const useIdeaAsPrompt = (idea) => {
    const prompt = `Give me ideas for a campaign about ${idea.title}`;
    handleInputChange({ target: { value: prompt } });
  };

  return (
    <AuthenticatedLayout>
      <Head title="AI Chat" />

      <Box minH="100vh" py={6}>
        <Container maxW="6xl">
          {/* Minimalist Header */}
          <Stack gap={6} mb={8}>
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "start", md: "center" }}
              gap={6}
            >
              <Box>
                <Heading
                  fontSize={{ base: "3xl", md: "5xl" }}
                  fontWeight="800"
                  size={{ base: "4xl" }}
                  textAlign={{ base: "center" }}
                  bgGradient="to-r"
                  gradientFrom="red.500"
                  gradientTo="orange.700"
                  height="60px"
                  bgClip="text"
                >
                  AI Assistant
                </Heading>
                <Text color="gray.600" mt={6} fontSize="lg">
                  Intelligent recommendations for your campaigns
                </Text>
              </Box>

              <Flex align="center" gap={4}>
                {campaigns.length > 0 && (
                  <Box
                    bg="white"
                    px={4}
                    py={3}
                    rounded="xl"
                    shadow="sm"
                    border="1px"
                    borderColor="gray.100"
                  >
                    <CompactStats campaigns={campaigns} />
                  </Box>
                )}

                <IconButton
                  onClick={onOpen}
                  colorScheme="red"
                  variant="outline"
                  size="md"
                  rounded="xl"
                  display={{ base: "flex", lg: "none" }}
                >
                  <Icon type="lightbulb" size={20} />
                </IconButton>
              </Flex>
            </Flex>

            {campaigns.length > 0 && (
              <Badge
                colorScheme="red"
                variant="subtle"
                px={3}
                py={1}
                rounded="full"
                alignSelf="start"
              >
                {campaigns.length} campaigns available
              </Badge>
            )}
          </Stack>

          {/* Main Layout */}
          <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={6}>
            {/* Chat */}
            <Card.Root
              bg="gray.50"
              shadow="sm"
              border="1px"
              borderColor="gray.100"
            >
              <Card.Body p={6}>
                {/* Chat Header */}
                <Flex justify="space-between" align="center" mb={6}>
                  <Flex align="center" gap={3}>
                    <Box p={2} bg="red.100" rounded="lg" color="red.600">
                      <Icon type="ai" size={20} />
                    </Box>
                    <Heading size="xl" color="gray.900" fontWeight="600">
                      Chat ContentFlow
                    </Heading>
                  </Flex>
                  <Badge colorScheme="green" variant="subtle" rounded="full">
                    ⭐Online
                  </Badge>
                </Flex>

                {/* Messages */}
                <Box
                  h="400px"
                  px={2}
                  overflowY="auto"
                  mb={6}
                  css={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#c2530a transparent",
                    "&::-webkit-scrollbar": {
                      width: "3px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#c2530a",
                      borderRadius: "2px",
                    },
                    "&::-ms-scrollbar": {
                      width: "3px",
                    },
                    "&::-ms-scrollbar-thumb": {
                      background: "#c2530a",
                    },
                  }}
                >
                  <Stack gap={4} py={1}>
                    {messages.length === 0 && (
                      <Box textAlign="center" py={8}>
                        <Text color="gray.500" fontSize="sm">
                          Hi! I'm your AI assistant. How can I help you today?
                        </Text>
                      </Box>
                    )}

                    {messages.map((msg) => (
                      <ChatMessage key={msg.id} message={msg} user={user} />
                    ))}

                    {loading && (
                      <Flex gap={3} align="center">
                         <Avatar.Root size="sm"> 
                          <Avatar.Fallback 
                              bg="orange.600"  
                              color="white"
                              fontSize="sm"
                              h={10}
                              p={2}
                              w={10}
                              borderRadius="full"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              className="mx-auto"
                            >
                            AI
                            </Avatar.Fallback>
                        </Avatar.Root>

                        <Box
                          bg="white"
                          px={4}
                          py={3}
                          rounded="2xl"
                          shadow="sm"
                          border="1px"
                          borderColor="gray.100"
                        >
                          <Flex align="center" gap={2}>
                            <Spinner size="sm" color="red.500" />
                            <Text fontSize="sm" color="gray.600">
                              Thinking...
                            </Text>
                          </Flex>
                        </Box>
                      </Flex>
                    )}
                  </Stack>
                </Box>

                <Separator mb={6} />

                {/* Input */}
                <Stack gap={3}>
                  <Textarea
                    value={inputMessage}
                    onChange={handleInputChange}
                    // onKeyPress={handleKeyPress}
                    placeholder="Write your message..."
                    resize="none"
                    p={4}
                    border="1px solid"
                    borderColor="gray.200"
                    rows={3}
                    focusBorderColor="red.500"
                    rounded="xl"
                  />
                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" color="gray.500">
                      Enter to send
                    </Text>
                    <Button
                      onClick={sendMessage}
                      disabled={loading || !inputMessage.trim()}
                      colorScheme="red"
                      size="md"
                      rounded="xl"
                      minW="100px"
                    >
                      <Icon type="send" size={16} />
                      Send
                    </Button>
                  </Flex>
                </Stack>
              </Card.Body>
            </Card.Root>

            {/* Ideas Panel (desktop) */}
            <Box display={{ base: "none", lg: "block" }}>
              <IdeasPanel ideas={ideas} onUse={useIdeaAsPrompt} />
            </Box>
          </Grid>

          {/* Mobile Drawer */}
          <MobileIdeasDrawer
            isOpen={open}
            onClose={onClose}
            ideas={ideas}
            onUse={useIdeaAsPrompt}
          />
        </Container>
      </Box>
    </AuthenticatedLayout>
  );
}
