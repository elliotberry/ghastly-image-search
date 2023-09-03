import cheerio from 'cheerio';
import queryString from 'querystring';
import flatten from 'lodash.flatten';
import fetch from 'node-fetch';

//to be a tiny bit secret like a moron: https://stackoverflow.com/questions/14458819/simplest-way-to-obfuscate-and-deobfuscate-a-string-in-javascript
String.prototype.obfs = function(key, n = 126) {
 // return String itself if the given parameters are invalid
 if (!(typeof(key) === 'number' && key % 1 === 0)
   || !(typeof(key) === 'number' && key % 1 === 0)) {
   return this.toString();
 }

 var chars = this.toString().split('');

 for (var i = 0; i < chars.length; i++) {
   var c = chars[i].charCodeAt(0);

   if (c <= n) {
     chars[i] = String.fromCharCode((chars[i].charCodeAt(0) + key) % n);
   }
 }

 return chars.join('');
};
String.prototype.defs = function(key=22, n = 126) {
  // return String itself if the given parameters are invalid
  if (!(typeof(key) === 'number' && key % 1 === 0)
    || !(typeof(key) === 'number' && key % 1 === 0)) {
    return this.toString();
  }

  return this.toString().obfs(n - key);
};


async function gis(opts) {
  const baseURL = '\x00\f\f\bPEE\x01\x05w}{\vD}\x07\x07}\x04{Dy\x07\x05E\v{w\ny\x00U';

  const imageFileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
  let searchTerm;
  let queryStringAddition;
  const filterOutDomains = ['}\v\fw\f\x01yDy\x07\x05'.defs()];

  if (typeof opts === 'string') {
    searchTerm = opts;
  } else {
    searchTerm = opts.searchTerm;
    queryStringAddition = opts.queryStringAddition;
    filterOutDomains = [...filterOutDomains, ...opts.filterOutDomains];
  }
  
  let url =
    baseURL.defs() +
    queryString.stringify({
      tbm: 'isch',
      q: searchTerm,
    });

  if (queryStringAddition) {
    url += queryStringAddition;
  }

  const reqOpts = {
    headers: {
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    },
  };

  const res = await fetch(url, reqOpts); // Sending the request
  const data = await res.text(); // Parsing the response as JSON
 
  const $ = cheerio.load(data);

  const scripts = $('script');

  const scriptContents = [];
  for (let i = 0; i < scripts.length; ++i) {
    if (scripts[i].children.length > 0) {
      const content = scripts[i].children[0].data;
      if (containsAnyImageFileExtension(content)) {
        scriptContents.push(content);
      }
    }
  }

  return flatten(scriptContents.map(collectImageRefs));

  function addSiteExcludePrefix(s) {
    return `-site:${s}`;
  }
  
  function containsAnyImageFileExtension(s) {
    const lowercase = s.toLowerCase();
    return imageFileExtensions.some(containsImageFileExtension);
  
    function containsImageFileExtension(ext) {
      return lowercase.includes(ext);
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
          height: +result[2],
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
      return !url.includes(skipDomain);
    }
  }
}

export default gis;