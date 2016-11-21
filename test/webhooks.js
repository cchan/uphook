const secret = 'superawesomesecret';

let express = require('express');
let app = express();
let uphook = require('../uphook');

app.use('gh-hook', uphook);

describe('github webhooks', function() {
  it('takes a valid GitHub webhook', function(done) {
    request(app)
      .post('/gh-hook')
      .set('Accept', 'application/json')
      //hardcoded hmac digest headers
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
});
