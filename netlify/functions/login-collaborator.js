const admin = require('firebase-admin');

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
    } else {
        admin.initializeApp();
    }
}
const db = admin.firestore();

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const { restaurantId, shareKey } = data;

        if (!restaurantId || !shareKey) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Parâmetros ausentes.' }) };
        }

        // Verifica se a chave fornecida bate com a do banco
        const restaurantRef = db.collection('restaurants').doc(restaurantId);
        const docSnap = await restaurantRef.get();

        if (!docSnap.exists) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Restaurante não encontrado.' }) };
        }

        const restaurantData = docSnap.data();
        if (restaurantData.shareKey !== shareKey) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Chave de acesso inválida ou expirada.' }) };
        }

        // Chave correta! Gera um token customizado para o UID do restaurante
        const customToken = await admin.auth().createCustomToken(restaurantId);

        return {
            statusCode: 200,
            body: JSON.stringify({ token: customToken })
        };

    } catch (error) {
        console.error("Erro no login-collaborator:", error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno no servidor.' }) };
    }
};
