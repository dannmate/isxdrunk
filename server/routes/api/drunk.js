const express = require('express');
const mongodb  = require('mongodb');
const util = require('../../modules/util');
const AWS = require('aws-sdk');
require('dotenv').config();

const router = express.Router();

// Get if my mate is drunk or not
router.get('/', async (req,res) => {
    try {
        const drunkCollection = await util.getDrunk();
        const isDrunk = await util.checkDrunk(drunkCollection);

        // TODO: get image collection from maxdate - 9 hours (8 hours ago plus the 1 to capture all confirmations)

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

// this is a dummy test route to test certain functionality independently 
router.post('/test', async (req,res) => {
    try {
        const imgUrl = await util.uploadImageToS3Bucket(req.body.base64Img, req.body.fileName);
   
        res.status(201).send({"img": imgUrl})
    }
    catch(err) {
        res.status(400).send({
            "message": err.message
        }); 

    }
 
    
});

router.post('/confirm', async (req,res) => {

    try {
        const drunk = await util.getDrunk();
        const isDrunk = await util.checkDrunk(drunk);

        if (!isDrunk) {

            const confirmations = await getConfirmations();
            const users = await util.getUsers();
            
            const current_ts = new Date();
            
            const userAuthorized = await users.find({ $and: [ { secret: req.body.secret } , { user: req.body.user } ] } ).count();

            if (userAuthorized == 1) {

                // TODO: upload image to S3 bucket and add url to DB.

                await confirmations.insertOne({
                    user: req.body.user,
                    submittedAt: current_ts,
                    imageURL: '',
                    drunkId: ''
            
                }); 

                const lastHour = new Date();
                lastHour.setHours(lastHour.getHours()-1);         
                const checkConfirmsLastHour = await confirmations.distinct("user", {"submittedAt":{$gt: lastHour}});
                
                // If there is 3 confirms within the last hour then x is drunk!
                if (Object.keys(checkConfirmsLastHour).length >=3) {

                    const addEightHours = new Date();
                    addEightHours.setHours(addEightHours.getHours()+8);
        
                    // insert a record for x to be drunk for the next 8 hours
                    const drunkInsert = await drunk.insertOne({
                        drunkStartDate: current_ts,
                        drunkEndDate: addEightHours
                    }); 
                    
                    // update the confirmations drunk id, as they are now directly linked to the latest drunk event
                    // this helps us get the images related to a drunk event
                    await confirmations.updateMany(
                        { "submittedAt": { $gt: lastHour} },
                        { $set: { drunkId: drunkInsert.insertedId } }
                    )
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


module.exports = router;