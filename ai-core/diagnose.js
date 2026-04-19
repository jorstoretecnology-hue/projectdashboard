import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function diagnose() {
  console.log("🔍 Diagnosticando API de Gemini...");
  
  if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY no encontrada en .env");
    return;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    
    if (!res.ok) {
      console.error(`❌ Error al conectar (${res.status}):`, data.error?.message || res.statusText);
      return;
    }

    console.log("✅ Conexión exitosa. Modelos disponibles para generar contenido:");
    
    const generationModels = data.models.filter(m => 
      m.supportedGenerationMethods.includes("generateContent")
    );

    generationModels.forEach(m => {
      console.log(`- ${m.name.replace("models/", "")} [${m.displayName}]`);
    });

    if (generationModels.length === 0) {
      console.warn("⚠️ No se encontraron modelos con soporte para 'generateContent'.");
    }

  } catch (err) {
    console.error("❌ Error inesperado:", err.message);
  }
}

diagnose();
