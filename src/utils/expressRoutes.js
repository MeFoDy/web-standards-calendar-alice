import * as CliTable from 'cli-table';

export function getRoutes(app) {
    const routes = [];
    app._router.stack.forEach(get.bind(null, routes, []));
    return routes;
}

export function printRoutes(app) {
    const table = new CliTable({
        head: ['Method', 'Path'],
    });
    const routes = getRoutes(app);
    routes.forEach(route => {
        table.push([route.method, route.path]);
    });
    return table.toString();
}

function split(thing, param = null) {
    if (typeof thing === 'string') {
        return thing.split('/');
    } else if (thing.fast_slash) {
        return '';
    }

    const match = thing.toString()
        .replace('\\/?', '')
        .replace('(?=\\/|$)', '$')
        .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//);
    return match
        ? match[1].replace(/\\(.)/g, '$1').split('/')
        : `:${param || ''}`;

}

function get(paths, path, layer) {
    if (layer.route) {
        layer.route.stack.forEach(get.bind(null, paths, path.concat(split(layer.route.path))));
    } else if (layer.name === 'router' && layer.handle.stack) {
        layer.handle.stack.forEach(get.bind(null, paths, path.concat(split(layer.regexp, layer.keys.length && layer.keys[0].name))));
    } else if (layer.method) {
        paths.push({
            method: layer.method.toUpperCase(),
            path: path.concat(split(layer.regexp)).filter(Boolean).join('/'),
        });
    }
    return paths;
}
