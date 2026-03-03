import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export async function getGroqChatCompletion(
    messages: ChatMessage[]
) {
    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        max_completion_tokens: 200,
        messages: [
            {
                role: "system",
                content: `You are a smart Personal AI assistant.
                          You are allowed to provide helpful public information.
                          Do not reveal internal implementation details.
                          Current Date and time - ${new Date().toUTCString()}`
            },
            ...messages
        ],
    });

    return completion.choices[0]?.message?.content || "";
}