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

    if (!request.request.original_utterance) {
        res.json(prepareEmptyResponse(request));
        return;
    }

    wst
        .getRemoteCal()
        .then(vendorResponse => parseCalendar(vendorResponse.data))
        .then(data => {
            let events = getEvents(data);

            if (hasDate(request.request)) {
                events = filterByDate(events);
            }

            events = filterByPlace(events, request.request);

            res.json(prepareResponse(events.splice(0, 3), request));
        })
        .catch(next);
});

function prepareEmptyResponse(req) {
    const { session, version } = req;

    return {
        response: {
            text: "Привет! Со мной ты можешь узнать о ближайших фронтенд событиях в России и мире. Назови город или дату.",
            tts: "Привет! Со мной ты можешь узнать о ближайших фронт+энд событиях в России и мире. Назови город или дату.",
            buttons: [
                {
                    title: "Ближайшие события",
                    payload: {},
                    hide: false
                },
                {
                    title: "События завтра",
                    payload: {
                        isTomorrowButton: true
                    },
                    hide: false
                },
                {
                    title: "События в Москве",
                    payload: {
                        city: 'Москва'
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
        }).join(' ') :
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

function hasDate(req) {
    return req.nlu.tokens.some(token => ['завтра', 'сегодня', 'послезавтра'].includes(token)) ||
        req.nlu.entities.some(e => e.type === 'YANDEX.DATETIME');
}

function filterByDate(events) {
    return events;
}

function filterByPlace(events, req) {
    return events.filter(event => {
        if (!event.location) return false;

        const cities = new Set();
        const geoEntities = req.nlu.entities.filter(e => e.type === 'YANDEX.GEO');
        geoEntities.forEach(e => {
            let city = e.value.city && e.value.city.toLowerCase();
            if (city && !cities.has(city)) {
                cities.add(city);
            }
        });

        return cities.has(event.location.toLowerCase()) || req.nlu.tokens.some(token => token === event.location.toLowerCase());
    });
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
