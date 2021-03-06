const Express = require('express');
const puppeteer = require('puppeteer');

const app = Express();
let browser = null;

const APP_PORT = process.env.PORT || 80;
const PROXY_SCHEME = process.env.PROXY_SCHEME || 'https';
const PROXY_DOMAIN = process.env.PROXY_DOMAIN || 'www.myproguide.com';
const SOCIAL_MEDIA_META_TAG = process.env.SOCIAL_MEDIA_META_TAG || `meta[property="og:title"]`;
const RENDER_WAITING_TIMEOUT = process.env.RENDER_WAITING_TIMEOUT || 5000;
const PAGE_LOADED_CHECK_METHOD = process.env.PAGE_LOADED_CHECK_METHOD || 'networkidle';
const NETWORK_IDLE_TIMEOUT = process.env.NETWORK_IDLE_TIMEOUT || 3500;

const validate_request = (req, res, next) => {
    if (!browser) res.status(500).json({error: 'Browser is not initialized'});
    else next();
}

const getPageContent = async function(page){
    return await page.evaluate(() => {
        let retVal = '';
        if (document.doctype)
          retVal = new XMLSerializer().serializeToString(document.doctype);
        if (document.documentElement)
          retVal += document.documentElement.outerHTML;
        return retVal;
    });
}

app.get(/^\/.*/, validate_request, (req, res) => {
    let page;
    return browser.newPage()
    .then(_page => {
        page = _page;
        page.on('pageerror', err => {
            res.status(500).send(`Something go wrong!`);
            console.error(err);
        });
        page.on('error', err => {
            res.status(500).send(`Something go wrong!`);
            console.error(err);
        });
        // page.waitForSelector(SOCIAL_MEDIA_META_TAG, {timeout: RENDER_WAITING_TIMEOUT})
        // .then(async () => { res.status(200).send(await getPageContent(page)); page.close(); })
        // .catch(async err => { res.status(200).send(await getPageContent(page)); page.close(); });
        return page.goto(`${PROXY_SCHEME}://${PROXY_DOMAIN}${req.originalUrl}`, {waitUntil: PAGE_LOADED_CHECK_METHOD, networkIdleTimeout: NETWORK_IDLE_TIMEOUT});
    })
    .then(async() => {
        res.status(200).send(await getPageContent(page));
        page.close();
    })
    .catch(async err => {
        let pageContent = '';
        try {pageContent = await getPageContent(page)}
        catch(pageerr) { console.error(pageerr);}
        // res.status(200).send(pageContent);
        page.close();
        console.error(err);
    });
})

process.on('beforeExit', () => {
    if(browser) browser.close();
})

puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
.then(_browser => { browser = _browser; })
.then(() => app.listen(APP_PORT, () => console.log(`Server started at port ${APP_PORT}`)))
.catch(err => {
    console.error('Chrome headless initialize failed!');
    console.error(err);
    process.exit(1);
})
