import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AiResponseSchema, Language, DocumentContext, QuizQuestion, FlashcardItem, PresentationStructure, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    suggestedName: {
      type: Type.STRING,
      description: "A clean filename ending in .pdf. Format: YYYY-MM-DD_Entity_Category.pdf",
    },
    date: {
      type: Type.STRING,
      description: "The primary date found in the document (YYYY-MM-DD).",
    },
    entity: {
      type: Type.STRING,
      description: "The company, person, or organization the document belongs to.",
    },
    category: {
      type: Type.STRING,
      description: "Invoice, Contract, Receipt, Report, Manual, etc.",
    },
    summary: {
      type: Type.STRING,
      description: "A very brief 1-sentence summary of content.",
    }
  },
  required: ["suggestedName", "date", "entity", "category", "summary"],
};

export const analyzePdfContent = async (
  text: string, 
  originalFilename: string, 
  lang: Language, 
  context: DocumentContext
): Promise<AiResponseSchema> => {
  try {
    let contextInstruction = "";
    if (context === 'FINANCE') contextInstruction = "Focus deeply on Invoice Numbers, Amounts, and financial dates. Filename should look like: YYYY-MM-DD_Entity_InvoiceNum.pdf";
    if (context === 'LEGAL') contextInstruction = "Focus on Parties involved and Contract Type. Filename should look like: YYYY-MM-DD_ContractType_Parties.pdf";
    if (context === 'EDUCATION') contextInstruction = "Focus on Subject, Topic, and Chapter. Filename should look like: Subject_Topic_Date.pdf";
    
    const prompt = `
    You are an expert file organizer. Analyze the text content of this PDF file.
    Original Filename: ${originalFilename}
    Target Language: ${lang} (Output the Summary and Category in ${lang}, but keep the Filename format standard ASCII if possible).
    
    Context: ${contextInstruction}

    Document Text Context:
    ${text.substring(0, 10000)} 
    
    Instructions:
    1. Identify the document date. If none, use today.
    2. Identify the entity (sender/creator).
    3. Categorize the document (In ${lang}).
    4. Create a standardized filename.
    5. Provide a short summary (In ${lang}).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AiResponseSchema;
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// --- STUDY FEATURES ---

const quizSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      answerIndex: { type: Type.INTEGER, description: "Index (0-3) of the correct option" }
    },
    required: ["question", "options", "answerIndex"]
  }
};

const flashcardSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      front: { type: Type.STRING, description: "The concept or question" },
      back: { type: Type.STRING, description: "The definition or answer" }
    },
    required: ["front", "back"]
  }
};

export const generateQuiz = async (text: string, lang: Language): Promise<QuizQuestion[]> => {
  try {
    const prompt = `
    Generate 10 challenging multiple-choice questions based on the following text.
    Target Language: ${lang}.
    Format: JSON Array.
    Text: ${text.substring(0, 15000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizQuestion[];
    }
    throw new Error("Failed to generate quiz");
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    throw error;
  }
};

export const generateFlashcards = async (text: string, lang: Language): Promise<FlashcardItem[]> => {
  try {
    const prompt = `
    Generate 12 key concept flashcards (Front: Term/Question, Back: Definition/Answer) based on the text.
    Target Language: ${lang}.
    Format: JSON Array.
    Text: ${text.substring(0, 15000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: flashcardSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as FlashcardItem[];
    }
    throw new Error("Failed to generate flashcards");
  } catch (error) {
    console.error("Gemini Flashcard Error:", error);
    throw error;
  }
};

// --- PRESENTATION FEATURES ---

const pptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    mainTitle: { type: Type.STRING, description: "Catchy title for the presentation" },
    subtitle: { type: Type.STRING, description: "Subtitle or tagline" },
    slides: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Slide Title" },
          bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 concise bullet points" },
          speakerNotes: { type: Type.STRING, description: "Detailed notes for the speaker to say" }
        },
        required: ["title", "bulletPoints", "speakerNotes"]
      }
    }
  },
  required: ["mainTitle", "subtitle", "slides"]
};

export const generatePresentationData = async (text: string, lang: Language): Promise<PresentationStructure> => {
  try {
    const prompt = `
    Act as a Presentation Designer. Create a structure for a PowerPoint presentation based on the document text.
    The presentation should summarize the key points effectively.
    Target Language: ${lang}.
    Limit: 5-8 Slides.
    Format: JSON.
    Text: ${text.substring(0, 20000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pptSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as PresentationStructure;
    }
    throw new Error("Failed to generate presentation structure");
  } catch (error) {
    console.error("Gemini PPT Error:", error);
    throw error;
  }
};

// --- EXCEL TEMPLATE FEATURES ---

const structuredDataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    fecha: { 
      type: Type.STRING, 
      description: "Fecha del documento en formato YYYY-MM-DD o DD/MM/YYYY" 
    },
    total: { 
      type: Type.STRING, 
      description: "Monto total, importe total o total amount (solo número, sin símbolos de moneda)" 
    },
    impuesto: { 
      type: Type.STRING, 
      description: "IVA, impuesto, tax amount (solo número)" 
    },
    subtotal: { 
      type: Type.STRING, 
      description: "Subtotal, base imponible, subtotal amount (solo número)" 
    },
    empresa: { 
      type: Type.STRING, 
      description: "Nombre de la empresa emisora, proveedor, vendedor o supplier" 
    },
    cliente: { 
      type: Type.STRING, 
      description: "Nombre del cliente, comprador o customer" 
    },
    numero: { 
      type: Type.STRING, 
      description: "Número de factura, invoice number, número de documento" 
    },
    concepto: { 
      type: Type.STRING, 
      description: "Concepto principal, descripción o description del documento" 
    },
    moneda: { 
      type: Type.STRING, 
      description: "Código de moneda (EUR, USD, MXN, etc.)" 
    },
    // Campos adicionales comunes
    direccion: { 
      type: Type.STRING, 
      description: "Dirección de la empresa o cliente" 
    },
    rfc: { 
      type: Type.STRING, 
      description: "RFC, NIF, Tax ID o identificador fiscal" 
    },
    email: { 
      type: Type.STRING, 
      description: "Email de contacto" 
    },
    telefono: { 
      type: Type.STRING, 
      description: "Teléfono de contacto" 
    },
  },
  required: [],
};

/**
 * Extrae datos estructurados de un texto de PDF para rellenar plantillas Excel
 * @param text - Texto del PDF
 * @param lang - Idioma para la extracción
 * @param targetKeys - (Opcional) Lista de claves específicas a buscar. Si se proporciona, la IA buscará SOLO estos campos.
 */
export const extractStructuredData = async (
  text: string,
  lang: Language = 'ES',
  targetKeys?: string[]
): Promise<Record<string, any>> => {
  try {
    const langInstructions = lang === 'ES' 
      ? "Extrae los datos en español. Si no encuentras un campo, déjalo vacío o null."
      : "Extract data in English. If a field is not found, leave it empty or null.";
    
    // Construir schema dinámico si hay targetKeys
    let dynamicSchema = structuredDataSchema;
    if (targetKeys && targetKeys.length > 0) {
      // Crear un schema que incluya los campos estándar + los campos personalizados
      const customProperties: Record<string, any> = { ...structuredDataSchema.properties };
      
      // Agregar cada clave personalizada al schema (normalizada a minúsculas para el schema)
      targetKeys.forEach(key => {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
        if (!customProperties[normalizedKey]) {
          customProperties[normalizedKey] = {
            type: Type.STRING,
            description: `Campo personalizado: ${key}. Busca este valor específico en el documento.`
          };
        }
      });
      
      dynamicSchema = {
        type: Type.OBJECT,
        properties: customProperties,
        required: [],
      };
    }
    
    // Si hay targetKeys, usar extracción dirigida (modo francotirador)
    let extractionInstructions = '';
    if (targetKeys && targetKeys.length > 0) {
      const keysList = targetKeys.map(k => `"${k}"`).join(', ');
      extractionInstructions = `
    ⚡ MODO EXTRACCIÓN DIRIGIDA ⚡
    El usuario ha definido campos ESPECÍFICOS en su plantilla Excel.
    DEBES buscar OBLIGATORIAMENTE estos campos en el documento:
    ${keysList}
    
    INSTRUCCIONES CRÍTICAS:
    - Busca CADA UNA de estas claves en el texto del documento
    - Si encuentras el valor, extráelo y devuélvelo con la clave normalizada (minúsculas, guiones bajos)
    - Si NO encuentras el valor, devuélvelo como null o string vacío
    - Normaliza los nombres de las claves: convierte a minúsculas y reemplaza espacios por guiones bajos
    - Ejemplo: Si el usuario busca "NUMERO_LOTE", devuélvelo como "numero_lote" en el JSON
    - Ejemplo: Si el usuario busca "CODIGO_SWIFT", busca "SWIFT Code", "Código SWIFT", "SWIFT", etc. y devuélvelo como "codigo_swift"
    - Ejemplo: Si el usuario busca "CLIENTE_VIP", busca "Cliente VIP", "VIP Client", "Cliente Premium", etc. y devuélvelo como "cliente_vip"
    - También extrae los campos estándar (fecha, total, empresa, etc.) si están disponibles
    
    `;
    } else {
      extractionInstructions = `
    Instrucciones específicas:
    - Fechas: Convierte a formato YYYY-MM-DD o DD/MM/YYYY
    - Montos: Extrae solo el número, sin símbolos de moneda (€, $, etc.)
    - Nombres: Extrae nombres completos de empresas y personas
    - Si un campo no existe en el documento, devuélvelo como null o string vacío
    `;
    }
    
    const prompt = `
    Eres un experto en extracción de datos de documentos financieros y facturas.
    Analiza el siguiente texto extraído de un PDF y extrae los datos relevantes.
    
    ${langInstructions}
    
    ${extractionInstructions}
    
    Texto del documento:
    ${text.substring(0, 15000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: dynamicSchema,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as Record<string, any>;
      // Limpiar valores null y convertir a strings cuando sea necesario
      const cleanedData: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined && value !== '') {
          cleanedData[key] = String(value);
        }
      }
      return cleanedData;
    }
    throw new Error("No se pudo extraer datos estructurados");
  } catch (error) {
    console.error("Error extrayendo datos estructurados:", error);
    throw error;
  }
};

// --- ORACLE VISUAL (MIND MAP) FEATURES ---

const mindMapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Main title or central concept of the mind map"
    },
    summary: {
      type: Type.STRING,
      description: "Brief summary of the document content"
    },
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "Unique identifier for the node (e.g., 'node1', 'node2')"
          },
          label: {
            type: Type.STRING,
            description: "Short label for the concept (max 3-4 words)"
          },
          description: {
            type: Type.STRING,
            description: "Detailed explanation of the concept (2-3 sentences)"
          },
          type: {
            type: Type.STRING,
            enum: ["concept", "person", "event", "process", "category"],
            description: "Type of node to help with visual styling"
          }
        },
        required: ["id", "label", "type"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "Unique identifier for the edge (e.g., 'edge1', 'edge2')"
          },
          source: {
            type: Type.STRING,
            description: "ID of the source node"
          },
          target: {
            type: Type.STRING,
            description: "ID of the target node"
          },
          label: {
            type: Type.STRING,
            description: "Short label describing the relationship (e.g., 'Causó', 'Parte de', 'Genera', 'Lleva a', 'Requiere')"
          },
          type: {
            type: Type.STRING,
            enum: ["default", "causal", "hierarchical", "temporal"],
            description: "Type of relationship"
          }
        },
        required: ["id", "source", "target", "label"]
      }
    }
  },
  required: ["nodes", "edges"]
};

/**
 * Genera datos de mapa mental (grafo) a partir del texto de un PDF
 * La IA extrae conceptos clave (nodos) y sus relaciones (aristas)
 */
export const generateMindMapData = async (
  text: string,
  lang: Language = 'ES'
): Promise<MindMapData> => {
  try {
    const langInstructions = lang === 'ES'
      ? "Analiza el texto y extrae conceptos clave y sus relaciones. Crea un mapa mental estructurado con nodos (conceptos) y aristas (relaciones). Las etiquetas de relaciones deben ser en español: 'Causó', 'Genera', 'Parte de', 'Lleva a', 'Requiere', 'Incluye', etc."
      : lang === 'EN'
      ? "Analyze the text and extract key concepts and their relationships. Create a structured mind map with nodes (concepts) and edges (relationships). Relationship labels should be in English: 'Caused', 'Generates', 'Part of', 'Leads to', 'Requires', 'Includes', etc."
      : lang === 'DE'
      ? "Analysiere den Text und extrahiere Schlüsselkonzepte und ihre Beziehungen. Erstelle eine strukturierte Mindmap mit Knoten (Konzepten) und Kanten (Beziehungen). Beziehungsetiketten sollten auf Deutsch sein."
      : "Analysez le texte et extrayez les concepts clés et leurs relations. Créez une carte mentale structurée avec des nœuds (concepts) et des arêtes (relations). Les étiquettes de relations doivent être en français.";

    const prompt = `
    Eres un experto en análisis de conocimiento y creación de mapas mentales.
    Tu tarea es analizar el siguiente texto y crear un GRAFO DE CONOCIMIENTO estructurado.
    
    ${langInstructions}
    
    INSTRUCCIONES CRÍTICAS:
    1. Extrae entre 8-15 conceptos clave (nodos). No más de 20.
    2. Cada concepto debe tener un ID único (node1, node2, node3...)
    3. Identifica las relaciones entre conceptos (aristas). Cada relación debe tener:
       - Un ID único (edge1, edge2, edge3...)
       - Un nodo origen (source) y un nodo destino (target)
       - Una etiqueta descriptiva de la relación (ej: "Causó", "Genera", "Parte de")
    4. Las etiquetas de nodos deben ser CORTAS (máximo 3-4 palabras)
    5. Las descripciones de nodos deben ser detalladas (2-3 frases) para mostrar al hacer clic
    6. Prioriza relaciones causales, jerárquicas y temporales
    7. Asegúrate de que todos los IDs de source y target correspondan a IDs de nodos existentes
    
    EJEMPLO DE ESTRUCTURA:
    {
      "title": "Título del Documento",
      "summary": "Resumen breve",
      "nodes": [
        { "id": "node1", "label": "Concepto A", "description": "Detalle...", "type": "concept" },
        { "id": "node2", "label": "Concepto B", "description": "Detalle...", "type": "event" }
      ],
      "edges": [
        { "id": "edge1", "source": "node1", "target": "node2", "label": "Causó", "type": "causal" }
      ]
    }
    
    Texto del documento (primeros 20000 caracteres):
    ${text.substring(0, 20000)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mindMapSchema,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as MindMapData;
      
      // Validar que todos los source/target existan en nodes
      const nodeIds = new Set(data.nodes.map(n => n.id));
      data.edges = data.edges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
      
      // Asegurar que hay al menos un nodo
      if (data.nodes.length === 0) {
        throw new Error("No se pudieron extraer conceptos del documento");
      }
      
      return data;
    }
    throw new Error("No se pudo generar el mapa mental");
  } catch (error) {
    console.error("Error generando mapa mental:", error);
    throw error;
  }
};

// --- CHAT / INTERROGATOR FEATURES ---

const chatResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description: "La respuesta completa a la pregunta del usuario basada en el documento PDF"
    },
    found: {
      type: Type.BOOLEAN,
      description: "Indica si se encontró la información en el documento"
    },
    citations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Citas o referencias específicas del documento que respaldan la respuesta"
    }
  },
  required: ["answer", "found"]
};

/**
 * Obtiene una respuesta del chat basada en el historial y el contexto del PDF
 * @param pdfText Texto completo del PDF (contexto)
 * @param messages Historial de mensajes de la conversación
 * @param newQuestion Nueva pregunta del usuario
 * @param lang Idioma de la respuesta
 * @param isPremium Si el usuario es premium (límite de 100k tokens) o gratis (10k tokens)
 * @returns Respuesta del asistente
 */
export const getChatResponse = async (
  pdfText: string,
  messages: ChatMessage[],
  newQuestion: string,
  lang: Language,
  isPremium: boolean = false
): Promise<string> => {
  try {
    // Límites de tokens según el plan
    // Para el tier gratuito, limitamos más el texto del PDF para evitar exceder cuotas
    const maxOutputTokens = isPremium ? 8192 : 2048; // Reducido para tier gratuito
    const maxPdfTextLength = isPremium ? 800000 : 200000; // Reducir texto del PDF para gratis
    
    // Construir el contexto inicial con el texto del PDF
    const langName = lang === 'ES' ? 'español' : lang === 'EN' ? 'inglés' : lang === 'DE' ? 'alemán' : 'francés';
    
    const systemContext = `
Eres el "Espíritu del Documento", un asistente mágico que responde preguntas basándote ÚNICAMENTE en el contenido del siguiente documento PDF.

INSTRUCCIONES CRÍTICAS:
1. Responde SOLO basándote en el texto del documento proporcionado.
2. Si la información no está en el documento, establece "found" como false y di claramente "No encuentro esa información en el documento".
3. Sé preciso y cita partes específicas del texto cuando sea relevante en el campo "citations".
4. Responde en ${langName}.
5. Mantén las respuestas concisas pero completas.
6. El campo "answer" debe contener la respuesta completa y bien formateada.

CONTENIDO DEL DOCUMENTO:
${pdfText.substring(0, maxPdfTextLength)} ${pdfText.length > maxPdfTextLength ? '\n\n[Documento truncado para optimización]' : ''}
`;

    // Construir el historial de conversación para el prompt
    const conversationHistory = messages.map(msg => 
      `${msg.role === 'user' ? 'Usuario' : 'Espíritu'}: ${msg.content}`
    ).join('\n\n');

    // Construir el prompt completo
    const prompt = `${systemContext}

${conversationHistory ? `--- HISTORIAL DE CONVERSACIÓN ---\n\n${conversationHistory}\n\n` : ''}--- NUEVA PREGUNTA ---\n\nUsuario: ${newQuestion}\n\nEspíritu: Responde en formato JSON con los campos answer, found y citations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: chatResponseSchema,
        maxOutputTokens,
        temperature: 0.7,
      },
    });

    if (response.text) {
      try {
        const jsonResponse = JSON.parse(response.text) as { answer: string; found: boolean; citations?: string[] };
        
        // Formatear la respuesta con citas si existen
        let formattedAnswer = jsonResponse.answer;
        
        if (jsonResponse.citations && jsonResponse.citations.length > 0) {
          formattedAnswer += '\n\n📚 Referencias del documento:\n';
          jsonResponse.citations.forEach((citation, idx) => {
            formattedAnswer += `${idx + 1}. ${citation}\n`;
          });
        }
        
        if (!jsonResponse.found) {
          formattedAnswer = `⚠️ ${formattedAnswer}`;
        }
        
        return formattedAnswer;
      } catch (parseError) {
        // Si falla el parseo, intentar devolver el texto directamente
        console.warn("Error parseando respuesta JSON, devolviendo texto directo:", parseError);
        return response.text;
      }
    }
    
    throw new Error("No se recibió respuesta del espíritu");
  } catch (error) {
    console.error("Error en chat:", error);
    throw error;
  }
};