// AI Service for Velora Marketplace
// Uses OpenAI via direct API calls (for React Native/Expo compatibility)

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface GenerateDescriptionParams {
  productName: string;
  category: string;
  type: 'physical' | 'digital' | 'membership' | 'course';
  keywords?: string;
}

interface PricingSuggestionParams {
  productName: string;
  category: string;
  type: 'physical' | 'digital' | 'membership' | 'course';
  description?: string;
  targetMarket?: string;
}

interface AIResponse {
  success: boolean;
  data?: string;
  error?: string;
}

const getApiKey = () => {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your environment.');
  }
  return key;
};

export async function generateProductDescription(params: GenerateDescriptionParams): Promise<AIResponse> {
  try {
    const apiKey = getApiKey();
    
    const prompt = `You are a professional product copywriter for an African B2B marketplace called Velora. 
Generate a compelling product description for:

Product Name: ${params.productName}
Category: ${params.category || 'General'}
Type: ${params.type}
${params.keywords ? `Keywords to include: ${params.keywords}` : ''}

Requirements:
- Write in a professional but friendly tone
- Highlight key benefits and features
- Keep it concise (2-3 paragraphs max)
- Make it appealing for B2B buyers in Africa
- Include a call-to-action at the end

Return ONLY the product description, no additional commentary.`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate description');
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim();

    if (!description) {
      throw new Error('No description generated');
    }

    return { success: true, data: description };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function suggestPricing(params: PricingSuggestionParams): Promise<AIResponse> {
  try {
    const apiKey = getApiKey();
    
    const prompt = `You are a pricing consultant for an African B2B marketplace called Velora, operating primarily in Uganda.
Suggest optimal pricing for:

Product Name: ${params.productName}
Category: ${params.category || 'General'}
Type: ${params.type}
${params.description ? `Description: ${params.description}` : ''}
${params.targetMarket ? `Target Market: ${params.targetMarket}` : 'Target Market: Small to medium businesses in Uganda'}

Requirements:
- Provide pricing in UGX (Ugandan Shillings)
- Consider local market conditions and purchasing power
- Suggest a range (minimum, recommended, premium)
- Brief explanation of the pricing strategy (1-2 sentences)

Format your response as:
MINIMUM: [amount] UGX
RECOMMENDED: [amount] UGX  
PREMIUM: [amount] UGX
STRATEGY: [brief explanation]`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to suggest pricing');
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim();

    if (!suggestion) {
      throw new Error('No pricing suggestion generated');
    }

    return { success: true, data: suggestion };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateChatResponse(messages: Array<{ role: 'user' | 'assistant'; content: string }>, context?: string): Promise<AIResponse> {
  try {
    const apiKey = getApiKey();
    
    const systemMessage = `You are Velora AI, a helpful assistant for the Velora B2B marketplace in Africa. 
You help buyers and sellers with:
- Product inquiries and recommendations
- Pricing negotiations
- Order and shipping questions
- General marketplace support

${context ? `Context: ${context}` : ''}

Keep responses concise, professional, and helpful. If you don't know something specific about an order or product, suggest the user contact the seller directly.`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate response');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error('No response generated');
    }

    return { success: true, data: reply };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
