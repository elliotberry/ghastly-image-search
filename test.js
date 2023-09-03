import gis from "./index.js";

(async () => {
    const results = await gis('cats');
    console.log(results);
    })();