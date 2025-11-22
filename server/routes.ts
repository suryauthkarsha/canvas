import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Helper to get GitHub access token
async function getGitHubAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Token not available');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  const data = await response.json();
  const connectionSettings = data.items?.[0];
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;
  
  if (!accessToken) {
    throw new Error('GitHub access token not found');
  }
  
  return accessToken;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for pushing to GitHub
  app.post("/api/push-to-github", async (req, res) => {
    try {
      const { repoUrl = "https://github.com/suryauthkarsha/canvas.git" } = req.body;
      
      const token = await getGitHubAccessToken();
      
      // Parse GitHub URL to extract username and repo name
      const urlMatch = repoUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(\.git)?$/);
      if (!urlMatch) {
        return res.status(400).json({ error: 'Invalid GitHub URL format' });
      }
      
      const username = urlMatch[1];
      const repoName = urlMatch[2];
      
      // Configure git
      const { execSync } = require('child_process');
      
      try {
        execSync('git config user.email "noreply@replit.com"');
        execSync('git config user.name "Replit"');
        execSync(`git remote remove origin`, { stdio: 'pipe' }).catch(() => {});
        execSync(`git remote add origin https://${token}@github.com/${username}/${repoName}.git`);
        execSync('git branch -M main');
        execSync('git push -u origin main', { stdio: 'pipe' });
      } catch (gitError) {
        console.error('Git push error:', gitError);
        throw gitError;
      }
      
      res.json({ 
        success: true, 
        repoUrl: `https://github.com/${username}/${repoName}`,
        message: 'Repository pushed successfully!'
      });
      
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      res.status(500).json({ error: 'Failed to push to GitHub: ' + error.message });
    }
  });

  // API endpoint for generating presentations using Gemini AI
  app.post("/api/generate-deck", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured. Please add GEMINI_API_KEY secret.' });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Act as a Senior Presentation Designer.
              User Request: "${prompt}".
              
              Generate a JSON structure for a presentation.
              CRITICAL: Check if user asked for a specific number of slides. If so, use that count. Otherwise default to 6.
              IMPORTANT: All text content must be plain text only. Do NOT use any markdown formatting like *text*, **text**, _text_, or any other formatting symbols.
              
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
              
              Return ONLY valid JSON. No markdown. All text must be plain text without any formatting symbols.`
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
