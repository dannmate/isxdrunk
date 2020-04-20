const express = require('express');
const mongodb  = require('mongodb');
require('dotenv').config();

const router = express.Router();

// Get if my mate is drunk or not
router.get('/', async (req,res) => {
    const confirmations = await getConfirmations();

    res.send(await confirmations.find({}).toArray());
});

router.post('/confirm', async (req,res) => {
    const confirmations = await getConfirmations();

    await confirmations.insertOne({
        user: req.body.user,
        sumbittedAt: new Date(),
        image: ''

    });
    res.status(201).send();
    res.send(await confirmations.find({}).toArray());
});

async function getConfirmations() {
    console.log(process.env);
    const client = await mongodb.MongoClient.connect(
        process.env.MONGODB_CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true});

    return client.db('isxdrunk').collection('confirmation');

}

module.exports = router;