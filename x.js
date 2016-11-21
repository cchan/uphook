'use strict';

let express = require('express');
let app = express();
let hook = require('./uphook').github({
  secret: 'superawesomesecret',
  verify: function(req, res){
    //before it calls gitupdate(), can return false to cancel that.
  },
  callback: function(err, payload){
    if(!err)
      process.exit(0); //lets PM2 restart the process
  }
});
app.use('/gh-update', hook);
let listener = app.listen(5233, function(){
  console.log('Listening on :' + listener.address().port);
});
