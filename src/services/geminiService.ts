import Groq from "groq-sdk";

// Initialize Groq client
// Note: In this environment, we access the key via process.env.GROQ_API_KEY
const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY || "",
  dangerouslyAllowBrowser: true // Required for client-side usage in this preview
});

export interface DefectAnalysis {
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  rootCause: string;
  suggestedAction: string;
}

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function analyzeDefect(title: string, description: string): Promise<DefectAnalysis> {
  const prompt = `
    Analyze the following quality defect report from a textile/garment manufacturing unit (Ginza Industries Ltd).
    
    Title: ${title}
    Description: ${description}
    
    Provide a structured analysis in JSON format with the following fields:
    - category: A concise category (e.g., Fabric Defect, Printing Issue, Stitching Problem, Dyeing Issue, etc.)
    - severity: One of 'Low', 'Medium', 'High', 'Critical'
    - rootCause: A brief potential root cause based on the description
    - suggestedAction: A brief suggested immediate action
    
    Return ONLY the raw JSON object. Do not include markdown formatting.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: DEFAULT_MODEL,
      response_format: { type: "json_object" }
    });

    const text = chatCompletion.choices[0]?.message?.content;
    if (!text) throw new Error("No response from Groq");
    
    return JSON.parse(text.trim()) as DefectAnalysis;
  } catch (error) {
    console.error("Groq Analysis failed:", error);
    throw error;
  }
}

export async function summarizeEscalations(escalations: any[]): Promise<string> {
  const data = escalations.map(e => ({
    title: e.title,
    status: e.status,
    unit: e.unit,
    description: e.description.substring(0, 100)
  }));

  const prompt = `
    Summarize the following quality escalation reports for Ginza Industries Ltd.
    Identify key trends, critical units, and suggest top 3 priorities for management.
    
    Data: ${JSON.stringify(data)}
    
    Keep the summary professional, concise, and actionable. Use bullet points.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: DEFAULT_MODEL,
    });

    return chatCompletion.choices[0]?.message?.content || "Unable to generate summary.";
  } catch (error) {
    console.error("Groq Summary failed:", error);
    return "AI Summary failed to load. Please check if the Groq API key is valid.";
  }
}
