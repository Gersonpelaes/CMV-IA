const axios = require('axios');
const admin = require('firebase-admin');

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
            });
        } catch (e) {
            admin.initializeApp();
        }
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
        const { uid, email, planType } = data;

        if (!uid) {
            return { statusCode: 400, body: JSON.stringify({ error: 'UID é obrigatório.' }) };
        }

        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
        if (!MP_ACCESS_TOKEN) {
            console.error("Token do Mercado Pago não configurado na variável de ambiente MP_ACCESS_TOKEN.");
            return { statusCode: 500, body: JSON.stringify({ error: 'Erro de configuração do servidor. Token ausente.' }) };
        }

        let title = planType === 'anual' ? "Acesso Anual CMV.IA" : "Acesso Mensal CMV.IA";
        let price = planType === 'anual' ? 99.00 : 25.00;

        // Consulta se existe valor customizado para este cliente ou configuração global
        try {
            const restDoc = await db.collection('restaurants').doc(uid).get();
            if (restDoc.exists) {
                const restData = restDoc.data();
                if (restData.planPrice !== undefined && restData.planPrice !== null && !isNaN(parseFloat(restData.planPrice))) {
                    price = parseFloat(restData.planPrice);
                    if (restData.planType) title = `Acesso ${restData.planType.toUpperCase()} CMV.IA`;
                }
            } else {
                const cfgDoc = await db.collection('saas_config').doc('pricing').get();
                if (cfgDoc.exists) {
                    const cfg = cfgDoc.data();
                    if (planType === 'anual' && cfg.annual) price = parseFloat(cfg.annual);
                    else if (cfg.monthly) price = parseFloat(cfg.monthly);
                }
            }
        } catch (errDb) {
            console.warn("Usando preço padrão do código:", errDb.message);
        }

        const response = await axios.post("https://api.mercadopago.com/checkout/preferences", {
            items: [
                {
                    title: title,
                    quantity: 1,
                    currency_id: "BRL",
                    unit_price: price
                }
            ],
            payer: {
                email: email || "cliente@email.com"
            },
            external_reference: uid,
            back_urls: {
                success: "https://cmv-ia.netlify.app/",
                failure: "https://cmv-ia.netlify.app/",
                pending: "https://cmv-ia.netlify.app/"
            },
            auto_return: "approved"
        }, {
            headers: {
                Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ init_point: response.data.init_point, price: price })
        };
    } catch (error) {
        console.error("Erro ao criar preferência de pagamento:", error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao gerar o link de pagamento do Mercado Pago.' })
        };
    }
};
