import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Allow payloads for image analysis (up to 30mb)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

const getApiKey = () => process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey: getApiKey(),
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'CarVision AI',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Car Detection Endpoint matching CarVision AI requirements
app.post('/api/detect-car', async (req: Request, res: Response) => {
  try {
    const { image, mimeType = 'image/jpeg' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please ensure the API key is active.',
      });
    }

    // Clean up base64 string if it contains data prefix
    let cleanBase64 = image;
    let detectedMime = mimeType;
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedMime = match[1];
        cleanBase64 = match[2];
      }
    }

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: detectedMime,
      },
    };

    const promptText = `You are CarVision AI, an expert computer vision and automotive image analysis system.
Analyze the provided image thoroughly for motor vehicles (cars, SUVs, sedans, hatchbacks, coupes, pickup trucks, vans, sports cars).

STRICT RULES & BEHAVIOR:
1. Detect whether ANY car or passenger motor vehicle is present.
2. If NO car is detected:
   - "car_detected": false
   - "message": "No car detected. Please upload a clear image containing a car."
   - "cars": []
3. If one or more cars are detected:
   - "car_detected": true
   - For EACH visible car (up to 4 cars if multiple are present):
     * "make": Brand name (e.g. "Toyota", "BMW", "Hyundai", "Honda", "Porsche", "Mercedes-Benz", "Ford", "Audi", "Tesla", "Volkswagen", "Kia", "Suzuki").
     * "model": Exact model name (e.g. "Creta", "Innova", "3 Series", "Civic", "911 Carrera", "Mustang", "Corolla", "Swift").
       CRITICAL: If the image does not provide enough evidence or resolution to reliably identify the exact model (model_confidence < 0.60), do NOT invent an answer! Instead, output: "Model could not be reliably identified."
     * "colour": Dominant exterior paint colour name (e.g. "White", "Black", "Red", "Blue", "Silver Metallic", "Nardo Gray", "Racing Yellow").
     * "colour_hex": The closest representative 6-character hex code for the paint swatch (e.g. "#FFFFFF", "#1E1E24", "#D72638", "#2E5BFF").
     * "make_confidence": Float between 0.0 and 1.0 (e.g. 0.94 for 94%).
     * "model_confidence": Float between 0.0 and 1.0 (e.g. 0.87 for 87%).
     * "colour_confidence": Float between 0.0 and 1.0 (e.g. 0.98 for 98%).
     * "bounding_box": Bounding coordinates in percentage 0 to 100: ymin, xmin, ymax, xmax.
     * "body_type": e.g. "SUV", "Sedan", "Coupe", "Hatchback", "Truck", "Convertible".
     * "year_estimate": e.g. "2020 - 2024".
     * "notes": Brief note on visual cues (e.g. "Signature cascading front grille, LED daytime running lights visible").
4. If multiple cars are present, detect all of them and supply bounding boxes for each so the user can select between them.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [imagePart, { text: promptText }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            car_detected: { type: Type.BOOLEAN },
            message: { type: Type.STRING },
            cars: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  make: { type: Type.STRING },
                  model: { type: Type.STRING },
                  colour: { type: Type.STRING },
                  colour_hex: { type: Type.STRING },
                  make_confidence: { type: Type.NUMBER, description: 'Float between 0.0 and 1.0' },
                  model_confidence: { type: Type.NUMBER, description: 'Float between 0.0 and 1.0' },
                  colour_confidence: { type: Type.NUMBER, description: 'Float between 0.0 and 1.0' },
                  bounding_box: {
                    type: Type.OBJECT,
                    properties: {
                      ymin: { type: Type.NUMBER },
                      xmin: { type: Type.NUMBER },
                      ymax: { type: Type.NUMBER },
                      xmax: { type: Type.NUMBER },
                    },
                    required: ['ymin', 'xmin', 'ymax', 'xmax'],
                  },
                  body_type: { type: Type.STRING },
                  year_estimate: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: [
                  'make',
                  'model',
                  'colour',
                  'make_confidence',
                  'model_confidence',
                  'colour_confidence',
                ],
              },
            },
          },
          required: ['car_detected', 'cars'],
        },
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    // Ensure fallback message if no car detected
    if (!parsedData.car_detected && !parsedData.message) {
      parsedData.message = 'No car detected. Please upload a clear image containing a car.';
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (err: any) {
    console.error('Error analyzing vehicle:', err);
    return res.status(500).json({
      error: err.message || 'Failed to detect vehicle from image',
    });
  }
});

// Follow-up Automotive Assistant Endpoint
app.post('/api/car-assistant', async (req: Request, res: Response) => {
  try {
    const { question, carContext } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const prompt = `You are CarVision AI Assistant in an Android mobile app.
Car currently inspected:
- Make: ${carContext?.make || 'Unknown'}
- Model: ${carContext?.model || 'Unknown'}
- Colour: ${carContext?.colour || 'Unknown'}
- Year: ${carContext?.year_estimate || 'Unknown'}
- Body Type: ${carContext?.body_type || 'Unknown'}

User question: "${question}"

Provide a concise, helpful, automotive-expert response (under 150 words) answering their inquiry about this car's performance, pricing, maintenance, trim levels, or specifications.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      success: true,
      answer: response.text,
    });
  } catch (err: any) {
    console.error('Error in car assistant:', err);
    return res.status(500).json({
      error: err.message || 'Failed to get answer from AI assistant',
    });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`CarVision AI Server running on port ${PORT}`);
  });
}

startServer();
