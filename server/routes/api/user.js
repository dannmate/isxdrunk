const express = require('express');
const mongodb  = require('mongodb');
require('dotenv').config();
const util = require('../../modules/util');

const router = express.Router();

// Get if my mate is drunk or not
router.get('/', async (req,res) => {

    try {
        
        const users = await util.getUsers();
        res.send(await users.find({}, {projection:{ user: 1 , _id: 0}}).sort( { user: 1 } ).toArray());
    }
    catch {
        res.status(400).send({
            "message": err.message
         });     
    }
    
});

module.exports = router;