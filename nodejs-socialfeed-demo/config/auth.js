// config/auth.js
module.exports = {
  'development': {
    'facebookAuth' : {
        'consumerKey': '1451514618492949',
        'consumerSecret': 'e3e509ae9ef86f81ac61c65306a485e1',
        'callbackUrl': 'http://socialfeed.com:8000/auth/facebook/callback'
    },
    'twitterAuth': {
      'consumerKey': 'CRMEitc907leplTaevcIavqoR',
      'consumerSecret': 'eEm6wEZpSf0u5fDTb0ynrkYXlpXpPBiZ7OZWIXhoRodOR2fpMW',
      'callbackUrl': 'http://socialfeed.com:8000/auth/twitter/callback'
    },
    'googleAuth': {
      'consumerKey': '281011982919-srl45brdgsq2olpvkqi6qd9r4miv8m89.apps.googleusercontent.com',
      'consumerSecret': 'lzldCcIKoiRGNL_WbIXrbOU_',
      'callbackUrl': 'http://www.socialfeed.com:8000/auth/google/callback'
    }
  }
}
