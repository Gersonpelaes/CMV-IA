exports.handler = async function(event, context) {
  // Esta função lê as variáveis de ambiente que configurou no Netlify
  // e envia-as de forma segura para a sua aplicação.
  // A função clean() remove espaços invisíveis e aspas (caso tenham sido copiadas sem querer).
  const clean = (val) => val ? val.trim().replace(/^["']|["']$/g, '') : null;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: clean(process.env.FIREBASE_API_KEY),
      authDomain: clean(process.env.FIREBASE_AUTH_DOMAIN),
      projectId: clean(process.env.FIREBASE_PROJECT_ID),
      storageBucket: clean(process.env.FIREBASE_STORAGE_BUCKET),
      messagingSenderId: clean(process.env.FIREBASE_MESSAGING_SENDER_ID),
      appId: clean(process.env.FIREBASE_APP_ID),
      measurementId: clean(process.env.FIREBASE_MEASUREMENT_ID)
    }),
  };
};