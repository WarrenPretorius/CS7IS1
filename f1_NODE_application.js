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
function seasonpoints(year) {
    return `SELECT DISTINCT ?name ?points WHERE {
  ?season a <http://example.org/f1/Season> .
  ?season <http://example.org/f1/year> ${year} . 
  ?race a <http://example.org/f1/Race> .
  ?race <http://example.org/f1/year> ?season .
  ?result a <http://example.org/f1/Results> .
  ?result <http://example.org/f1/raceid> ?race .
  ?result <http://example.org/f1/points> ?points .
  ?result <http://example.org/f1/driverid> ?driver .
  ?driver <http://example.org/f1/surname> ?name .
} ORDER BY DESC(xsd:integer(?points)) LIMIT 1`;
}
function driverRaceyear1(year, race) {
    return `SELECT DISTINCT ?name ?racename WHERE {
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
} ORDER BY ASC(xsd:integer(?pos)) LIMIT 1`;
}
function consRaceYear2(year,race) {
    return `SELECT DISTINCT ?season ?consname ?racename ?pos WHERE {
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
       } ORDER BY ASC(xsd:integer(?pos)) LIMIT 1
       `;
}
function circFastLapSeason3(year) {
    return `SELECT DISTINCT ?laptime ?racename ?consname ?circname WHERE {
        ?season a <http://example.org/f1/Season> .
        ?season <http://example.org/f1/year> year .
        ?race a <http://example.org/f1/Race> .
        ?race <http://example.org/f1/year> ?season .
        ?race <http://example.org/f1/name> ?racename .
        ?race <http://example.org/f1/circuitid> ?circuitid .
        ?circuitid <http://example.org/f1/name> ?circname .
        ?result a <http://example.org/f1/Results> .
        ?result <http://example.org/f1/raceid> ?race .
        ?result <http://example.org/f1/fastestlaptime> ?laptime .
        ?cons a <http://example.org/f1/Constructor> .
        ?result <http://example.org/f1/constructorid> ?consid .
        ?consid <http://example.org/f1/name> ?consname .
       } ORDER BY ASC(xsd:string(?laptime)) LIMIT 1
       `;
}

function slowLapYearSeason5(year) {
    return `SELECT DISTINCT ?time ?ms ?name ?accyear ?racename WHERE{
        ?laptimes a <http://example.org/f1/LapTimes> .
        ?laptimes <http://example.org/f1/milliseconds> ?ms .
        ?laptimes <http://example.org/f1/time> ?time .
        ?laptimes <http://example.org/f1/raceid> ?raceid .
        ?laptimes <http://example.org/f1/driverid> ?driverid .
        ?driverid <http://example.org/f1/surname> ?name .
        ?raceid <http://example.org/f1/name> ?racename .
        ?raceid <http://example.org/f1/year> ?year .
        ?year <http://example.org/f1/year> ?accyear .
       FILTER (?accyear= ${year}  && ?ms <= 480000)
       } ORDER BY DESC(xsd:string(?time)) LIMIT 1
       `;
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

    function seasondrivermostpointsrace(agent) {
        var year = agent.parameters.number;
        console.log(year);
        return new Promise((resolve, rejct) => {
            console.log(year);
            query.execute(conn, 'formula11', seasonpoints(year), 'application/sparql-results+json', {
                limit: 1,
                offset: 0,
            }).then(({ body }) => {
                var fr = '';
                if (body.results.bindings) {
                    console.log(body.results.bindings);
                    body.results.bindings.map((bindObj, index) => {
                        var json_res = String(`It was ${bindObj.name.value} with ${bindObj.points.value} points`);
                        fr += json_res;
                    });
                    agent.add(String(fr));
                    return resolve();
                }
            });
        });
    }

    function f_driverRaceYear(agent) {
        return new Promise((resolve, rejct) => {
            let year = agent.parameters.number;
            let race = agent.parameters.Race;
            query.execute(conn, 'formula11', driverRaceyear1(year, race), 'application/sparql-results+json', { limit: 1, offset: 0, })
                .then(({ body }) => {
                    let name = body.results.bindings[0].name.value;
                    agent.add(`The winner for the ${race} was ${name}`);
                    return resolve();
                });
        });
    }

    function f_consRaceYear(agent) {
        return new Promise((resolve, rejct) => {
            let year = agent.parameters.number;
            let race = agent.parameters.Race;
            query.execute(conn, 'formula11', consRaceYear2(year, race), 'application/sparql-results+json', { limit: 1, offset: 0, })
                .then(({ body }) => {
                    let name = body.results.bindings[0].name.value;
                    agent.add(`The winner for the ${race} was ${name}`);
                    return resolve();
                });
        });
    }

    function f_circFastLapSeason(agent) {
        return new Promise((resolve, rejct) => {
            let year = agent.parameters.number;
            let race = agent.parameters.Race;
            query.execute(conn, 'formula11', circFastLapSeason3(year), 'application/sparql-results+json', { limit: 1, offset: 0, })
                .then(({ body }) => {
                    let laptime = body.results.bindings[0].laptime.value;
                    let circname = body.results.bindings[0].circname.value;
                    agent.add(`The fastest lap time for ${year} on ${circname} was ${laptime}`);
                    return resolve();
                });
        });
    }

    function f_driverSlowYear(agent) {
        return new Promise((resolve, rejct) => {
            let year = agent.parameters.number;
            query.execute(conn, 'formula11', driverSlowYear4(year), 'application/sparql-results+json', { limit: 1, offset: 0, })
                .then(({ body }) => {
                    let laptime = body.results.bindings[0].laptime.value;
                    let time = body.results.bindings[0].time.value;
                    let name = body.results.bindings[0].name.value;
                    agent.add(`The Slowest lap time in ${year} was ${time} on ${circname} set by ${name} `);
                    return resolve();
                });
        });
    }

    function f_slowLapYearSeason(agent) {
        return new Promise((resolve, rejct) => {
            let year = agent.parameters.number;
            query.execute(conn, 'formula11', slowLapYearSeason5(year), 'application/sparql-results+json', { limit: 1, offset: 0, })
                .then(({ body }) => {
                    let racename = body.results.bindings[0].racename.value;
                    let time = body.results.bindings[0].time.value;
                    let name = body.results.bindings[0].name.value;
                    agent.add(`The Slowest lap time in ${year} was ${time} at ${racename} set by ${name} `);
                    return resolve();
                });
        });
    } 

    function showStatementsHandler(agent) {
        return new Promise((resolve, rejct) => {
            var limit = agent.parameters.number;
            agent.add(`Please wait a moment while I fetch ${limit} statements`);
            console.log(limit);
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
    intentMap.set('SeasonDriverMostPointsRace', seasondrivermostpointsrace);
    intentMap.set('1Which Driver Won Race in Year', f_driverRaceYear);
    intentMap.set('2Which Cons Won Race in Year', f_consRaceYear);
    intentMap.set('3Circuit FastestLap Season', f_circFastLapSeason);
    intentMap.set('5Slowest Lap Year Season', f_slowLapYearSeason);
    intentMap.set('6Driver Most Race Won Season', f_mostRaceWonSeason);
    intentMap.set('7Driver Won Champ Season', f_driverChampSeason);
    intentMap.set('8Const Win Champ Season', f_consChampSeason);
    intentMap.set('9Driver Most Pole Season', f_driverMostPoleSeason);
    intentMap.set('10Cons Most Pole Seaon', f_constMostPoleSeason);
    

    agent.handleRequest(intentMap);
});
