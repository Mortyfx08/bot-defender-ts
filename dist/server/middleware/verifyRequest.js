"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRequest = void 0;
const verifyRequest = (req, res, next) => {
    try {
        const session = res.locals.shopify?.session;
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};
exports.verifyRequest = verifyRequest;
