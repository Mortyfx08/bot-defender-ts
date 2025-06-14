require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
    const uri = process.env.MONGODB_URI;
    console.log('Testing connection to MongoDB...');
    
    try {
        const client = new MongoClient(uri);
        await client.connect();
        console.log('Successfully connected to MongoDB!');
        
        // Test database access
        const db = client.db('Bot-defender');
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        await client.close();
    } catch (error) {
        console.error('Connection error:', error);
    }
}

testConnection(); 