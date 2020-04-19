const express = require('express');
const mongodb  = require('mongodb');

const router = express.Router();

// Get if my mate is drunk or notbundleRenderer.renderToStream

router.get('/', (req,res) => {
    res.send('Hello');
});

module.exports = router;