const Express = require('express');
const puppeteer = require('puppeteer');

const app = Express();
let browser, page = null;

const APP_PORT = process.env.PORT || 10000;

const validate_request = (req, res, next) => {
    if (!browser) res.status(500).json({error: 'Browser is not initialized'});
    if (!req.query.url) res.status(400).json({error: 'No URL provided'});
    else next();
}

app.get('/', validate_request, (req, res) => {
    return browser.newPage()
    .then(_page => {
        return _page.goto(req.query.url, {waitUntil: 'networkidle'})
    })
    .then(response => _page.content())
    .then(content => {
        console.log(content);
        return res.status(200).send(content);
    })
    .error(err => {
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
