import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export interface GeminiExtractedData {
  tipo: 'receita' | 'despesa';
  valor: number;
  categoria: string;
  descricao: string;
}

export interface VoiceTransactionPayload {
  audioBase64: string;
  mimeType?: string;
  userId?: string;
}

export async function processVoiceTransaction(payload: VoiceTransactionPayload) {
  const { audioBase64, mimeType = 'audio/webm', userId } = payload;

  if (!audioBase64) {
    throw new Error('Nenhum dado de áudio foi enviado.');
  }

  // Isolate pure Base64 data string (remove prefix like 'data:audio/webm;codecs=opus;base64,')
  const cleanBase64 = audioBase64.includes(',')
    ? audioBase64.split(',')[1].trim()
    : audioBase64.trim();

  // Extract clean MIME type without parameters (e.g., 'audio/webm' instead of 'audio/webm;codecs=opus')
  const rawMime = mimeType || (audioBase64.includes(';') ? audioBase64.split(';')[0].replace('data:', '') : 'audio/webm');
  const cleanMimeType = rawMime.split(';')[0].trim() || 'audio/webm';

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente (.env.local).');
  }

  // Initialize official Google GenAI SDK
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction =
    'Você é um extrator de dados financeiros. Ouça o áudio e devolva EXATAMENTE um objeto JSON com as seguintes chaves: "tipo" (receita ou despesa), "valor" (apenas números float), "categoria" (ex: Alimentação, Transporte, etc) e "descricao" (resumo curto). Ignore gírias e ruídos.';

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: cleanMimeType,
            },
          },
          {
            text: 'Extraia os dados financeiros deste áudio.',
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    },
  });

  const responseText = response.text || '';
  let extracted: GeminiExtractedData;

  try {
    extracted = JSON.parse(responseText);
  } catch (err) {
    console.error('Failed to parse Gemini output:', responseText, err);
    throw new Error('O Gemini não retornou um JSON válido.');
  }

  // Normalize extracted values
  const normalizedType = extracted.tipo?.toLowerCase() === 'receita' ? 'income' : 'expense';
  const normalizedAmount = typeof extracted.valor === 'number' ? extracted.valor : parseFloat(String(extracted.valor)) || 0;
  const description = extracted.descricao || 'Lançamento por Voz';
  const categoryName = extracted.categoria || (normalizedType === 'income' ? 'Outras Entradas' : 'Outras Saídas');

  let insertedTransaction = null;

  // If Supabase is configured and userId is present, persist directly in DB
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && userId) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Find best matching category for user
      const { data: userCategories } = await supabase
        .from('categories')
        .select('id, name, type')
        .eq('user_id', userId)
        .eq('type', normalizedType);

      let categoryId: string | null = null;
      if (userCategories && userCategories.length > 0) {
        const found = userCategories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase() ||
                 categoryName.toLowerCase().includes(c.name.toLowerCase()) ||
                 c.name.toLowerCase().includes(categoryName.toLowerCase())
        );
        categoryId = found ? found.id : userCategories[0].id;
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: tx, error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: userId,
            description,
            amount: normalizedAmount,
            type: normalizedType,
            date: today,
            category_id: categoryId,
            payment_method: 'Pix',
            is_paid: true,
            notes: `Processado por Gemini 3.6 Flash (${categoryName})`,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.warn('Supabase insert warning:', insertError.message);
      } else {
        insertedTransaction = tx;
      }
    } catch (dbErr) {
      console.warn('Database save error:', dbErr);
    }
  }

  return {
    success: true,
    message: 'Lançamento Registrado',
    extracted: {
      tipo: extracted.tipo,
      valor: normalizedAmount,
      categoria: categoryName,
      descricao: description,
    },
    transaction: insertedTransaction,
  };
}

// Serverless Handler (Vercel / Node)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await processVoiceTransaction(body);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/voice-transaction:', err);
    return res.status(500).json({
      error: err.message || 'Erro interno ao processar áudio com Gemini.',
    });
  }
}
