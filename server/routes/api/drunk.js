const express = require('express');
const mongodb  = require('mongodb');
require('dotenv').config();

const router = express.Router();

// Get if my mate is drunk or not
router.get('/', async (req,res) => {
    try {
        const drunkCollection = await getDrunk();
        const isDrunk = await checkDrunk(drunkCollection);

        //TODO: get image collection from maxdate - 9 hours (8 hours ago plus the 1 to capture all confirmations)

        res.send({
            "isDrunk": isDrunk
        });
    }
    catch(err) {
        res.status(400).send({
            "message": err.message
         });

    }
    
});

router.get('/confirmations', async (req,res) => {
    const confirmations = await getConfirmations();

    res.send(await confirmations.find({}).toArray());
});

router.post('/confirm', async (req,res) => {

    try {
        const drunk = await getDrunk();
        const isDrunk = await checkDrunk(drunk);

        if (!isDrunk) {

        const confirmations = await getConfirmations();
        const users = await getUsers();
        
        const current_ts = new Date();
        
        const userAuthorized = await users.find({ $and: [ { secret: req.body.secret } , { user: req.body.user } ] } ).count();

        if (userAuthorized == 1) {

            await confirmations.insertOne({
                user: req.body.user,
                sumbittedAt: current_ts,
                image: req.body.image
        
            }); 

            const lastHour = current_ts;
            lastHour.setHours(lastHour.getHours()-1);         
            const checkConfirmsLastHour = await confirmations.distinct("user", {"sumbittedAt":{$gt: lastHour}});
              
            //If there is 3 confirms within the last hour then x is drunk!
            if (Object.keys(checkConfirmsLastHour).length >=3) {

                const addEightHours = current_ts;
                addEightHours.setHours(addEightHours.getHours()+8);

                await drunk.insertOne({
                    drunkEndDate: addEightHours
                }); 
            }

            res.status(201).send();
        } else {
            res.status(400).send({
                "message": "Invalid secret code"
             });
        }
    } else {
        res.status(400).send({
            "message": "Cannot add a drunk confirmation when they are drunk!"
         });
    }
           
    }
    catch(err) {
        res.status(400).send({
            "message": err.message
         });
    }
  
});

async function getConfirmations() {
    const client = await mongodb.MongoClient.connect(
        process.env.MONGODB_CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true});

    return client.db('isxdrunk').collection('confirmation');

}

async function getUsers() {
    const client = await mongodb.MongoClient.connect(
        process.env.MONGODB_CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true});

    return client.db('isxdrunk').collection('user');

}

async function getDrunk() {
    const client = await mongodb.MongoClient.connect(
        process.env.MONGODB_CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true});

    return client.db('isxdrunk').collection('drunk');

}

async function checkDrunk(drunkCollection) {
    const current_ts = new Date();
    const maxDrunkTs = await drunkCollection.aggregate({ $group : { _id: null, max: { $max : "$drunkEndDate" }}}).toArray();
    
    return current_ts < maxDrunkTs[0].drunkEndDate;

}

module.exports = router;