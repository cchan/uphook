/*
uphook
express middleware to automatically update and restart an application based on github webhook.

usage: if verified hook on right branch, git force-pulls to current branch and calls the callback.
  let hook = require('uphook').github({
    secret: process.env.GH_SECRET,
    verify: function(req, res){
      //before it calls gitupdate(), can return false to cancel that.
    },
    callback: function(err, payload){
      if(!err)
        process.exit(0); //lets PM2 restart the process
    }
  });
  app.use('/gh-update', hook);

note that you should definitely use SSL because GitLab doesn't have HMAC, which is dumb.
*/

'use strict';

let bluebird = require('bluebird');
let exec = bluebird.promisify(require('child_process').exec);
let branch = require('git-branch').sync(); //meh, it could change the branch mid-execution but like that's even more problematic
let bodyParser = require('body-parser');
let crypto = require('crypto');
let fs = require('fs');

//Careful, as this erases all tracked changes.
//todo: generalize to default to tracked branch but be able to pull from any remote
function gitupdate(req, res, callback){
  let promise = exec('git fetch --all && git reset --hard origin/' + branch + ' && npm install && npm prune')
  .spread(function(stdout, stderr){
    console.log(stdout, stderr);
    res.sendStatus(200);
    callback(null, req.body);
  });
  
  if(callback)
    return promise.catch(function(err){
      console.error(err);
      res.sendStatus(500);
      callback(err, req.body);
    });
  else
    return promise;
}

let generalized = function(options, checkHeaders){
  let secret = options.secret;
  if(!secret) throw new Error('No secret given');
  
  let verify = options.verify || function(){return true;}
  let callback = options.callback || function(){};
  
  return [
    bodyParser.json({
      verify: function(req, res, buffer){
        req.digest = function(){
          return 'sha1=' + crypto.createHmac('sha1', secret).update(buffer).digest('hex');
        };
      }
    }),
    function (req, res, next){
      if(!checkHeaders(req))
        res.sendStatus(403);
      else if(!verify(req, res))
        res.sendStatus(500);
      else
        gitupdate(req, res, callback);
    }
  ];
}

module.exports.github = function(options){
  return generalized(options, function(req){
    return (req.headers['x-hub-signature'] == req.digest()
      && req.headers['x-github-event'] == 'push'
      && req.body.ref == 'refs/heads/' + branch);
  });
};

module.exports.gitlab = function(options){
  return generalized(options, function(req){
    return (req.headers['x-gitlab-token'] == secret
      && req.headers['x-gitlab-event'] == 'Push Hook'
      && req.body.ref == 'refs/heads/' + branch);
  });
};
