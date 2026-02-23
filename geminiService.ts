
import { GoogleGenAI, Type } from "@google/genai";
import { ProductionLog, Task, Employee, AIAnalysisResult } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found in environment variables");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeProductionData = async (
    logs: ProductionLog[],
    tasks: Task[],
    employees: Employee[]
): Promise<AIAnalysisResult> => {
    try {
        const ai = getClient();
        
        const prompt = `
        Você é um gerente de fábrica de fertilizantes experiente. Analise os seguintes dados de produção e tarefas da equipe.
        
        Funcionários: ${JSON.stringify(employees.map(e => `${e.name} (${e.role})`))}
        Registros de Produção Recentes: ${JSON.stringify(logs.slice(-5))}
        Tarefas Atuais: ${JSON.stringify(tasks)}

        Por favor, forneça uma análise em formato JSON com:
        1. "summary": Um resumo curto da situação atual da fábrica.
        2. "recommendations": Uma lista de 3 recomendações para melhorar a eficiência ou resolver gargalos baseados nas tarefas atrasadas ou distribuição de carga.
        3. "efficiencyScore": Uma nota de 0 a 100 baseada no volume produzido e status das tarefas.

        Responda APENAS com o JSON.
        `;

        // Use gemini-3-flash-preview for Basic Text Tasks and implement responseSchema for structured JSON output
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: 'A short summary of the factory situation.'
                        },
                        recommendations: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'A list of 3 actionable recommendations.'
                        },
                        efficiencyScore: {
                            type: Type.NUMBER,
                            description: 'Calculated efficiency score between 0 and 100.'
                        }
                    },
                    required: ["summary", "recommendations", "efficiencyScore"]
                }
            }
        });

        // Use .text property to extract the generated response text directly
        const text = response.text;
        if (!text) return { summary: "Erro na análise", recommendations: [], efficiencyScore: 0 };

        return JSON.parse(text) as AIAnalysisResult;

    } catch (error) {
        console.error("Error analyzing data:", error);
        return {
            summary: "Não foi possível conectar ao assistente de IA no momento.",
            recommendations: ["Verifique sua conexão", "Tente novamente mais tarde"],
            efficiencyScore: 0
        };
    }
};

export const generateTaskDescription = async (product: string, step: string): Promise<string> => {
    try {
        const ai = getClient();
        // Use gemini-3-flash-preview for simple text generation tasks
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Descreva uma instrução técnica curta e segura para um operador de fertilizantes realizando a etapa de "${step}" para o produto "${product}". Máximo 2 frases.`,
        });
        // Use .text property to access output content
        return response.text || "Sem descrição disponível.";
    } catch (error) {
        return "Realizar a etapa conforme procedimentos padrão.";
    }
}
