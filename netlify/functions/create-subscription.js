const axios = require('axios');

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

        const title = planType === 'anual' ? "Acesso Anual CMV.IA" : "Acesso Mensal CMV.IA";
        const price = planType === 'anual' ? 150.00 : 25.00;

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
            body: JSON.stringify({ init_point: response.data.init_point })
        };
    } catch (error) {
        console.error("Erro ao criar preferência de pagamento:", error.response?.data || error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao gerar o link de pagamento do Mercado Pago.' })
        };
    }
};
