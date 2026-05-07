const axios = require('axios');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const { uid, email } = data;

        if (!uid) {
            return { statusCode: 400, body: JSON.stringify({ error: 'UID é obrigatório.' }) };
        }

        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "APP_USR-5678099220626441-082816-f3ef8d545a6468ae92a37627ab8c5063-1213742777";

        const response = await axios.post("https://api.mercadopago.com/preapproval", {
            reason: "Assinatura CMV.IA",
            external_reference: uid,
            payer_email: email || "cliente@email.com",
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: 25.00,
                currency_id: "BRL"
            },
            back_url: "https://cmv-ia.netlify.app/" // URL de retorno
        }, {
            headers: {
                Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ init_point: response.data.init_point })
        };
    } catch (error) {
        console.error("Erro ao criar assinatura:", error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao gerar o link de pagamento do Mercado Pago.' })
        };
    }
};
