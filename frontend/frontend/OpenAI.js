import { useState } from 'react';
import axios from 'axios';

const Chatbot = () => {
    const [userMessage, setUserMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);

    const sendMessage = async () => {
        const response = await axios.post('http://localhost:4000/api/chatbot/', { userMessage });
        setChatHistory([...chatHistory, { user: userMessage }, { bot: response.data.botMessage }]);
        setUserMessage('');
    };

    return (
        <div>
            <div>
                {chatHistory.map((msg, index) => (
                    <p key={index}>{msg.user || msg.bot}</p>  
                ))}
            </div>
            <input
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Ask me anything!"
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chatbot;