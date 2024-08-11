// This line is required to use the "use client" feature in Next.js
"use client";

// Import necessary components and hooks from the "@mui/material" library
import { Box, Button, Stack, TextField } from "@mui/material";
import { useState } from "react";

// Define the Home component
export default function Home() {
  // State variables for messages, message input, and loading state
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the support assistant. How can I help you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to send a message to the server and update the messages state
  const sendMessage = async () => {
    // Check if the message is empty or if the component is currently loading
    if (!message.trim() || isLoading) return;

    // Set the loading state to true
    setIsLoading(true);

    // Clear the message input
    setMessage("");

    // Update the messages state with the new user message and an empty assistant message
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
      // Send a POST request to the server with the current messages
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

      // Check if the network response is not ok
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Read the response body as a stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Process the streamed response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the streamed text and update the messages state with the new assistant message
        const text = decoder.decode(value, { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });
      }
    } catch (error) {
      // Log any errors that occur during the request
      console.error("Error:", error);

      // Update the messages state with an error message
      setMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content:
            "I'm sorry, but I encountered an error. Please try again later.",
        },
      ]);
    }

    // Set the loading state to false
    setIsLoading(false);
  };

  // Function to handle the key press event in the message input field
  const handleKeyPress = (event) => {
    // Check if the Enter key is pressed and if the Shift key is not pressed
    if (event.key === "Enter" && !event.shiftKey) {
      // Prevent the default behavior of the Enter key
      event.preventDefault();

      // Send the message
      sendMessage();
    }
  };

  // Render the chat interface
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        direction={"column"}
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        <Stack
          direction={"column"}
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === "assistant" ? "flex-start" : "flex-end"
              }
            >
              <Box
                bgcolor={
                  message.role === "assistant"
                    ? "primary.main"
                    : "secondary.main"
                }
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction={"row"} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
