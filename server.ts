import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits to support base64 uploads (PDFs, images)
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// 1. API: Intelligently categorize a manual description & amount
app.post("/api/categorize", async (req, res) => {
  try {
    const { description, amount, type } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    const systemPrompt = `You are an expert startup accountant. Analyze the description and amount of a business transaction, and return the most appropriate category and standard accounting classification.
    
    Accounting Types allowed:
    - 'trading_revenue': Core business sales income (Trading Account credit)
    - 'trading_cogs': Cost of Sales directly tied to goods/production, e.g. raw inventory, manufacturing, direct shipping (Trading Account debit)
    - 'opex': Standard operating expenses / overhead, e.g. SaaS software, office rent, utilities, marketing, salaries, travel (P&L Account debit)
    - 'asset': Capital assets purchased, accounts receivable, or cash (Balance Sheet asset)
    - 'liability': Debt, credits, accounts payable, business loans (Balance Sheet liability)
    - 'equity': Capital injection, drawings, equity (Balance Sheet equity)
    
    Be precise. For example, 'AWS servers' is 'opex' (category: 'Hosting & Infrastructure'). 'Bought inventory shirts for resale' is 'trading_cogs' (category: 'Direct Cost / Inventory'). 'Customer paid for premium plan' is 'trading_revenue' (category: 'Sales Income'). 'Bought laptop for employee' is 'asset' (category: 'Office Equipment'). 'Took business loan' is 'liability' (category: 'Bank Loan').`;

    const userPrompt = `Transaction details:
    Description: "${description}"
    Amount: ${amount || 0}
    Current direction helper: ${type || 'unknown'} (is it money coming in or out?)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "A friendly category name like 'SaaS Subscriptions', 'Direct Inventory', 'Office Rent', 'Client Sales', 'Office Equipment'",
            },
            accountingType: {
              type: Type.STRING,
              description: "Must be exactly one of: 'trading_revenue', 'trading_cogs', 'opex', 'asset', 'liability', 'equity'",
            },
            transactionType: {
              type: Type.STRING,
              description: "Must be 'income' if positive inflow or sales, or 'expense' if spending, outflow, asset purchases",
            },
            explanation: {
              type: Type.STRING,
              description: "A 1-sentence simple professional accountant's explanation of why this classification was chosen.",
            },
          },
          required: ["category", "accountingType", "transactionType", "explanation"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/categorize:", error);
    res.status(500).json({ error: error.message || "Failed to categorize transaction" });
  }
});

// 2. API: Parse uploaded bills or receipts (Image / PDF)
app.post("/api/parse-bill", async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName } = req.body;

    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ error: "fileBase64 and mimeType are required" });
    }

    // Clean base64 string from data URL prefixes if present
    const cleanBase64 = fileBase64.replace(/^data:.+;base64,/, "");

    const systemPrompt = `You are a high-speed AI billing scanner and professional accountant. Analyze the uploaded bill, invoice, or receipt. Extract all critical details to log a perfect transaction.
    
    Analyze and map the transaction to one of the following Accounting Types:
    - 'trading_revenue': Core business sales income (Trading Account credit)
    - 'trading_cogs': Cost of Sales directly tied to goods/production, e.g. wholesale raw inventory, manufacturing, server APIs sold as cost (Trading Account debit)
    - 'opex': Standard operating expenses / overhead, e.g. SaaS subscriptions, marketing, office space, utilities, travels (P&L Account debit)
    - 'asset': Purchases of high-value equipment like computers, furniture, vehicles, patents (Balance Sheet asset)
    - 'liability': Credit cards bills, loan statements, tax payables (Balance Sheet liability)
    - 'equity': Equity injections, owner drawings
    
    If the document is a bill or invoice from a supplier, the transaction type is almost certainly an 'expense' or 'trading_cogs' or 'asset'. If it is a client invoice, receipt, or merchant payout summary, it is 'income' / 'trading_revenue'.
    
    Format the date as YYYY-MM-DD. If no date is found, use the current date "${new Date().toISOString().split('T')[0]}".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        },
        {
          text: `Please parse this bill/invoice named "${fileName || 'document'}" and extract structured business metrics.`,
        },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vendor: {
              type: Type.STRING,
              description: "The name of the vendor, business, seller, or customer. e.g. 'Amazon Web Services', 'Stripe', 'WeWork'",
            },
            amount: {
              type: Type.NUMBER,
              description: "The total gross amount of the bill/receipt in numeric value.",
            },
            date: {
              type: Type.STRING,
              description: "The date of the invoice/bill in YYYY-MM-DD format.",
            },
            category: {
              type: Type.STRING,
              description: "A standard category category e.g., 'Hosting Services', 'Office Space', 'SaaS Tools', 'Advertising', 'Direct Raw Inventory'",
            },
            accountingType: {
              type: Type.STRING,
              description: "Exactly one of: 'trading_revenue', 'trading_cogs', 'opex', 'asset', 'liability', 'equity'",
            },
            transactionType: {
              type: Type.STRING,
              description: "Exactly 'expense' or 'income'. Defaults to 'expense' for bills and receipts.",
            },
            description: {
              type: Type.STRING,
              description: "Brief summary of the items on the bill (e.g. 'AWS Cloud Monthly Compute & Storage Bill').",
            },
          },
          required: ["vendor", "amount", "date", "category", "accountingType", "transactionType", "description"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/parse-bill:", error);
    res.status(500).json({ error: error.message || "Failed to scan and parse bill with Gemini" });
  }
});

// Configure Vite or Static Asset delivery
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FounderLedger server listening at http://localhost:${PORT}`);
  });
}

startServer();
