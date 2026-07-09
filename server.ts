import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Allow large payloads for uploading PDF base64 strings
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy init of Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Parse PDF route
app.post("/api/parse-pdf", async (req, res) => {
  try {
    const { pdfBase64, fileName } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "Missing pdfBase64 in request body." });
    }

    // Strip out base64 header if present (e.g. "data:application/pdf;base64,")
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: cleanBase64,
          },
        },
        {
          text: `You are an expert medical radiation safety officer. Extract the technical radiology personnel radiation dose records from this PDF file (the report is typically about "รายงานผลการวัดปริมาณรังสีบุคคล" or "personal radiation dose report" of radiology department / แผนกรังสีเทคนิค).

Identify and extract:
1. The reporting period (e.g., ไตรมาส 1/2569, มกราคม-มีนาคม 2569, ประจำเดือน เมษายน 2569).
2. The year (e.g., 2569, 2026).
3. The hospital or organization name (if mentioned).
4. The department or section (if mentioned).
5. A list of personal dose records, including:
   - employeeId: can be Dosemeter Badge ID, Serial Number, or Personnel ID (เลขที่เครื่องวัดรังสี / รหัสบุคคล).
   - employeeName: full Thai or English name (ชื่อ-นามสกุล). Must be parsed accurately.
   - position: job title like นักรังสีการแพทย์, พยาบาล, แพทย์, ผู้ช่วย, if available.
   - deepDose: Hp(10) deep dose in mSv (millisieverts) as a floating-point number. If it says "M" (minimum detection limit), "< 0.1", "ND", "Undetected", "ไม่พบปริมาณรังสี", or "น้อยกว่าเกณฑ์การวัด", represent it as 0.0 or a low number like 0.05, but default to 0.0 if not specified.
   - shallowDose: Hp(0.07) shallow dose in mSv as a number if specified, otherwise 0.0.
   - remarks: any note like "M" (Minimum), "Below limit", "เครื่องสูญหาย" (Badge Lost), etc.

If some fields are not present, do your best to infer or leave them empty. Always return a valid JSON matching the specified responseSchema.`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            period: {
              type: Type.STRING,
              description: "The reporting period of the dose, e.g. 'ไตรมาส 1/2569' or 'มกราคม 2569'",
            },
            year: {
              type: Type.INTEGER,
              description: "The year of the dose records, converted to Buddhist Era (พ.ศ.) if possible, e.g., 2569 or 2026",
            },
            organization: {
              type: Type.STRING,
              description: "The hospital or medical center name",
            },
            department: {
              type: Type.STRING,
              description: "The department, usually 'แผนกรังสีเทคนิค' or 'ฝ่ายรังสีวิทยา'",
            },
            records: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  employeeId: {
                    type: Type.STRING,
                    description: "Employee or badge serial number",
                  },
                  employeeName: {
                    type: Type.STRING,
                    description: "The employee's full name",
                  },
                  position: {
                    type: Type.STRING,
                    description: "Position of employee, e.g., นักรังสีการแพทย์",
                  },
                  deepDose: {
                    type: Type.NUMBER,
                    description: "Hp(10) deep dose in mSv. Numeric value.",
                  },
                  shallowDose: {
                    type: Type.NUMBER,
                    description: "Hp(0.07) shallow dose in mSv if available. Numeric value.",
                  },
                  remarks: {
                    type: Type.STRING,
                    description: "Remarks or status, e.g. M, Below limit",
                  },
                },
                required: ["employeeName", "deepDose"],
              },
            },
          },
          required: ["records"],
        },
      },
    });

    const textResult = response.text;
    if (!textResult) {
      return res.status(500).json({ error: "No response text received from Gemini API." });
    }

    const parsedData = JSON.parse(textResult.trim());
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error parsing PDF via Gemini:", error);
    res.status(500).json({
      error: error.message || "Failed to parse PDF file.",
      details: error.stack,
    });
  }
});

// Vite Middleware integration
async function main() {
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
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Server startup error:", err);
});
