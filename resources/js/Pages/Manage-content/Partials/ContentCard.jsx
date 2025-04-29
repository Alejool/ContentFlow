import { 
    Card, 
    Image, 
    Box, 
    Heading, 
    Text, 
    Flex, 
    Button, 
    Stack,
    Badge
} from "@chakra-ui/react";

export default function ContentCard({ content, onEdit, onDelete }) {
    return (
        <Card.Root 
            overflow="hidden" 
            bg="gray.50" 
            rounded="lg" 
            _hover={{ bg: "gray.100" }} 
            transition="all 0.3s"
        >
            {content.image ? (
                <Image 
                    src={content.image} 
                    alt="Content Thumbnail" 
                    w="full" 
                    h="40" 
                    objectFit="cover" 
                />
            ) : (
                <Box w="full" h="40" bg="gray.300" />
            )}
            
            <Card.Header 
                className="text-center font-bold text-xl py-3"
            >
                {content.title}
            </Card.Header>
            
            {/* Description Section */}
            <Card.Body p="4">
                <Text 
                    mt="2" 
                    overflowY="auto" 
                    p="1" 
                    color="gray.600"
                    h="40" 
                >
                    {content.description}
                </Text>
            
                {/* Hashtags Section */}
                <Box mt="2">
                    <Text color="blue.600">
                        {content.hashtags}
                    </Text>
                </Box>
                
                <Flex mt="4" align="center" justify="space-between">
                    <Text color="gray.500">
                        Published: {content.publish_date}
                    </Text>
                    
                    <Stack direction="row" spacing="2">
                        <Button
                            onClick={onEdit}
                            px="4"
                            py="2"
                            bg="blue.600"
                            color="white"
                            rounded="lg"
                            _hover={{ bg: "blue.700" }}
                            transition="background 0.3s"
                        >
                            Edit
                        </Button>
                        
                        <Button
                            onClick={onDelete}
                            px="4"
                            py="2"
                            bg="red.600"
                            color="white"
                            rounded="lg"
                            _hover={{ bg: "red.700" }}
                            transition="background 0.3s"
                        >
                            Delete
                        </Button>
                    </Stack>
                </Flex>
            </Card.Body>
        </Card.Root>
    );
}