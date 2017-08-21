const Express = require('express');
const puppeteer = require('puppeteer');

const app = Express();
let browser = null;

const APP_PORT = process.env.PORT || 10000;

const validate_request = (req, res, next) => {
    if (!browser) res.status(500).json({error: 'Browser is not initialized'});
    if (!req.query.url) res.status(400).json({error: 'No URL provided'});
    else next();
}

app.get('/', validate_request, (req, res) => {
    return browser.newPage()
    .then(page => {
        page.waitForSelector('img');
        return page.goto(req.query.url);
    })
    .then(response => response.text())
    .then(content => res.status(200).send(content));
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
