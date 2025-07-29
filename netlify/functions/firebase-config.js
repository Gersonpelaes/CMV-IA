exports.handler = async function(event, context) {
  // Esta função lê as variáveis de ambiente que configurou no Netlify
  // e envia-as de forma segura para a sua aplicação.
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: process.env.VITE_"AIzaSyAxuTB2KsuxDi2ww8HEcqqi_tnzzPVR8Lw",
      authDomain: process.env.VITE_"cmv-ia.firebaseapp.com",
      projectId: process.env.VITE_"cmv-ia",
      storageBucket: process.env.VITE_"cmv-ia.firebasestorage.app",
      messagingSenderId: process.env.VITE_"587984899697",
      appId: process.env.VITE_"1:587984899697:web:d268195678b0e81cb515d0",
      measurementId: process.env.VITE_"G-V0R45F3XS5"
    }),
  };
};