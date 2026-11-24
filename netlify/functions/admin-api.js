const admin = require('firebase-admin');

if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
            });
        } catch (e) {
            console.error("Erro ao inicializar Firebase Admin com service account:", e);
            admin.initializeApp();
        }
    } else {
        admin.initializeApp();
    }
}

const db = admin.firestore();
const DEFAULT_MASTER_KEY = "cmv2026admin";

exports.handler = async function(event, context) {
    // Permitir CORS básico para requisições do app
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: 'OK' };
    }

    try {
        let authHeader = event.headers.authorization || event.headers.Authorization || '';
        let token = authHeader.replace(/^Bearer\s+/i, '');
        let decodedToken = null;

        // Se houver token Bearer, valida com o Firebase Auth
        if (token) {
            try {
                decodedToken = await admin.auth().verifyIdToken(token);
            } catch (err) {
                console.warn("Token JWT inválido ou expirado:", err.message);
            }
        }

        let body = {};
        if (event.body) {
            try { body = JSON.parse(event.body); } catch(e) {}
        }

        const action = body.action || event.queryStringParameters?.action;

        // Ação: Reivindicar privilégio de Admin Master via Chave Mestre
        if (action === 'claim-admin') {
            const masterKey = body.masterKey;
            const uid = body.uid || decodedToken?.uid;
            const email = body.email || decodedToken?.email;

            if (masterKey !== (process.env.MASTER_ADMIN_KEY || DEFAULT_MASTER_KEY)) {
                return { statusCode: 403, headers, body: JSON.stringify({ error: 'Chave Mestre inválida.' }) };
            }

            if (!uid) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'UID não fornecido.' }) };
            }

            // Registra usuário como admin permanente
            await db.collection('admins').doc(uid).set({
                email: email || 'admin@cmvia.com',
                isAdmin: true,
                role: 'admin',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Usuário promovido a Master Admin!' }) };
        }

        // Para as demais ações, exige que o usuário seja Admin verificado
        let isAuthorizedAdmin = false;
        if (decodedToken) {
            const adminDoc = await db.collection('admins').doc(decodedToken.uid).get();
            if (adminDoc.exists && adminDoc.data().isAdmin === true) {
                isAuthorizedAdmin = true;
            } else {
                const restDoc = await db.collection('restaurants').doc(decodedToken.uid).get();
                if (restDoc.exists && (restDoc.data().role === 'admin' || restDoc.data().isAdmin === true)) {
                    isAuthorizedAdmin = true;
                }
            }
        }

        // Se passar a master key diretamente no body, autoriza a requisição
        if (body.masterKey && body.masterKey === (process.env.MASTER_ADMIN_KEY || DEFAULT_MASTER_KEY)) {
            isAuthorizedAdmin = true;
        }

        if (!isAuthorizedAdmin) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ error: 'Acesso negado. Apenas administradores autorizados podem realizar esta operação.' })
            };
        }

        // ===================================
        // EXECUÇÃO DAS AÇÕES ADMINISTRATIVAS
        // ===================================

        // 1. Enviar / Gerar Link de Redefinição de Senha
        if (action === 'send-password-reset') {
            const email = body.email;
            if (!email) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email é obrigatório.' }) };
            }

            try {
                // Gera o link oficial do Firebase
                const resetLink = await admin.auth().generatePasswordResetLink(email);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, resetLink: resetLink, message: 'Link gerado com sucesso!' })
                };
            } catch (err) {
                console.error("Erro ao gerar link de senha:", err);
                return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
            }
        }

        // 2. Conceder Cortesia
        if (action === 'set-courtesy') {
            const { clientId, durationDays, reason } = body;
            if (!clientId) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID do cliente ausente.' }) };
            }

            let expDate = new Date();
            if (durationDays === 'vitalicio') {
                expDate.setFullYear(2099, 11, 31);
            } else {
                expDate.setDate(expDate.getDate() + (parseInt(durationDays) || 30));
            }

            await db.collection('restaurants').doc(clientId).update({
                planStatus: 'courtesy',
                isBlocked: false,
                trialEndsAt: admin.firestore.Timestamp.fromDate(expDate),
                notes: reason ? `Cortesia concedida: ${reason}` : admin.firestore.FieldValue.delete(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        // 3. Bloquear ou Liberar
        if (action === 'set-blocked') {
            const { clientId, isBlocked, reason } = body;
            if (!clientId) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID do cliente ausente.' }) };
            }

            const updates = {
                isBlocked: !!isBlocked,
                planStatus: isBlocked ? 'blocked' : 'active',
                blockedReason: isBlocked ? (reason || 'Conta temporariamente suspensa.') : '',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            if (!isBlocked) {
                // Ao liberar, garante 30 dias de acesso a partir de hoje caso estivesse vencido
                const expDate = new Date();
                expDate.setDate(expDate.getDate() + 30);
                updates.trialEndsAt = admin.firestore.Timestamp.fromDate(expDate);
            }

            await db.collection('restaurants').doc(clientId).update(updates);
            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        // 4. Alterar Preço e Tipo do Plano do Cliente
        if (action === 'update-client-plan') {
            const { clientId, planPrice, planType } = body;
            if (!clientId) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID do cliente ausente.' }) };
            }

            await db.collection('restaurants').doc(clientId).update({
                planPrice: parseFloat(planPrice) || 25.00,
                planType: planType || 'mensal',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ação desconhecida.' }) };

    } catch (err) {
        console.error("Erro fatal no admin-api:", err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Erro interno no servidor: ' + err.message })
        };
    }
};
