const axios = require('axios');
const cheerio = require('cheerio');
const queryString = require('querystring');
const flatten = require('lodash.flatten');

const baseURL = 'http://images.google.com/search?';

const imageFileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];

async function gis(opts) {
  let searchTerm;
  let queryStringAddition;
  const filterOutDomains = ['gstatic.com'];

  if (typeof opts === 'string') {
    searchTerm = opts;
  } else {
    searchTerm = opts.searchTerm;
    queryStringAddition = opts.queryStringAddition;
    filterOutDomains = filterOutDomains.concat(opts.filterOutDomains);
  }

  let url =
    baseURL +
    queryString.stringify({
      tbm: 'isch',
      q: searchTerm
    });

  if (filterOutDomains) {
    url += encodeURIComponent(
      ' ' + filterOutDomains.map(addSiteExcludePrefix).join(' ')
    );
  }

  if (queryStringAddition) {
    url += queryStringAddition;
  }
  const reqOpts = {
    url: url,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
    }
  };

  const { data } = await axios.get(reqOpts);

  const $ = cheerio.load(data);
  const scripts = $('script');
  const scriptContents = [];
  for (const i = 0; i < scripts.length; ++i) {
    if (scripts[i].children.length > 0) {
      const content = scripts[i].children[0].data;
      if (containsAnyImageFileExtension(content)) {
        scriptContents.push(content);
      }
    }
  }

  function collectImageRefs(content) {
    const refs = [];
    const re = /\["(http.+?)",(\d+),(\d+)\]/g;
    let result;
    while ((result = re.exec(content)) !== null) {
      if (result.length > 3) {
        const ref = {
          url: result[1],
          width: +result[3],
          height: +result[2]
        };
        if (domainIsOK(ref.url)) {
          refs.push(ref);
        }
      }
    }
    return refs;
  }

  function domainIsOK(url) {
    if (!filterOutDomains) {
      return true;
    } else {
      return filterOutDomains.every(skipDomainIsNotInURL);
    }

    function skipDomainIsNotInURL(skipDomain) {
      return url.indexOf(skipDomain) === -1;
    }
  }

  return flatten(scriptContents.map(collectImageRefs));
}

function addSiteExcludePrefix(s) {
  return '-site:' + s;
}

function containsAnyImageFileExtension(s) {
  const lowercase = s.toLowerCase();
  return imageFileExtensions.some(containsImageFileExtension);

  function containsImageFileExtension(ext) {
    return lowercase.includes(ext);
  }
}

module.exports = gis;
