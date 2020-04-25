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

        // get latest drunk event
        const maxDrunkTs = await drunkCollection.find().sort({drunkEndDate:-1}).limit(1).toArray();

        if (isDrunk) {

            const images = await util.getDrunkImages();
            // get all the images related to this drunk event. only keep relevant fields. sort by submitted at desc
            const currentDrunkImages = await images.find({drunkId: maxDrunkTs[0]._id }, {projection:{imageURL: 1, _id: 0 }}).sort( { submittedAt: -1 } ).toArray();

            res.send({
                "isDrunk": isDrunk,
                "currentDrunkImgs": currentDrunkImages
            });
        } else {

            let daysSinceDrunk = 0;
            const freshDrunkCollection = await util.getDrunk();
                const findAll =  await freshDrunkCollection.find({ }).toArray()
            // check if theres been an actual drunk even since orginal dummy drunk event.
            // if not set to -1 else get the days since last drunk event
            if (Object.keys(findAll).length == 1) {

                daysSinceDrunk = -1
            } else {

                const today = new Date();
                daysSinceDrunk = Math.floor(( today - maxDrunkTs[0].drunkEndDate ) / 86400000); 
            }
            
            res.send({
                "isDrunk": isDrunk,
                "daysSinceDrunk": daysSinceDrunk
            });

        }
        
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
router.get('/test', async (req,res) => {
    res.status(201).send()
     
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

                const images = await util.getDrunkImages();
                const imgUrl = await util.uploadImageToS3Bucket(req.body.base64Img);

                const confirmationInsert = await confirmations.insertOne({
                    user: req.body.user,
                    submittedAt: current_ts
                }); 

                 await images.insertOne({
                    submittedAt: current_ts,
                    confirmationID: confirmationInsert.insertedId,
                    drunkId: null,
                    imageURL: imgUrl        
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
                    
                    // update the confirmations image drunk id, as they are now directly linked to the latest drunk event
                    // this helps us get the images related to a drunk event
                    await images.updateMany(
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