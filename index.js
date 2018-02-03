const cheerio = require('cheerio');
const co = require('co');
const fs = require('fs');
const request = require('request');

const requestPromise = function(url) {
  return new Promise((resolve, reject) => {
    request(url, function(error, response, body) {
      if (!error && response && response.statusCode === 200) {
        resolve(body);
      }
      reject(new Error('Request failed'));
    });
  });
};

const getDownloadLink = function(url) {
  return requestPromise(url).then(function(body) {
    const $ = cheerio.load(body);
    return {
      name: $('#frontpage a').attr('href'),
      link: url + '/' + $('#frontpage a').attr('href'),
    };
  });
};

co(function*() {
  const baseUrl = 'http://goalkicker.com/';
  const links = [];
  const $ = cheerio.load(yield requestPromise(baseUrl));
  $('.bookContainer a').each(function(index, value) {
    links.push(getDownloadLink(baseUrl + $(value).attr('href')));
  });
  const allRequests = yield links;
  if (!fs.existsSync('GoalKickerBooks')) {
    fs.mkdirSync('GoalKickerBooks');
  }
  allRequests.forEach(function(result) {
    if (!fs.existsSync('GoalKickerBooks/' + result.name)) {
      request(result.link).pipe(
        fs.createWriteStream('GoalKickerBooks/' + result.name)
      );
    }
  });
});
