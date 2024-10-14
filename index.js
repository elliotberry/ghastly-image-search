import * as cheerio from 'cheerio';
import flatten from 'lodash.flatten';
import queryString from 'node:querystring';

//to be a tiny bit secret like a moron: https://stackoverflow.com/questions/14458819/simplest-way-to-obfuscate-and-deobfuscate-a-string-in-javascript
String.prototype.obfs = function(key, n = 126) {
 // return String itself if the given parameters are invalid
 if (!(typeof(key) === 'number' && key % 1 === 0)
   || !(typeof(key) === 'number' && key % 1 === 0)) {
   return this.toString();
 }

 var chars = this.toString().split('');

 for (var index = 0; index < chars.length; index++) {
   var c = chars[index].charCodeAt(0);

   if (c <= n) {
     chars[index] = String.fromCharCode((chars[index].charCodeAt(0) + key) % n);
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


async function gis(options) {
  const baseURL = '\u0000\f\f\bPEE\u0001\u0005w}{\vD}\u0007\u0007}\u0004{Dy\u0007\u0005E\v{w\ny\u0000U';

  const imageFileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
  let searchTerm;
  let queryStringAddition;
  let filterOutDomains = ['}\v\fw\f\u0001yDy\u0007\u0005'.defs()];

  if (typeof options === 'string') {
    searchTerm = options;
  } else {
    let filter = options.filterOutDomains || [];
    searchTerm = options.searchTerm;
    queryStringAddition = options.queryStringAddition;
    filterOutDomains = [...filterOutDomains, ...filter];
  }
  
  let url =
    baseURL.defs() +
    queryString.stringify({
      q: searchTerm,
      tbm: 'isch',
    });

  if (queryStringAddition) {
    url += queryStringAddition;
  }

  const requestOptions = {
    headers: {
      'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    },
  };

  const res = await fetch(url, requestOptions); // Sending the request
  const data = await res.text(); // Parsing the response as JSON
 
  const $ = cheerio.load(data);

  const scripts = $('script');

  const scriptContents = [];
  for (const script of scripts) {
    if (script.children.length > 0) {
      const content = script.children[0].data;
      if (containsAnyImageFileExtension(content)) {
        scriptContents.push(content);
      }
    }
  }

  return flatten(scriptContents.map(collectImageReferences));

  function addSiteExcludePrefix(s) {
    return `-site:${s}`;
  }
  
  function containsAnyImageFileExtension(s) {
    const lowercase = s.toLowerCase();
    return imageFileExtensions.some(containsImageFileExtension);
  
    function containsImageFileExtension(extension) {
      return lowercase.includes(extension);
    }
  }
  
  function collectImageReferences(content) {
    const references = [];
    const re = /\["(http.+?)",(\d+),(\d+)\]/g;
    let result;
    while ((result = re.exec(content)) !== null) {
      if (result.length > 3) {
        const reference = {
          height: +result[2],
          url: result[1],
          width: +result[3],
        };
        if (domainIsOK(reference.url)) {
          references.push(reference);
        }
      }
    }
    return references;
  }

  function domainIsOK(url) {
    return filterOutDomains ? filterOutDomains.every(skipDomainIsNotInURL) : true;

    function skipDomainIsNotInURL(skipDomain) {
      return !url.includes(skipDomain);
    }
  }
}

export default gis;