import React, { useState, useEffect } from "react";
import axios from "axios";

const PaymentHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/transactions");
        setTransactions(response.data);
      } catch (err) {
        setError("Error fetching transaction history.");
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div>
      <h1>Payment History</h1>
      {error && <p>{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Amount</th>
            <th>Phone Number</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.TransactionID}>
              <td>{transaction.TransactionID}</td>
              <td>{transaction.Amount}</td>
              <td>{transaction.PhoneNumber}</td>
              <td>{transaction.Status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistoryPage;