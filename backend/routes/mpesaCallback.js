const express = require("express");
const Transaction = require("../models/Transaction");

const router = express.Router();

router.post("/mpesa/callback", async (req, res) => {
  const { Body } = req.body;

  try {
    if (Body.stkCallback.ResultCode === 0) {
      // Extract payment data from the callback
      const paymentData = Body.stkCallback.CallbackMetadata.Item.reduce(
        (acc, item) => ({ ...acc, [item.Name]: item.Value }),
        {}
      );

      // Create a new transaction record in MongoDB
      const transaction = new Transaction({
        TransactionID: paymentData.MpesaReceiptNumber,
        Amount: paymentData.Amount,
        PhoneNumber: paymentData.PhoneNumber,
        Status: "Success",
      });

      await transaction.save();

      console.log("Payment successful:", transaction);
    } else {
      console.log("Payment failed:", Body.stkCallback.ResultDesc);
    }

    res.status(200).json({ message: "Callback received" });
  } catch (err) {
    console.error("Error processing callback:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;