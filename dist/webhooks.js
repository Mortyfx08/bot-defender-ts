"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Replace with your actual data cleanup logic
async function deleteStoreData(body) {
    // TODO: Clean up store data from your database
    return;
}
router.post('/webhooks/app/uninstalled', async (req, res) => {
    await deleteStoreData(req.body);
    res.status(200).send();
});
exports.default = router;
