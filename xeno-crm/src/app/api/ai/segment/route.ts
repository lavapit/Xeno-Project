import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const systemInstruction = `You are a CRM segmentation assistant.
Convert the user's natural language query into a JSON filterQuery object.
The filterQuery can have these fields (if not mentioned in the query, DO NOT include them):
- minSpend: minimum total lifetime spend in rupees
- maxSpend: maximum total lifetime spend in rupees
- inactiveDays: customers whose last order was more than N days ago
- activeDays: customers who ordered within the last N days
- minOrders: minimum number of orders
- city: filter by city name (e.g. "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata")
- channel: preferred channel ("whatsapp", "sms", "email")

You must return a valid JSON object matching the requested schema.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        filterQuery: {
          type: "OBJECT",
          properties: {
            minSpend: { type: "NUMBER", description: "minimum total lifetime spend in rupees" },
            maxSpend: { type: "NUMBER", description: "maximum total lifetime spend in rupees" },
            inactiveDays: { type: "INTEGER", description: "customers whose last order was more than N days ago" },
            activeDays: { type: "INTEGER", description: "customers who ordered within the last N days" },
            minOrders: { type: "INTEGER", description: "minimum number of orders" },
            city: { type: "STRING", description: "filter by city name" },
            channel: { type: "STRING", description: "preferred channel" }
          }
        },
        explanation: { type: "STRING", description: "Brief explanation of how the query was parsed into filters" }
      },
      required: ["filterQuery", "explanation"]
    };

    const aiResponseText = await callGemini(
      `User query: "${query}"`,
      systemInstruction,
      responseSchema
    );

    let result: any = {};
    try {
      result = JSON.parse(aiResponseText);
      
      // If the model did not nest the filterQuery properly (e.g. returned it at the root)
      if (!result.filterQuery) {
        const fields = ['minSpend', 'maxSpend', 'inactiveDays', 'activeDays', 'minOrders', 'city', 'channel'];
        const hasAnyField = Object.keys(result).some(k => fields.includes(k));
        if (hasAnyField) {
          const filterQuery: any = {};
          for (const field of fields) {
            if (result[field] !== undefined) {
              filterQuery[field] = result[field];
            }
          }
          result = {
            filterQuery,
            explanation: result.explanation || result.reason || "Segment filters successfully extracted."
          };
        } else {
          result = {
            filterQuery: {},
            explanation: result.explanation || aiResponseText
          };
        }
      } else {
        // Ensure explanation is set
        if (!result.explanation) {
          result.explanation = "Segment filters successfully extracted.";
        }
      }
    } catch (e) {
      result = {
        filterQuery: {},
        explanation: aiResponseText
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in AI segment route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
