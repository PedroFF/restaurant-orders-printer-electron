const axios = require('axios');
const api_url = require('../config.json').API_URL;
const config = {
    headers: {
        'Authorization': AUTH_TOKEN,
        'Accept': 'application/json',
        'Glf-Api-Version': 2
    }
};


axios.post(
    api_url,
    config
).then(console.log).catch(console.log);
