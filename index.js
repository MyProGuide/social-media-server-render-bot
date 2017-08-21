const Express = require('express');
const puppeteer = require('puppeteer');

const app = Express();
const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

const APP_PORT = process.env.PORT || 1864;

const validate_request = (req, res, next) => {
    if (!req.query.url) res.status(400).json({error: 'No URL provided'});
    else next();
}

app.get('/', validate_request, (req, res) => {
    return browser.newPage()
    .then(page => page.goto(req.query.url))
    .then(page => page.content())
    .then(content => res.status(200).send(content));
})

process.on('beforeExit', () => {
    browser.close();
})

app.listen(APP_PORT, () => console.log(`Server started at port ${APP_PORT}`));