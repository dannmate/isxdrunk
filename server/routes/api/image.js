const express = require('express');
const mongodb  = require('mongodb');
require('dotenv').config();
const util = require('../../modules/util');

const router = express.Router();

// Get all historial images, not inlcluding the current drunk images
router.get('/history', async (req,res) => {

    try {
        const drunkCollection = await util.getDrunk();
        const isDrunk = await util.checkDrunk(drunkCollection);
        const images = await util.getDrunkImages();
        

        if (isDrunk) {

            // get latest drunk event
            const maxDrunkTs = await drunkCollection.find().sort({drunkEndDate:-1}).limit(1).toArray();

            // only send historial drunk images that dont include the latest drunk event. We will show them seperately via drunk route
            res.send(await images.find({drunkId: { $ne: maxDrunkTs[0]._id }}, {projection:{imageURL: 1, submittedAt:1, _id: 0 }}).sort( { submittedAt: -1 } ).toArray());         
        }
        else {   
            
            // send all historial drunk images
            res.send(await images.find({}, {projection:{imageURL: 1, submittedAt:1, _id: 0 }}).sort( { submittedAt: -1 } ).toArray());
        }

    }
    catch(err) {
        res.status(400).send({
            "message": err.message
         });      

    }
  
    
});

// Add drunk image
router.post('/add', async (req,res) => {

    try {

        const drunkCollection = await util.getDrunk();
        const isDrunk = await util.checkDrunk(drunkCollection);
        if (isDrunk) {

            const images = await util.getDrunkImages();
            const maxDrunkTs = await drunkCollection.find().sort({drunkEndDate:-1}).limit(1).toArray();

            const imgUrl = await util.uploadImageToS3Bucket(req.body.base64Img);
            const current_ts = new Date();

            await images.insertOne({
                submittedAt: current_ts,
                confirmationID: null,
                drunkId: maxDrunkTs[0]._id,
                imageURL: imgUrl        
            }); 

            res.status(201).send();
        } else {
            res.status(400).send({
                "message": "Cannot add image when not drunk"
             });    
        }
       
    } catch(err) {

        res.status(400).send({
            "message": err.message
         });       
    }

});


module.exports = router;