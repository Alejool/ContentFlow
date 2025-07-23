// components/DashboardCard.jsx
import { Box, Flex,Button, Heading, Text, Icon } from "@chakra-ui/react";
import { Link } from "@inertiajs/react";

export default function DashboardCard({
  title,
  description,
  href,
  buttonText,
  icon,
  bgColor = "gray.100",
  iconColor = "red-600",
}) {
  return (
    <Box
      overflow="hidden"
      shadow="xl"
      p={5}
      rounded="lg"
      bg={bgColor}
      _hover={{ transform: "scale(1.05)", shadow: "2xl" }}
      transition="all 0.3s"
    >
      <Box p="6">
        <Flex
          align="center"
          justify="center"
          w="full"
          h={20}
          mb="4"
          bg={bgColor}
          rounded="full"
        >
          {/* <Icon as={icon} w="6" h="6" color={iconColor} /> */}

          <span
            className={`${icon} 
                flex 
                items-center 
                justify-center 
                w-full h-full
                bg-${iconColor}
                transition-all duration-300 hover:scale-110`}
            role="img"
            aria-hidden="true"
          />
        </Flex>
        <Heading
          as="h3"
          fontSize="2xl"
          fontWeight="bold"
          mb="10"
          height={10}
          textAlign={"center"}
          color="gray.600"
        >
          {title}
        </Heading>
        <Text mt="2" fontSize="lg" color="gray.600">
          {description}
        </Text>
        <Button
          as={Link}
          href={href}
          mt="6"
          // display="block"
          w="full"
          textAlign="center"
          px={20}
          py="4"
          size="xl"
          fontSize="xl"
          variant="surface"

          color="red.600"
          rounded="lg"
          _hover={{ bg: "red.600", color: "white" }}
          transition="background 0.3s"
        >
          {buttonText}
        </Button>
      </Box>
    </Box>
  );
}
