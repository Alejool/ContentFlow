import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import useAIChat from "@/Hooks/useAIChat";
import { useState } from "react";
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
  Icon,
  Circle,
  Float,
  Separator,
  Flex,
  Avatar,
  Spinner,
  Drawer,
  IconButton,
  useDisclosure,
  Stat,
} from "@chakra-ui/react";

// Componente para iconos SVG personalizados
const CustomIcon = ({ type, size = "20", color = "currentColor" }) => {
  const icons = {
    ai: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    trending: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    lightbulb: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <path d="M9 21h6" />
        <path d="M12 17h.01" />
        <path d="M12 3a6 6 0 0 1 6 6c0 3-2 5.5-2 8H8c0-2.5-2-5-2-8a6 6 0 0 1 6-6z" />
      </svg>
    ),
    send: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22,2 15,22 11,13 2,9" />
      </svg>
    ),
    menu: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
    stats: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  };

  return (
    <Box display="inline-flex" alignItems="center">
      {icons[type]}
    </Box>
  );
};

// Componente para mensajes del chat
const ChatMessage = ({ message }) => {
  const isAI = message.sender === "AI";
  const bgColor = isAI ? "red.50" : "gray.50";
  const borderColor = isAI ? "red.200" : "gray.200";

  return (
    <Card.Root
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
      transition="all 0.3s"
      _hover={{ shadow: "md", transform: "translateY(-1px)" }}
    >
      <Card.Body p={4}>
        <Stack direction="row" justify="space-between" mb={2}>
          <Stack direction="row" align="center" gap={2}>
            <Avatar.Root size="sm">
              <Avatar.Fallback bg={isAI ? "red.500" : "gray.500"} color="white">
                {message.sender.charAt(0)}
              </Avatar.Fallback>
            </Avatar.Root>
            <Text
              fontSize="sm"
              fontWeight="600"
              color={isAI ? "red.600" : "gray.600"}
            >
              {message.sender}
            </Text>
          </Stack>
          <Text fontSize="xs" color="gray.500">
            {message.timestamp}
          </Text>
        </Stack>
        <Text fontSize="sm" color="gray.700" lineHeight="1.6">
          {message.message}
        </Text>
      </Card.Body>
    </Card.Root>
  );
};

// Componente compacto para estadísticas en el header
const CompactStats = ({ campaigns }) => {
  const activeCampaigns =
    campaigns.filter((c) => c.status === "active").length || 0;
  const totalCampaigns = campaigns.length || 0;

  return (
    <Stack direction="row" gap={4}>
      <Stat.Root size="sm">
        <Stat.Label color="gray.600">Activas</Stat.Label>
        <Stat.ValueText color="red.600" fontWeight="bold">
          {activeCampaigns}
        </Stat.ValueText>
      </Stat.Root>
      <Stat.Root size="sm">
        <Stat.Label color="gray.600">Total</Stat.Label>
        <Stat.ValueText color="blue.600" fontWeight="bold">
          {totalCampaigns}
        </Stat.ValueText>
      </Stat.Root>
    </Stack>
  );
};

// Componente para tarjetas de tendencias
const TrendCard = ({ trend, onUse, compact = false }) => {
  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        justifyContent="start"
        p={3}
        h="auto"
        whiteSpace="normal"
        textAlign="left"
        onClick={() => onUse(trend)}
        _hover={{ bg: "red.50" }}
      >
        <Stack gap={1} align="start" w="full">
          <Stack direction="row" align="center" gap={2}>
            <Text fontSize="md">{trend.icon}</Text>
            <Text fontSize="sm" fontWeight="600" color="gray.800">
              {trend.title}
            </Text>
          </Stack>
          <Text fontSize="xs" color="gray.600" lineHeight="1.3">
            {trend.description}
          </Text>
        </Stack>
      </Button>
    );
  }

  return (
    <Card.Root
      bg="white"
      shadow="sm"
      borderWidth="1px"
      borderColor="gray.200"
      transition="all 0.3s"
      cursor="pointer"
      onClick={() => onUse(trend)}
      _hover={{
        bg: "red.50",
        shadow: "md",
        transform: "translateY(-2px)",
        borderColor: "red.300",
      }}
    >
      <Card.Body p={4}>
        <Stack gap={3} align="start">
          <Box p={2} rounded="lg" bg="red.100" color="red.600" fontSize="xl">
            {trend.icon}
          </Box>
          <Stack align="start" gap={1} flex={1}>
            <Text fontWeight="600" fontSize="sm" color="gray.800">
              {trend.title}
            </Text>
            <Text fontSize="xs" color="gray.600" lineHeight="1.4">
              {trend.description}
            </Text>
          </Stack>
        </Stack>
        <Flex justify="end" mt={3}>
          <Button
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={(e) => {
              e.stopPropagation();
              onUse(trend);
            }}
          >
            Usar idea
            <CustomIcon type="send" size="12" />
          </Button>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};

// Panel lateral para ideas (escritorio)
const IdeasPanel = ({ trends, onUse }) => (
  <Card.Root bg="white" shadow="lg" borderWidth="1px" borderColor="gray.200">
    <Card.Body p={6}>
      <Stack gap={4} mb={6}>
        <Stack direction="row" align="center" gap={2}>
          <Box p={2} rounded="lg" bg="red.100" color="red.600">
            <CustomIcon type="lightbulb" size="20" />
          </Box>
          <Heading size="md" color="gray.800">
            Ideas Rápidas
          </Heading>
        </Stack>
      </Stack>

      <Stack gap={3} align="stretch">
        {trends.map((trend) => (
          <TrendCard
            key={trend.id}
            trend={trend}
            onUse={onUse}
            compact={true}
          />
        ))}
      </Stack>
    </Card.Body>
  </Card.Root>
);

// Drawer para móvil
const MobileIdeasDrawer = ({ isOpen, onClose, trends, onUse }) => (
  <Drawer.Root
    open={isOpen}
    onOpenChange={onClose}
    placement="bottom"
    size="lg"
  >
    <Drawer.Backdrop />
    <Drawer.Positioner>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>💡 Ideas para Campañas</Drawer.Title>
          <Drawer.CloseTrigger />
        </Drawer.Header>
        <Drawer.Body>
          <Stack gap={2}>
            {trends.map((trend) => (
              <TrendCard
                key={trend.id}
                trend={trend}
                onUse={(trend) => {
                  onUse(trend);
                  onClose();
                }}
                compact={true}
              />
            ))}
          </Stack>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Positioner>
  </Drawer.Root>
);

// Componente principal
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
  const bgColor = "gray.50";
  const cardBg = "white";

  const [trends] = useState([
    {
      id: 1,
      title: "Marketing Visual",
      description: "Imágenes y videos cortos generan 40% más engagement",
      icon: "📸",
    },
    {
      id: 2,
      title: "Sostenibilidad",
      description: "Marcas eco-friendly tienen 25% más retención",
      icon: "🌱",
    },
    {
      id: 3,
      title: "Micro-Influencers",
      description: "Mayor conversión que celebridades tradicionales",
      icon: "👥",
    },
    {
      id: 4,
      title: "Marketing Conversacional",
      description: "Chatbots personalizados mejoran satisfacción",
      icon: "💬",
    },
    {
      id: 5,
      title: "Contenido UGC",
      description: "Aumenta autenticidad y reduce costos",
      icon: "👤",
    },
  ]);

  const useTrendAsPrompt = (trend) => {
    const prompt = `Dame ideas para crear una campaña de ${trend.title}`;
    handleInputChange({ target: { value: prompt } });
  };

  return (
    <AuthenticatedLayout>
      <Head title="AI Chat" />

      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="7xl">
          {/* Header mejorado */}
          <Stack gap={4} mb={8}>
            <Stack
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "start", md: "center" }}
              gap={4}
            >
              <Stack gap={2}>
                <Heading
                  size={{ base: "xl", md: "2xl" }}
                  fontWeight="700"
                  bgGradient="to-r"
                  gradientFrom="red.600"
                  gradientTo="pink.600"
                  bgClip="text"
                >
                  Asistente IA para Campañas
                </Heading>
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  color="gray.600"
                  maxW="2xl"
                >
                  Obtén recomendaciones personalizadas con IA avanzada
                </Text>
              </Stack>

              {/* Stats compactas y botón de ideas para móvil */}
              <Stack direction="row" align="center" gap={4}>
                {campaigns.length > 0 && (
                  <Card.Root
                    bg="white"
                    shadow="sm"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    <Card.Body p={3}>
                      <CompactStats campaigns={campaigns} />
                    </Card.Body>
                  </Card.Root>
                )}

                {/* Botón de ideas para móvil */}
                <Box display={{ base: "block", lg: "none" }}>
                  <IconButton
                    onClick={onOpen}
                    colorScheme="red"
                    variant="outline"
                    size="md"
                  >
                    <CustomIcon type="lightbulb" size="20" />
                  </IconButton>
                </Box>
              </Stack>
            </Stack>

            {/* Badge de campañas cargadas */}
            {campaigns.length > 0 && (
              <Badge
                colorScheme="red"
                variant="subtle"
                px={3}
                py={1}
                rounded="full"
                alignSelf="start"
              >
                {campaigns.length} campañas cargadas
              </Badge>
            )}
          </Stack>

          {/* Layout responsivo */}
          <Grid
            columns={{ base: 1, lg: 4 }}
            gap={6}
            templateColumns={{ base: "1fr", lg: "1fr 300px" }}
          >
            {/* Chat principal */}
            <Box>
              <Card.Root
                bg={cardBg}
                shadow="lg"
                borderWidth="1px"
                borderColor="gray.200"
              >
                <Card.Body p={6}>
                  <Stack
                    direction="row"
                    justify="space-between"
                    align="center"
                    mb={6}
                  >
                    <Stack direction="row" align="center" gap={3}>
                      <Box p={2} rounded="lg" bg="red.100" color="red.600">
                        <CustomIcon type="ai" size="24" />
                      </Box>
                      <Heading size="lg" color="gray.800">
                        Chat con IA
                      </Heading>
                    </Stack>
                    <Badge colorScheme="green" variant="subtle">
                      En línea
                    </Badge>
                  </Stack>

                  {/* Mensajes del chat */}
                  <Box
                    maxH="500px"
                    overflowY="auto"
                    mb={6}
                    css={{
                      "&::-webkit-scrollbar": {
                        width: "4px",
                      },
                      "&::-webkit-scrollbar-track": {
                        width: "6px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#E53E3E",
                        borderRadius: "24px",
                      },
                    }}
                  >
                    <Stack gap={4} align="stretch">
                      {messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                      ))}

                      {loading && (
                        <Card.Root
                          bg="red.50"
                          borderWidth="1px"
                          borderColor="red.200"
                        >
                          <Card.Body p={4}>
                            <Stack direction="row" align="center" gap={3}>
                              <Spinner size="sm" color="red.500" />
                              <Text fontSize="sm" color="gray.600">
                                La IA está pensando...
                              </Text>
                            </Stack>
                          </Card.Body>
                        </Card.Root>
                      )}
                    </Stack>
                  </Box>

                  <Separator mb={6} />

                  {/* Entrada de chat */}
                  <Stack gap={4}>
                    <Textarea
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe tu mensaje... (Puedes preguntar sobre campañas, solicitar ideas o mejoras)"
                      resize="none"
                      rows={3}
                      focusBorderColor="red.500"
                      borderColor="gray.300"
                    />
                    <Stack
                      direction={{ base: "column", sm: "row" }}
                      justify="space-between"
                      gap={2}
                    >
                      <Text fontSize="xs" color="gray.500">
                        Enter para enviar • Shift+Enter para nueva línea
                      </Text>
                      <Button
                        onClick={sendMessage}
                        disabled={loading || !inputMessage.trim()}
                        colorScheme="red"
                        size="md"
                        minW="120px"
                      >
                        Enviar
                        <CustomIcon type="send" size="16" />
                      </Button>
                    </Stack>
                  </Stack>
                </Card.Body>
              </Card.Root>
            </Box>

            {/* Panel lateral de ideas (solo escritorio) */}
            <Box display={{ base: "none", lg: "block" }}>
              <IdeasPanel trends={trends} onUse={useTrendAsPrompt} />
            </Box>
          </Grid>

          {/* Drawer de ideas para móvil */}
          <MobileIdeasDrawer
            isOpen={open}
            onClose={onClose}
            trends={trends}
            onUse={useTrendAsPrompt}
          />
        </Container>
      </Box>
    </AuthenticatedLayout>
  );
}
