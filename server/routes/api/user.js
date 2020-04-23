const express = require('express');
const mongodb  = require('mongodb');
require('dotenv').config();
const util = require('../../modules/util');

const router = express.Router();

// Get if my mate is drunk or not
router.get('/', async (req,res) => {
    const users = await util.getUsers();

    res.send(await users.find({}, {projection:{ user: 1 , _id: 0}}).toArray());
});

module.exports = router;