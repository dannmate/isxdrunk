const mongodb  = require('mongodb');
require('dotenv').config();

module.exports = {
    getDrunk: async function() {
        const client = await mongodb.MongoClient.connect(
            process.env.MONGODB_CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true});
    
        return client.db('isxdrunk').collection('drunk');
    },
    checkDrunk: async function(drunkCollection) {
        const current_ts = new Date();
        const maxDrunkTs = await drunkCollection.find().sort({drunkEndDate:-1}).limit(1).toArray();

        return current_ts < maxDrunkTs[0].drunkEndDate;
    },
    getUsers: async function(drunkCollection) {
        const client = await mongodb.MongoClient.connect(
            process.env.MONGODB_CONNECTION_STRING,{useNewUrlParser: true, useUnifiedTopology: true});
    
        return client.db('isxdrunk').collection('user');
    },
    uploadImageToS3Bucket: async function(base64Img) {
      

    }
    

}

