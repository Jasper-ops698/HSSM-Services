const express = require("express");
const axios = require("axios");
const { getMpesaToken } = require("../utils/mpesa");
require("dotenv").config();

const router = express.Router();

router.post("/mpesa/stk-push", async (req, res) => {
  const { phoneNumber, amount } = req.body;

  try {
    const token = await getMpesaToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: "https://multi-shop-chi.vercel.app/api/mpesa/callback",
        AccountReference: "ECommerceApp",
        TransactionDesc: "Payment for services",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.status(200).json({ message: "STK Push initiated", data: response.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;