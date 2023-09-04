import gis from './index.js';

const search = searchTerm => {
  return new Promise((resolve, reject) => {
    var opts = {
      searchTerm: 'cats'
    };
    function logResults(error, results) {
        if (error) {
          reject(error);
        }
        else {
          resolve(JSON.stringify(results, null, '  '));
        }
      }
    gis(opts, logResults);
  });
};

gis('cats').then((results) => {
  console.log(results);
});
