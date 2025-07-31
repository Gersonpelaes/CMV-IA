// Este ficheiro faz a ponte segura para a API Gemini (Assistente de Receitas)

exports.handler = async function(event, context) {
  // Apenas permite pedidos do tipo POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const requestBody = JSON.parse(event.body);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contents: requestBody.contents }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error:', errorBody);
      return { statusCode: response.status, body: errorBody };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
