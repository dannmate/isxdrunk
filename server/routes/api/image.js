const express = require('express');
const mongodb  = require('mongodb');
require('dotenv').config();
const util = require('../../modules/util');

const router = express.Router();

// Add drunk image
router.get('/add', async (req,res) => {

    try {

        const drunkCollection = await util.getDrunk();
        const isDrunk = await util.checkDrunk(drunkCollection);
        if (isDrunk) {

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