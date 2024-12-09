import React, { useState } from "react";
import axios from "axios";

const PaymentPage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Send payment request to backend
      const response = await axios.post("http://localhost:4000/api/mpesa/stk-push", {
        phoneNumber,
        amount,
      });

      // Use response data to provide detailed feedback
      if (response.data) {
        const { message: apiMessage, data } = response.data;
        setMessage(`Success: ${apiMessage}. Payment request ID: ${data.CheckoutRequestID}`);
      } else {
        setMessage("Payment initiated, but no additional information provided.");
      }
    } catch (err) {
      // Handle errors and show error message
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>MPESA Payment</h1>
      <input
        type="text"
        placeholder="Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handlePayment} disabled={loading}>
        {loading ? "Processing..." : "Pay with MPESA"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default PaymentPage;