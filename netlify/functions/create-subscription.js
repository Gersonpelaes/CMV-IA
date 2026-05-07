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

        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
        if (!MP_ACCESS_TOKEN) {
            console.error("Token do Mercado Pago não configurado na variável de ambiente MP_ACCESS_TOKEN.");
            return { statusCode: 500, body: JSON.stringify({ error: 'Erro de configuração do servidor. Token ausente.' }) };
        }

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
