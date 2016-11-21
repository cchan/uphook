/*
uphook
express middleware to automatically update and restart an application based on github webhook.

usage: if verified hook on right branch, git force-pulls to current branch and calls the callback.
  let hook = require('uphook').github(process.env.GH_SECRET, function(payload){
    process.exit(0); //lets PM2 restart the process
  });
  express.use('/gh-update', hook);

note that you should definitely use SSL because GitLab doesn't have HMAC, which is dumb.
*/

let bluebird = require('bluebird');
let exec = bluebird.promisify(require('child_process').exec);
let branch = require('git-branch').sync(); //meh, it could change the branch mid-execution but like that's even more problematic
let bodyParser = require('body-parser');

//Careful, as this erases all tracked changes.
//todo: generalize to default to tracked branch but be able to pull from any remote
function gitupdate(req, res, callback){
  exec('git fetch --all && git reset --hard origin/' + branch + ' && npm install && npm prune')
  .spread(function(stdout, stderr){
    console.log(stdout, stderr);
    res.sendStatus(200);
    callback(req.body);
  }).catch(function(err){
    console.error(err);
    res.sendStatus(500);
  });
}

module.exports.github = function(secret, callback){
  let ghHandler = require('github-webhook-middleware')({secret: secret});
  return [
    //returns two middlewares for Express to run sequentially.
    ghHandler,
    function (err, req, res, next){
      if(req.headers['x-github-event'] != 'push' || req.body.ref != 'refs/heads/' + branch)
        res.sendStatus(200);
      else
        gitupdate(req, res, callback);
    }
  ];
};

module.exports.gitlab = function(secret, callback){
  return bodyParser.json({
    verify: function (req, res, buffer){
      //no hmac, smh gitlab
      //'sha1=' + crypto.createHmac('sha1', secret).update(buffer).digest('hex') == req.headers['x-gitlab-signature'];
      if(req.headers['x-gitlab-token'] != secret)
        throw new Error('Invalid Token');
      else if(req.headers['x-gitlab-event'] != 'Push Hook' || req.body.ref != 'refs/heads/' + branch)
        res.sendStatus(200);
      else
        gitupdate(req, res, callback);
    }
  });
};
