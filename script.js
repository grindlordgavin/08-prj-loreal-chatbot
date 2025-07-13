/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Store the conversation history as an array of messages
let messages = [
  { role: "system", content: "You are a helpful assistant for L'Oréal. Only answer questions about L'Oréal's products . If a question is not about L'Oréal, politely explain that you can only answer questions about L'Oréal and its products. If the question is about beauty, beauty products, or cosmetics in general, ensure the response focuses and comes back to the products L'Oréal sells." }
];

// Simple markdown parser for bold (**text**) and italic (*text*)
function parseMarkdown(text) {
  // Replace **bold** with <strong>bold</strong>
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Replace *italic* with <em>italic</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return html;
}

// Function to add a message to the chat window
function addMessageToChat(role, content) {
  // Create a new div for the message
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("msg");
  msgDiv.classList.add(role === "user" ? "user" : "ai");
  // Use innerHTML to allow parsed markdown
  msgDiv.innerHTML = parseMarkdown(content);
  chatWindow.appendChild(msgDiv);
  // Scroll to the bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Set initial AI message (no emoji)
chatWindow.innerHTML = '';
addMessageToChat("ai", "Hello! How can I help you today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's input
  const userMsg = userInput.value.trim();
  if (!userMsg) return;

  // Add user's message to chat window
  addMessageToChat("user", userMsg);

  // Add user's message to conversation history
  messages.push({ role: "user", content: userMsg });

  // Clear the input box
  userInput.value = "";

  // Show a loading message
  addMessageToChat("ai", "Thinking...");

  try {
    // Send the conversation to the Cloudflare Worker proxy
    const response = await fetch(OPENAI_PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });
    const data = await response.json();
    // Get the AI's reply
    const aiReply = data.choices && data.choices[0] && data.choices[0].message.content
      ? data.choices[0].message.content
      : "Sorry, I couldn't get a response. Please try again.";
    // Add AI's reply to conversation history
    messages.push({ role: "assistant", content: aiReply });
    // Remove the loading message
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent === "Thinking...") {
      chatWindow.removeChild(loadingMsg);
    }
    // Add AI's reply to chat window
    addMessageToChat("ai", aiReply);
  } catch (error) {
    // Remove the loading message
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent === "Thinking...") {
      chatWindow.removeChild(loadingMsg);
    }
    addMessageToChat("ai", "Sorry, there was a problem connecting to the chatbot.");
  }
});
