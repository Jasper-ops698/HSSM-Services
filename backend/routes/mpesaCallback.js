const express = require("express");

const router = express.Router();

router.post("/mpesa/callback", (req, res) => {
  console.log("MPESA Callback:", req.body);

  // Process the payment status from MPESA
  const { Body } = req.body;

  if (Body.stkCallback.ResultCode === 0) {
    const paymentData = Body.stkCallback.CallbackMetadata.Item.reduce(
      (acc, item) => ({ ...acc, [item.Name]: item.Value }),
      {}
    );

    console.log("Payment Successful:", paymentData);
    // Update your database with payment details
  } else {
    console.log("Payment Failed:", Body.stkCallback.ResultDesc);
  }

  res.status(200).json({ message: "Callback received" });
});

module.exports = router;