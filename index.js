const Express = require('express');
const puppeteer = require('puppeteer');

const app = Express();
let browser = null;

const APP_PORT = process.env.PORT || 10000;
const PROXY_DOMAIN = process.env.PROXY_DOMAIN || 'www.myproguide.com';

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

app.get('/', validate_request, (req, res) => {
    return browser.newPage()
    .then(page => {
        page.waitForSelector(`meta[property="og:title"]`)
        .then(async () => res.status(200).send(await getPageContent(page)))
        .catch(err => res.status(500).json({error: 'Render timeout'}));
        return page.goto(`${PROXY_DOMAIN}${req.originalUrl}`);
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json({error: err});
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