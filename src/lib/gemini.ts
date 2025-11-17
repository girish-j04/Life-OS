import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedCapture, ParsedTask, ParsedEvent, ParsedTransaction, DossierPayload } from '@/types';
import { format } from 'date-fns';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function parseCapture(input: string): Promise<ParsedCapture> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are an AI assistant that parses natural language input and extracts structured data. Parse the following input and determine if it's a task, event, expense, income, or note.

Current date and time: ${format(new Date(), 'yyyy-MM-dd HH:mm')}

Input: "${input}"

Analyze the input and respond with ONLY valid JSON in this exact format:

For TASKS (reminders, todos, things to do):
{
  "type": "task",
  "data": {
    "title": "string",
    "description": "string (optional)",
    "dueDate": "ISO 8601 date string (optional)",
    "priority": "high|medium|low (optional, default medium)",
    "isRecurring": boolean,
    "recurrenceRule": "string like 'every monday' (optional)"
  }
}

For EVENTS (meetings, appointments, calendar items with specific time and duration):
{
  "type": "event",
  "data": {
    "title": "string",
    "description": "string (optional)",
    "startTime": "ISO 8601 date string with time",
    "endTime": "ISO 8601 date string with time",
    "location": "string (optional)",
    "isRecurring": boolean,
    "recurrenceRule": "string (optional)"
  }
}

For EXPENSES (spent money):
{
  "type": "expense",
  "data": {
    "amount": number,
    "category": "Food & Dining|Housing|Transportation|Entertainment|Shopping|Health|Work|Subscriptions|Other",
    "description": "string (optional)",
    "date": "ISO 8601 date string (optional, default today)"
  }
}

For INCOME (received money):
{
  "type": "income",
  "data": {
    "amount": number,
    "category": "Salary|Freelance|Investment|Gift|Other",
    "description": "string (optional)",
    "date": "ISO 8601 date string (optional, default today)"
  }
}

For NOTES (information to remember, facts, ideas):
{
  "type": "note",
  "data": {
    "title": "string (optional, can be generated from first few words)",
    "content": "string",
    "tags": ["array", "of", "strings"] (optional)
  }
}

Rules:
- Understand relative dates: "tomorrow", "next monday", "in 2 weeks", etc.
- Understand times: "at 3pm", "morning" (9am), "afternoon" (2pm), "evening" (6pm)
- Extract dollar amounts: "$45", "45 dollars", "20 bucks" → 45, 45, 20
- Default event duration is 1 hour if not specified
- Auto-categorize expenses based on keywords (coffee/restaurant→Food & Dining, uber/gas→Transportation, etc.)
- Tasks have a due date/time but no duration, Events have start AND end times
- Use priority "high" for urgent words like "urgent", "asap", "important"
- Return ONLY the JSON, no markdown formatting, no extra text

Respond now:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanText) as ParsedCapture;

    // Convert date strings to Date objects
    if (parsed.type === 'task') {
      const taskData = parsed.data as ParsedTask;
      if (taskData.dueDate) {
        taskData.dueDate = new Date(taskData.dueDate);
      }
    } else if (parsed.type === 'event') {
      const eventData = parsed.data as ParsedEvent;
      eventData.startTime = new Date(eventData.startTime);
      eventData.endTime = new Date(eventData.endTime);
    } else if (parsed.type === 'expense' || parsed.type === 'income') {
      const transactionData = parsed.data as ParsedTransaction;
      if (transactionData.date) {
        transactionData.date = new Date(transactionData.date);
      }
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing capture:', error);
    throw new Error('Failed to parse input. Please try rephrasing.');
  }
}

export async function generateResearchDossier(topic: string, focus?: string): Promise<DossierPayload> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const refinedFocus = focus?.trim() || `Key insights about ${topic}`;

  const prompt = `You are an expert researcher. Build a concise dossier about the topic below.

Topic: ${topic}
Focus question: ${refinedFocus}
Date: ${format(new Date(), 'yyyy-MM-dd')}

Respond ONLY with JSON in the following format:
{
  "topic": "string",
  "focus": "string",
  "summary": "2-3 sentence overview",
  "keyInsights": [
    "bullet insight with concrete detail",
    "..."
  ],
  "actionItems": [
    "next best action framed as verb + object",
    "..."
  ],
  "references": [
    {
      "title": "short source label",
      "url": "https://source.com/path"
    }
  ]
}

Guidelines:
- Only include 3-5 keyInsights that combine facts + implications.
- Action items should be practical next steps.
- Provide at least 2 reputable references with valid URLs (prefer primary sources, papers, or well-known sites).
- Keep strings concise and avoid markdown or extra commentary.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText) as DossierPayload;
    return {
      topic: parsed.topic || topic,
      focus: parsed.focus || refinedFocus,
      summary: parsed.summary,
      keyInsights: parsed.keyInsights || [],
      actionItems: parsed.actionItems || [],
      references: parsed.references || [],
    };
  } catch (error) {
    console.error('Error generating dossier:', error);
    throw new Error('Failed to build dossier. Please try again.');
  }
}
