import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for generating presentations using Gemini AI
  app.post("/api/generate-deck", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Act as a Senior Presentation Designer.
              User Request: "${prompt}".
              
              Generate a JSON structure for a presentation.
              CRITICAL: Check if user asked for a specific number of slides. If so, use that count. Otherwise default to 6.
              
              DESIGN SYSTEM:
              - 'Space Grotesk' headers.
              - 'Urbanist' body.
              
              REQUIRED LAYOUTS (Mix these):
              1. 'title-cyber': Main title, subtitle.
              2. 'timeline-horizontal': 4 distinct chronological steps.
              3. 'bento-grid': 4 cards with brief content.
              4. 'split-bleed': Image on right (50%), content on left.
              5. 'chart-bar': 4 data points.
              6. 'big-stat': One massive number with context.

              JSON Structure:
              {
                "title": "Deck Title",
                "slides": [
                  {
                    "layout": "title-cyber" | "timeline-horizontal" | "bento-grid" | "split-bleed" | "chart-bar" | "big-stat",
                    "title": "Slide Header",
                    "subtitle": "...",
                    "content": ["pt1", "pt2"],
                    "imagePrompt": "Abstract visual description...",
                    "timeline": [ { "year": "2023", "title": "...", "desc": "..." } ], 
                    "blocks": [ { "title": "...", "content": "..." } ],
                    "chart": { "labels": ["A","B","C","D"], "values": [80, 60, 40, 90], "label": "%" },
                    "stat": { "value": "150%", "label": "Growth" }
                  }
                ]
              }
              
              Return ONLY valid JSON. No markdown.`
            }]
          }]
        })
      });

      const data = await response.json();
      
      console.log('Gemini API response status:', response.status);
      console.log('Gemini API response:', JSON.stringify(data).substring(0, 200));
      
      if (!response.ok) {
        console.error('Gemini API error:', data);
        return res.status(500).json({ error: data.error?.message || 'API request failed' });
      }
      
      if (!data.candidates || !data.candidates[0]) {
        console.error('No candidates in response:', data);
        return res.status(500).json({ error: 'No presentation generated' });
      }

      let rawText = data.candidates[0].content.parts[0].text;
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      
      if (start !== -1 && end !== -1) {
        rawText = rawText.substring(start, end + 1);
      }
      
      const deck = JSON.parse(rawText);
      res.json(deck);
      
    } catch (error) {
      console.error('Error generating deck:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: 'Failed to generate presentation: ' + errorMessage });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
