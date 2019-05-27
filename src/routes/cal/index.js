import { Router } from 'express';
import ical from 'node-ical';
import moment from 'moment';
import * as wst from 'services/vendors/web-standards';

export const router = Router();

moment.locale('ru-RU');

router.get('/', function(req, res, next) {
    wst
        .getRemoteCal()
        .then(vendorResponse => parseCalendar(vendorResponse.data))
        .then(events => {
            res.json({ events });
        })
        .catch(next);
});

router.post('/', function(req, res, next) {
    const request = req.body;

    if (!request.request.original_utterance && request.request.type !== 'ButtonPressed') {
        res.json(prepareEmptyResponse(request));
        return;
    }

    if (needToStop(request.request)) {
        res.json(prepareStopResponse(request));
        return;
    }

    wst
        .getRemoteCal()
        .then(vendorResponse => parseCalendar(vendorResponse.data))
        .then(data => {
            let events = getEvents(data);

            events = filterByDate(events);
            events = filterByPlace(events, request.request);

            res.json(prepareResponse(events.splice(0, 3), request));
        })
        .catch(next);
});

function needToStop(req) {
    const stopWords = ['хватит', 'стоп', 'спасибо'];
    return req.nlu.tokens.length <= 2 &&
        stopWords.some(w => req.nlu.tokens.includes(w));
}

function prepareStopResponse(req) {
    const { session, version } = req;

    return {
        response: {
            text: "Приходи ещё. Хорошего дня!",
            end_session: true
        },
        session,
        version
    };
}

function prepareEmptyResponse(req) {
    const { session, version } = req;

    return {
        response: {
            text: "Привет! Со мной ты можешь узнать о ближайших фронтенд событиях в России и мире. Назови город.",
            tts: "Привет! Со мной ты можешь узнать о ближайших фронт+энд событиях в России и мире. Назови город.",
            buttons: [
                {
                    title: "Ближайшие события",
                    payload: {},
                    hide: false
                },
                {
                    title: "События в Москве",
                    payload: {
                        city: 'москва'
                    },
                    hide: false
                }
            ],
            end_session: false
        },
        session,
        version
    };
}

function addTextTranscription(text) {
    return text
        .replace(/-?JS-?/ig, ' джэ +эс ')
        .replace(/-?CSS-?/ig, ' си эс +эс ');
}

function prepareResponse(events, req) {
    const { session, version } = req;

    const text = events.length ?
        events.map(event => {
            let eventText = `${moment(event.start).format('D MMMM')}`;
            if (event.location) {
                eventText += ` в городе ${event.location}`;
            }
            eventText += ` пройдёт ${event.summary.replace('#', 'номер ')}.`;
            return eventText;
        }).join('\n') :
        'По такому запросу ничего не найдено. Попробуйте по-другому.';

    const buttons = events
        .filter(e => e.description)
        .map(e => {
            return {
                title: e.summary,
                url: e.description,
                payload: {},
                hide: false
            }
        });

    return {
        response: {
            text: text,
            tts: addTextTranscription(text),
            buttons: [
                ...buttons,
                {
                    title: 'Ближайшие события',
                    payload: {},
                    hide: false
                }
            ],
            end_session: false
        },
        session,
        version
    };
}

function getEvents(data) {
    const events = [];
    for (let k in data) {
        if (data.hasOwnProperty(k)) {
            const event = data[k];
            if (event.type === 'VEVENT') {
                events.push(event);
            }
        }
    }
    return events;
}

function filterByDate(events) {
    return events.filter(event => {
        const current = new Date().getTime();
        const start = new Date(event.start).getTime();
        return (start > current) ||
            (event.end && new Date(event.end).getTime() > current && start <= current);
    });
}

function filterByPlace(events, req) {
    const cities = new Set();
    const geoEntities = req.nlu.entities.filter(e => e.type === 'YANDEX.GEO');

    if (req.payload && req.payload.city) cities.add(req.payload.city);

    geoEntities.forEach(e => {
        let city = e.value.city && e.value.city.toLowerCase();
        if (city && !cities.has(city)) {
            cities.add(city);
        }
    });

    if (cities.size ||
        events.some(e => e.location && req.nlu.tokens.includes(e.location.toLowerCase()))) {
        return events.filter(event => {
            if (!event.location) return false;

            return cities.has(event.location.toLowerCase()) || req.nlu.tokens.includes(event.location.toLowerCase());
        });
    }

    return events;
}

function parseCalendar(str) {
    return new Promise((resolve, reject) => {
        ical.parseICS(str, function(err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}
