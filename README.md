GIS
=====
*ghastly image search*

A fork of Risa Fletcher's fork of Jim Kang's `g-i-s` package (whew, lad) that uses node-fetch to fetch the data. Additionally, instead of using callbacks, the API returns the requested images.

Works as of aug 2023. There are no certainties in life, and especially, with illicitly scraping images from a search engine.

Installation
------------

    yarn add elliotberry/GIS

Usage
-----

```javascript
import gis from 'elliotberry/g-i-s';

(() async => {
      const images = await gis("salem the cat");
      console.log(images)
}();
```

Output:

```javascript
{
  images: [
    {
      "url": "https://i.ytimg.com/vi/mW3S0u8bj58/maxresdefault.jpg",
      "width": 1280,
      "height": 720
    },
     ...
  ]
}
```

### Options
If you want to pass additional stuff to tack onto the Google image search URL, pass an object containing `searchTerm` and `queryStringAddition`. e.g.

```javascript
    const catImages = await gis({
      searchTerm: 'salem the cat',
      queryStringAddition: '&tbs=ic:trans'
    });
```

You can also filter out results from specfied domains:

```javascript
    const catImages = await gis({
      searchTerm: 'salem the cat',
      queryStringAddition: '&tbs=ic:trans',
      filterOutDomains: [
        'pinterest.com',
        'deviantart.com'
      ]
    });
```
Specifying `filterOutDomains` will both tell Google to not to include results that come from web pages on those domains and also filter image results that are hosted on those domains. (Sometimes an image is on an html page on a domain not included in your filters and has an img tag that loads from a domain that is included in your filters.)
