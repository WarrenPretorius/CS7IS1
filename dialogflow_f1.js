// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const { Connection, query } = require('stardog');
const conn = new Connection({
    username: 'admin',
    password: 'admin',
    endpoint: 'http://75e16e30.ngrok.io'
});

const triples = `SELECT * WHERE {?sub ?pred ?obj .}`;
function driverRaceyear(year, race) {
    return `SELECT DISTINCT ?name ?racename ?url WHERE {
 ?season a <http://example.org/f1/Season> .
 ?season <http://example.org/f1/year> ${year} .
 ?race a <http://example.org/f1/Race> .
 ?race <http://example.org/f1/year> ?season .
 ?race <http://example.org/f1/name> ?racename .
 ?race <http://example.org/f1/name> "${race}" .
 ?result a <http://example.org/f1/Results> .
 ?result <http://example.org/f1/raceid> ?race .
 ?result <http://example.org/f1/position> ?pos .
 ?result <http://example.org/f1/driverid> ?driver .
 ?driver <http://example.org/f1/surname> ?name .
 ?driver <http://example.org/f1/url> ?url .
} ORDER BY ASC(xsd:integer(?pos)) LIMIT 1`;
}
function consRaceYear(year, race) {
    return `SELECT DISTINCT ?consname WHERE {
 ?season a <http://example.org/f1/Season> .
 ?season <http://example.org/f1/year> ${year} .
 ?race a <http://example.org/f1/Race> .
 ?race <http://example.org/f1/year> ?season .
 ?race <http://example.org/f1/name> ?racename .
 ?race <http://example.org/f1/name> "${race}" .
 ?result a <http://example.org/f1/Results> .
 ?result <http://example.org/f1/raceid> ?race .
 ?result <http://example.org/f1/position> ?pos .
 ?cons a <http://example.org/f1/Constructor> .
 ?result <http://example.org/f1/constructorid> ?consid .
 ?consid <http://example.org/f1/name> ?consname .
} ORDER BY ASC(xsd:integer(?pos)) LIMIT 1`;
}

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements


exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    function f_driverRaceYear(agent) {
        return new Promise((resolve, rejct) => {
            let year = agent.parameters.number;
            let race = agent.parameters.Race;
            query.execute(conn, 'formula11', driverRaceyear(year, race), 'application/sparql-results+json', { limit: 1, offset: 0, })
                .then(({ body }) => {
                    let name = body.results.bindings[0].name.value;
                    let url = body.results.bindings[0].url.value;
                    agent.add(`The winner for the ${race} in ${year} was ${name}. Here's his link ${url}`);

                    return resolve();
                });
        });
    }

    function f_consRaceYear(agent) {
        return new Promise((resolve, rejct) => {
            let year = agent.parameters.number;
            let race = agent.parameters.Race;
            query.execute(conn, 'formula11', consRaceYear(year, race), 'application/sparql-results+json', { limit: 1, offset: 0, })
                .then(({ body }) => {
              		console.log(body.results.bindings);
                    let name = body.results.bindings[0].consname.value;
                    agent.add(`The winner for the ${race} in ${year} was ${name}.`);

                    return resolve();
                });
        });
    }

    function showStatementsHandler(agent) {
        return new Promise((resolve, rejct) => {
            var limit = agent.parameters.number;
            agent.add(`Please wait a moment while I fetch ${limit} statements`);
            if (limit > 10) {
                agent.add(`Can only show 10 max`);
                limit = 10;
            }
            query.execute(conn, 'formula11', triples, 'application/sparql-results+json', { limit: limit, offset: 0, })
                .then(({ body }) => {
                    var fr = '';
                    if (body.results.bindings) {
                        body.results.bindings.map((bindObj, index) => {
                            var json_res = String(`[${index}. ${bindObj.sub.value} -> ${bindObj.pred.value} -> ${bindObj.obj.value}]`);
                            fr += json_res;
                        });
                        agent.add(String(fr));
                        return resolve();
                    }
                });
        });
    }

    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('Show Statements', showStatementsHandler);
    intentMap.set('1Which Driver Won Race in Year', f_driverRaceYear);
    intentMap.set('2Which Cons Year Race', f_consRaceYear);

    agent.handleRequest(intentMap);
});
