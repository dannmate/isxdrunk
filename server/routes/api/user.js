const express = require('express');
const mongodb  = require('mongodb');
require('dotenv').config();

const router = express.Router();

// Get if my mate is drunk or not
router.get('/', async (req,res) => {
    const users = await getUsers();

    res.send(await users.find({}, {projection:{ user: 1 , _id: 0}}).toArray());
});

async function getUsers() {
    const client = await mongodb.MongoClient.connect(
        process.env.MONGODB_CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true});

    return client.db('isxdrunk').collection('user');

}

module.exports = router;