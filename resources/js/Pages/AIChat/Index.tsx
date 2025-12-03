import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import useAIChat from "@/Hooks/useAIChat";
import { useState } from "react";
import { usePage } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/Hooks/useTheme";
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
import {
  Lightbulb,
  Camera,
  Leaf,
  Users,
  User as UserIcon,
  Star,
  LucideIcon,
  Send,
  Brain,
  Sparkles,
  Zap,
  MessageSquare,
} from "lucide-react";

const Icon = ({
  type,
  size = 20,
  className = "",
  theme,
}: {
  type: string;
  size?: number;
  className?: string;
  theme?: "dark" | "light";
}) => {
  const icons: Record<string, JSX.Element> = {
    ai: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6" />
        <path d="m21 12-6-6-6 6-6-6" />
      </svg>
    ),
    send: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
      >
        <path d="m22 2-7 20-4-9-9-4Z" />
      </svg>
    ),
    lightbulb: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
      >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    ),
    trending: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
      >
        <polyline points="22,6 13.5,15.5 8.5,10.5 1,18" />
        <polyline points="22,6 18,6 18,10" />
      </svg>
    ),
    stats: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
      >
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
  };

  return (
    <Box as="span" display="inline-flex" alignItems="center">
      {icons[type]}
    </Box>
  );
};

interface Message {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
}

interface User {
  name?: string;
  [key: string]: any;
}

// Minimalist Chat Message with theme support
const ChatMessage = ({
  message,
  user,
  theme,
}: {
  message: Message;
  user: User;
  theme: "dark" | "light";
}) => {
  const isAI = message.sender === "AI";

  return (
    <Flex gap={4} p={2} direction={isAI ? "row" : "row-reverse"}>
      <Avatar.Root flexShrink={0}>
        <Avatar.Fallback
          bg={
            isAI
              ? theme === "dark"
                ? "orange.700"
                : "orange.600"
              : theme === "dark"
              ? "purple.700"
              : "purple.500"
          }
          color="white"
          fontSize="sm"
          h={10}
          p={2}
          w={10}
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {isAI ? "AI" : user.name?.charAt(0)?.toUpperCase() || "U"}
        </Avatar.Fallback>
      </Avatar.Root>

      <Box
        bg={
          isAI
            ? theme === "dark"
              ? "neutral.800"
              : "white"
            : theme === "dark"
            ? "purple.900/30"
            : "red.50"
        }
        px={4}
        py={3}
        rounded="2xl"
        maxW="80%"
        shadow="sm"
        border="1px"
        borderColor={
          isAI
            ? theme === "dark"
              ? "neutral.700"
              : "gray.100"
            : theme === "dark"
            ? "purple.800/30"
            : "red.100"
        }
      >
        <Text
          fontSize="sm"
          lineHeight="1.5"
          color={theme === "dark" ? "gray.100" : "gray.700"}
        >
          {message.message}
        </Text>
        <Text
          fontSize="xs"
          mt={1}
          color={theme === "dark" ? "gray.400" : "gray.400"}
        >
          {message.timestamp}
        </Text>
      </Box>
    </Flex>
  );
};

interface Campaign {
  status: string;
  [key: string]: any;
}

// Compact Statistics with theme support
const CompactStats = ({
  campaigns,
  theme,
}: {
  campaigns: Campaign[];
  theme: "dark" | "light";
}) => {
  const { t } = useTranslation();
  const active = campaigns.filter((c) => c.status === "active").length;
  const total = campaigns.length;

  return (
    <Flex gap={6}>
      <Box textAlign="center">
        <Text
          fontSize="lg"
          fontWeight="bold"
          color={theme === "dark" ? "orange.400" : "red.600"}
        >
          {active}
        </Text>
        <Text fontSize="xs" color={theme === "dark" ? "gray.400" : "gray.500"}>
          {t("aiChat.stats.active")}
        </Text>
      </Box>
      <Box textAlign="center">
        <Text
          fontSize="lg"
          fontWeight="bold"
          color={theme === "dark" ? "blue.400" : "blue.600"}
        >
          {total}
        </Text>
        <Text fontSize="xs" color={theme === "dark" ? "gray.400" : "gray.500"}>
          {t("aiChat.stats.total")}
        </Text>
      </Box>
    </Flex>
  );
};

interface Idea {
  id: number;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
}

const IdeaCard = ({
  idea,
  onUse,
  theme,
}: {
  idea: Idea;
  onUse: (idea: Idea) => void;
  theme: "dark" | "light";
}) => {
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      h="auto"
      p={4}
      justifyContent="start"
      textAlign="left"
      onClick={() => onUse(idea)}
      _hover={{
        bg: theme === "dark" ? "neutral.800" : "red.50",
        transform: "translateY(-1px)",
      }}
      transition="all 0.2s"
    >
      <Flex align="start" gap={3} w="full" flex={1}>
        <idea.icon
          className={`h-5 w-5 ${
            theme === "dark" ? "text-orange-400" : "text-red-600"
          }`}
        />
        <Box flex={1}>
          <Text
            fontSize="sm"
            fontWeight="600"
            color={theme === "dark" ? "gray.100" : "gray.800"}
            mb={1}
          >
            {t(idea.titleKey)}
          </Text>
          <Text
            fontSize="xs"
            color={theme === "dark" ? "gray.400" : "gray.600"}
            lineHeight="1.4"
            textWrap="wrap"
          >
            {t(idea.descriptionKey)}
          </Text>
        </Box>
      </Flex>
    </Button>
  );
};

const IdeasPanel = ({
  ideas,
  onUse,
  theme,
}: {
  ideas: Idea[];
  onUse: (idea: Idea) => void;
  theme: "dark" | "light";
}) => {
  const { t } = useTranslation();

  return (
    <Card.Root
      bg={theme === "dark" ? "neutral.800/50" : "white"}
      shadow="sm"
      border="1px"
      borderColor={theme === "dark" ? "neutral.700/50" : "gray.100"}
    >
      <Card.Body p={5}>
        <Flex align="center" gap={3} mb={5}>
          <Box
            p={2}
            rounded="lg"
            color={theme === "dark" ? "orange.400" : "red.600"}
            bg={theme === "dark" ? "orange.900/20" : "red.100"}
          >
            <Lightbulb className="w-5 h-5" />
          </Box>
          <Heading size="md" color={theme === "dark" ? "gray.100" : "gray.800"}>
            {t("aiChat.ideas.title")}
          </Heading>
        </Flex>

        <Stack gap={2}>
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onUse={onUse} theme={theme} />
          ))}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
};

const MobileIdeasDrawer = ({
  isOpen,
  onClose,
  ideas,
  onUse,
  theme,
}: {
  isOpen: boolean;
  onClose: () => void;
  ideas: Idea[];
  onUse: (idea: Idea) => void;
  theme: "dark" | "light";
}) => {
  const { t } = useTranslation();

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose} placement="bottom">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content bg={theme === "dark" ? "neutral.900" : "white"}>
          <Drawer.Header
            borderBottom="1px"
            borderColor={theme === "dark" ? "neutral.700" : "gray.100"}
          >
            <Flex align="center" gap={2}>
              <Lightbulb
                className={`h-4 w-4 ${
                  theme === "dark" ? "text-orange-400" : "text-red-600"
                }`}
              />
              <Drawer.Title color={theme === "dark" ? "gray.100" : "gray.800"}>
                {t("aiChat.ideas.panelTitle")}
              </Drawer.Title>
            </Flex>
            <Drawer.CloseTrigger />
          </Drawer.Header>
          <Drawer.Body p={4}>
            <Stack gap={2}>
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onUse={(idea) => {
                    onUse(idea);
                    onClose();
                  }}
                  theme={theme}
                />
              ))}
            </Stack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};

export default function Index() {
  const { t } = useTranslation();
  const { theme } = useTheme();
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

  const [ideas] = useState<Idea[]>([
    {
      id: 1,
      titleKey: "aiChat.ideas.visualMarketing.title",
      descriptionKey: "aiChat.ideas.visualMarketing.description",
      icon: Camera,
    },
    {
      id: 2,
      titleKey: "aiChat.ideas.sustainability.title",
      descriptionKey: "aiChat.ideas.sustainability.description",
      icon: Leaf,
    },
    {
      id: 3,
      titleKey: "aiChat.ideas.microInfluencers.title",
      descriptionKey: "aiChat.ideas.microInfluencers.description",
      icon: Users,
    },
    {
      id: 4,
      titleKey: "aiChat.ideas.ugcContent.title",
      descriptionKey: "aiChat.ideas.ugcContent.description",
      icon: UserIcon,
    },
    {
      id: 5,
      titleKey: "aiChat.ideas.viralContent.title",
      descriptionKey: "aiChat.ideas.viralContent.description",
      icon: Zap,
    },
    {
      id: 6,
      titleKey: "aiChat.ideas.copywriting.title",
      descriptionKey: "aiChat.ideas.copywriting.description",
      icon: MessageSquare,
    },
  ]);
  const user = usePage().props.auth.user || {};

  const useIdeaAsPrompt = (idea: Idea) => {
    const prompt = `${t("aiChat.promptPrefix")} ${t(idea.titleKey)}`;
    handleInputChange({ target: { value: prompt } } as any);
  };

  // Helper functions for theme styles
  const getBgColor = () => (theme === "dark" ? "bg-neutral-900" : "bg-gray-50");
  const getTextColor = (type: "primary" | "secondary" = "primary") => {
    if (theme === "dark") {
      return type === "primary" ? "text-gray-100" : "text-gray-400";
    } else {
      return type === "primary" ? "text-gray-800" : "text-gray-600";
    }
  };
  const getBorderColor = () =>
    theme === "dark" ? "border-neutral-700/50" : "border-gray-100";
  const getCardBg = () => (theme === "dark" ? "bg-neutral-800/50" : "bg-white");

  return (
    <AuthenticatedLayout>
      <Head title={t("aiChat.title")} />

      <Box minH="100vh" className={`transition-colors duration-300 mt-8`}>
        <Container maxW="6xl" py={6}>
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
                  bgGradient="to-r"
                  gradientFrom={theme === "dark" ? "orange.500" : "red.500"}
                  gradientTo={theme === "dark" ? "orange.700" : "orange.700"}
                  bgClip="text"
                  className=" my-6 text-center"
                >
                  {t("aiChat.title")}
                </Heading>
                <Text
                  className={`mt-2 ${getTextColor("secondary")}`}
                  fontSize="lg"
                >
                  {t("aiChat.subtitle")}
                </Text>
              </Box>

              <Flex align="center" gap={4}>
                {campaigns.length > 0 && (
                  <Box
                    className={`px-4 py-3 rounded-xl shadow-sm border ${getBorderColor()} ${getCardBg()}`}
                  >
                    <CompactStats campaigns={campaigns} theme={theme} />
                  </Box>
                )}

                <IconButton
                  onClick={onOpen}
                  variant="outline"
                  size="md"
                  rounded="xl"
                  display={{ base: "flex", lg: "none" }}
                  colorScheme={theme === "dark" ? "orange" : "red"}
                >
                  <Lightbulb className="w-5 h-5" />
                </IconButton>
              </Flex>
            </Flex>

            {campaigns.length > 0 && (
              <Badge
                variant="subtle"
                px={3}
                py={1}
                rounded="full"
                alignSelf="start"
                colorScheme={theme === "dark" ? "orange" : "red"}
              >
                {campaigns.length} {t("aiChat.campaignsAvailable")}
              </Badge>
            )}
          </Stack>

          {/* Main Layout */}
          <Grid templateColumns={{ base: "1fr", lg: "1fr 350px" }} gap={6}>
            {/* Chat Section */}
            <Card.Root
              className={`shadow-sm border transition-colors duration-300 ${getCardBg()} ${getBorderColor()}`}
            >
              <Card.Body p={6}>
                {/* Chat Header */}
                <Flex justify="space-between" align="center" mb={6}>
                  <Flex align="center" gap={3}>
                    <Box
                      p={2}
                      rounded="lg"
                      className={
                        theme === "dark"
                          ? "bg-orange-900/20 text-orange-400"
                          : "bg-red-100 text-red-600"
                      }
                    >
                      <Brain className="w-5 h-5" />
                    </Box>
                    <Heading
                      size="xl"
                      fontWeight="600"
                      className={getTextColor("primary")}
                    >
                      {t("aiChat.chatTitle")}
                    </Heading>
                  </Flex>
                  <Badge
                    variant="subtle"
                    rounded="full"
                    colorScheme={theme === "dark" ? "green" : "green"}
                  >
                    <Sparkles className="inline h-3 w-3 mr-1" />
                    {t("aiChat.online")}
                  </Badge>
                </Flex>

                <Box
                  h="400px"
                  px={2}
                  overflowY="auto"
                  mb={6}
                  className={
                    theme === "dark" ? "scrollbar-dark" : "scrollbar-light"
                  }
                  css={{
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: theme === "dark" ? "#1f2937" : "#f3f4f6",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: theme === "dark" ? "#c2530a" : "#dc2626",
                      borderRadius: "3px",
                    },
                    "&::-ms-scrollbar": {
                      width: "6px",
                    },
                    "&::-ms-scrollbar-thumb": {
                      background: theme === "dark" ? "#c2530a" : "#dc2626",
                    },
                  }}
                >
                  <Stack gap={4} py={1}>
                    {messages.length === 0 && (
                      <Box textAlign="center" py={8}>
                        <Text
                          className={getTextColor("secondary")}
                          fontSize="sm"
                        >
                          {t("aiChat.welcomeMessage")}
                        </Text>
                      </Box>
                    )}

                    {messages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        user={user}
                        theme={theme}
                      />
                    ))}

                    {loading && (
                      <Flex gap={3} align="center">
                        <Avatar.Root size="sm">
                          <Avatar.Fallback
                            bg={theme === "dark" ? "orange.700" : "orange.600"}
                            color="white"
                            fontSize="sm"
                            h={10}
                            p={2}
                            w={10}
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            AI
                          </Avatar.Fallback>
                        </Avatar.Root>

                        <Box
                          className={`px-4 py-3 rounded-2xl shadow-sm border ${getBorderColor()} ${getCardBg()}`}
                        >
                          <Flex align="center" gap={2}>
                            <Spinner
                              size="sm"
                              color={
                                theme === "dark" ? "orange.400" : "red.500"
                              }
                            />
                            <Text
                              fontSize="sm"
                              className={getTextColor("secondary")}
                            >
                              {t("aiChat.thinking")}
                            </Text>
                          </Flex>
                        </Box>
                      </Flex>
                    )}
                  </Stack>
                </Box>

                <Separator
                  mb={6}
                  borderColor={theme === "dark" ? "neutral.700" : "gray.200"}
                />

                {/* Input Section */}
                <Stack gap={3}>
                  <Textarea
                    value={inputMessage}
                    onChange={handleInputChange}
                    placeholder={t("aiChat.inputPlaceholder")}
                    resize="none"
                    p={4}
                    rows={3}
                    rounded="xl"
                    focusBorderColor={
                      theme === "dark" ? "orange.500" : "red.500"
                    }
                    className={`border transition-colors duration-300 ${
                      theme === "dark"
                        ? "bg-neutral-800 border-neutral-700 text-gray-100 placeholder-gray-400"
                        : "bg-white border-gray-200 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" className={getTextColor("secondary")}>
                      {t("aiChat.enterToSend")}
                    </Text>
                    <Button
                      onClick={sendMessage}
                      disabled={loading || !inputMessage.trim()}
                      colorScheme={theme === "dark" ? "orange" : "red"}
                      size="md"
                      rounded="xl"
                      minW="100px"
                      className="transition-all duration-300"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {t("aiChat.send")}
                    </Button>
                  </Flex>
                </Stack>
              </Card.Body>
            </Card.Root>

            {/* Ideas Panel (desktop) */}
            <Box display={{ base: "none", lg: "block" }}>
              <IdeasPanel ideas={ideas} onUse={useIdeaAsPrompt} theme={theme} />
            </Box>
          </Grid>

          {/* Mobile Drawer */}
          <MobileIdeasDrawer
            isOpen={open}
            onClose={onClose}
            ideas={ideas}
            onUse={useIdeaAsPrompt}
            theme={theme}
          />
        </Container>
      </Box>
    </AuthenticatedLayout>
  );
}
