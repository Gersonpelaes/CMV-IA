const admin = require('firebase-admin');
const axios = require('axios');

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
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) {
        console.error("Token do Mercado Pago não configurado na variável de ambiente MP_ACCESS_TOKEN.");
        return { statusCode: 500, body: "Erro de configuração do servidor. Token ausente." };
    }
    
    // O Mercado Pago envia os dados via query string ou body
    const query = event.queryStringParameters || {};
    let body = {};
    try {
        if (event.body) body = JSON.parse(event.body);
    } catch (e) {}

    const id = query.id || query["data.id"] || body.data?.id;
    const type = query.topic || query.type || body.type;

    const logRef = db.collection("webhook_logs").doc();
    await logRef.set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        query: query,
        body: body,
        status: "received"
    });

    if (!id || (type !== "payment" && type !== "subscription_preapproval")) {
        await logRef.update({ status: "ignored_not_payment" });
        return { statusCode: 200, body: "Ignorado - Não é pagamento ou assinatura" };
    }

    try {
        let apiUrl = type === "payment" 
            ? `https://api.mercadopago.com/v1/payments/${id}`
            : `https://api.mercadopago.com/preapproval/${id}`;

        const response = await axios.get(apiUrl, {
            headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
        });

        const data = response.data;
        const status = data.status;
        const externalReference = data.external_reference;
        const payerEmail = type === "payment" ? data.payer?.email : data.payer_email;

        await logRef.update({ mpStatus: status, payerEmail: payerEmail || "none", externalReference: externalReference || "none" });

        if (status === "approved" || status === "authorized") {
            let userDoc = null;
            const usersRef = db.collection("restaurants");

            // Procurar usando o UID passado no external_reference
            if (externalReference) {
                const docSnap = await usersRef.doc(externalReference).get();
                if (docSnap.exists) {
                    userDoc = docSnap;
                }
            }

            // Fallback usando o email (caso external_reference não estivesse lá)
            if (!userDoc && payerEmail) {
                const snapshot = await usersRef.where("email", "==", payerEmail).get();
                if (!snapshot.empty) {
                    userDoc = snapshot.docs[0];
                }
            }

            if (userDoc) {
                // Descobrir quantos dias adicionar baseado no valor (transaction_amount)
                const amount = data.transaction_amount || 25;
                let addedDays = 31; // Padrão mensal
                if (amount >= 140) {
                    addedDays = 365; // Anual
                }

                // Calcular a nova data de expiração
                const currentData = userDoc.data();
                let currentExpiration = new Date();
                
                if (currentData.trialEndsAt) {
                    if (typeof currentData.trialEndsAt.toDate === 'function') {
                        const dbDate = currentData.trialEndsAt.toDate();
                        if (dbDate > currentExpiration) currentExpiration = dbDate;
                    } else {
                        const dbDate = new Date(currentData.trialEndsAt);
                        if (dbDate > currentExpiration) currentExpiration = dbDate;
                    }
                }
                
                // Adiciona os dias ao fim do plano atual (ou de hoje, se já estava vencido)
                currentExpiration.setDate(currentExpiration.getDate() + addedDays);

                await userDoc.ref.update({
                    planStatus: "active",
                    trialEndsAt: admin.firestore.Timestamp.fromDate(currentExpiration),
                    lastPaymentId: id,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                await logRef.update({ status: "success", userActivated: userDoc.id, addedDays: addedDays, newExpiration: currentExpiration });
                console.log(`Usuário ${userDoc.id} ativado com sucesso! Dias adicionados: ${addedDays}`);
            } else {
                await logRef.update({ status: "error_user_not_found", message: `Usuário não achado (UID: ${externalReference}, Email: ${payerEmail})` });
            }
        } else {
            await logRef.update({ status: "payment_not_approved", currentStatus: status });
        }

        return { statusCode: 200, body: "OK" };
    } catch (error) {
        await logRef.update({ status: "error", error: error.message });
        console.error("Erro no webhook:", error.message);
        return { statusCode: 500, body: "Erro interno" };
    }
};
