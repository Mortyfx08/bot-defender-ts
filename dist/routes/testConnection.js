"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/routes/testConnection.ts
const express_1 = require("express");
const mongodb_1 = require("../services/mongodb");
const router = (0, express_1.Router)();
// Test MongoDB connection without authentication
router.get('/test-mongodb', async (req, res) => {
    try {
        console.log('Testing MongoDB connection...');
        console.log('MongoDB URI:', process.env.MONGODB_URI);
        const mongoService = await mongodb_1.MongoDBService.getInstance();
        // Test MongoDB connection by inserting a test document
        const collection = mongoService.getCollection('test_connection');
        const testDoc = {
            test: 'MongoDB connection test',
            timestamp: new Date()
        };
        console.log('Inserting test document...');
        const result = await collection.insertOne(testDoc);
        console.log('Test document inserted:', result);
        // Verify the document was inserted
        const verifyDoc = await collection.findOne({ _id: result.insertedId });
        console.log('Verified document:', verifyDoc);
        // Clean up test data
        await collection.deleteOne({ _id: result.insertedId });
        console.log('Test document cleaned up');
        res.json({
            status: 'success',
            message: 'MongoDB connection test successful',
            details: {
                insertedId: result.insertedId,
                verified: !!verifyDoc,
                database: mongoService.getCollection('test_connection').dbName
            }
        });
    }
    catch (error) {
        console.error('Connection test failed:', error);
        res.status(500).json({
            status: 'error',
            message: error?.message || 'Unknown error occurred',
            stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        });
    }
});
exports.default = router;
