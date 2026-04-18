import fs from "fs";
import readline from "readline";

const API_KEY = process.env.GEMINI_API_KEY;

async function askGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";
}

// 👉 Detecta si envías archivo
const filePath = process.argv[2];

if (filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const result = await askGemini(content);
    console.log(result);
  } catch (error) {
    console.error("❌ Error al leer el archivo:", error.message);
    process.exit(1);
  }
} else {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function start() {
    rl.question("🧠 Tú: ", async (input) => {
      const response = await askGemini(input);
      console.log("🤖 Gemini:", response);
      start();
    });
  }

  start();
}