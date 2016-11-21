'use strict';

const secret = 'superawesomesecret';

let request = require('supertest');
let express = require('express');
let app = express();
let uphook = require('../uphook');
let fs = require('fs');

app.post('/gh-hook', uphook.github({
  secret: secret,
  verify: function(){return false;}
}));

describe('github webhooks', function() {
  it('takes a valid GitHub webhook', function(done) {
    request(app, new Buffer(fs.readFileSync('./test/assets/github-valid.json'), 'base64'))
      .post('/gh-hook')
      .set('content-type', 'application/json')
      .set('Expect', '')
      .set('User-Agent', 'GitHub-Hookshot/ac156fb')
      .set('X-GitHub-Delivery', 'd1af9a80-af80-11e6-9c78-b4baecc83d2a')
      .set('X-GitHub-Event', 'push')
      .set('X-Hub-Signature', 'sha1=eb1ea81820c5868b50aae70cc5b702b791b962ca')
      .expect(500, done);
  });
});
