require('node:dns').setDefaultResultOrder('ipv4first');
const Order = require('../models/Order');
const User = require('../models/User');

const generateMockResponse = (message, userRole = 'Farmer') => {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hlo') || lowerMsg.includes('hey')) {
    return "Hello! I'm your AgriTech Assistant. How can I help you with your farming or marketplace needs today?";
  }
  if (lowerMsg.includes('apple') || lowerMsg.includes('appel')) {
    return "Apples require a cool, temperate climate and well-drained, loamy soil. We have several verified sellers offering high-quality apple seeds and suitable fertilizers. Would you like me to guide you to the marketplace?";
  }
  if (lowerMsg.includes('order') || lowerMsg.includes('track')) {
    if (userRole === 'Delivery') return "I see you're asking about orders. You can check and update the status of your assigned deliveries right in the Delivery Dashboard.";
    if (userRole === 'Manager') return "As a manager, you can view all pending orders and assign them to available delivery partners in the Manager Dashboard.";
    return "You can easily track your recent orders in your profile section. Do you have an order ID I can help you with?";
  }
  if (lowerMsg.includes('weather') || lowerMsg.includes('rain') || lowerMsg.includes('climate')) {
    return "It's always good to keep an eye on the weather! While my live weather feed is currently offline, make sure your crops have adequate drainage if heavy rain is expected in your region.";
  }
  if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('rate')) {
    return "Prices can vary depending on the seller, quality, and current market trends. You can check the 'Marketplace' tab to see real-time pricing for crops, seeds, and equipment.";
  }
  if (lowerMsg.includes('disease') || lowerMsg.includes('pest') || lowerMsg.includes('sick')) {
    return "Crop diseases can spread quickly. I recommend checking for discoloration on leaves or stems. You can find organic pesticides in our marketplace to safely treat your crops!";
  }
  
  return "That's a great question! I'm currently running in a lightweight offline mode, so my knowledge base is a bit limited right now. However, I'm still here to help you navigate the platform. Could you provide a bit more detail?";
};

// @desc    Get AI farming advice
// @route   POST /api/chat
// @access  Private
const getAgriAdvice = async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const { prompt } = req.body;
    
    if (!apiKey) {
      const reply = generateMockResponse(prompt || "");
      return res.status(200).json({ reply });
    }
    if (!prompt) {
      return res.status(400).json({ message: "Please provide a question or prompt." });
    }

    // Enforce agriculture context
    const contextPrompt = `You are a highly knowledgeable and friendly AI Agricultural Advisor, designed specifically to help farmers with growing crops, managing diseases, soil mechanics, and agricultural best practices. Provide an accurate and helpful response to the following query from a farmer. Answer clearly, accurately, and politely.\n\nQuery: ${prompt}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: contextPrompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error:", errorText);
      return res.status(500).json({ message: "Error contacting the AI service." });
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "Sorry, I could not generate a response.";

    res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ message: "Error contacting the AI service: " + error.message });
  }
};

// @desc    Platform Assistant Chat
// @route   POST /api/chat/assistant
// @access  Private
const handleAssistantChat = async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const { message, language } = req.body;
    const userRole = req.user.role;
    
    if (!apiKey) {
      const reply = generateMockResponse(message || "", userRole);
      return res.status(200).json({ reply });
    }

    // Gather context data based on user role to inform the AI
    let contextData = "";
    if (userRole === 'Buyer') {
      const orders = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 }).limit(3);
      const ordersList = orders.map(o => `ID: ${o._id}, Status: ${o.orderStatus}, Total: ₹${o.totalAmount}`).join(' | ');
      contextData = `User is a Buyer. Recent orders: ${ordersList || 'No recent orders'}.`;
    } else if (userRole === 'Manager') {
      const pendingOrders = await Order.countDocuments({ orderStatus: { $in: ['Pending', 'Waiting for Manager Review'] } });
      const activePartners = await User.countDocuments({ role: 'Delivery', availability_status: true });
      const total = await Order.countDocuments();
      const delivered = await Order.countDocuments({ orderStatus: 'Delivered' });
      contextData = `User is a Manager. Pending Orders: ${pendingOrders}. Active Delivery Partners: ${activePartners}. Total Orders: ${total}. Delivered Orders: ${delivered}.`;
    } else if (userRole === 'Delivery') {
      const myOrders = await Order.countDocuments({ deliveryPartner: req.user._id, orderStatus: { $in: ['Assigned to Delivery Partner', 'Picked Up', 'Out for Delivery'] } });
      const nextOrder = await Order.findOne({ deliveryPartner: req.user._id, orderStatus: 'Assigned to Delivery Partner' });
      contextData = `User is a Delivery Partner. Active deliveries: ${myOrders}. Next order ID to pick up: ${nextOrder ? nextOrder._id : 'None'}.`;
    } else if (userRole === 'Farmer') {
      contextData = `User is a Seller/Farmer. They can manage products and view sales in their dashboard.`;
    }

    const languageMap = {
      'en': 'English',
      'hi': 'Hindi',
      'kn': 'Kannada'
    };
    const requestedLanguage = languageMap[language] || 'English';
    const contextPrompt = `You are the AgriTech Platform Assistant. Answer the user's query politely, accurately, and concisely. Please provide your entire response in ${requestedLanguage}. Use the following real-time system context about the user's account to answer their questions: [${contextData}]\n\nUser Query: ${message}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: contextPrompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter Error in Assistant:", errorText);
      return res.status(500).json({ reply: "I am having trouble connecting to the intelligence server right now." });
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "Sorry, I could not generate a response.";

    res.status(200).json({ reply: responseText });
  } catch (error) {
    console.error("Platform Chat Error:", error);
    res.status(500).json({ message: "Chatbot error.", reply: "An error occurred while fetching the response." });
  }
};

module.exports = {
  getAgriAdvice,
  handleAssistantChat
};
