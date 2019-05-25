String.prototype.propertyIsEnumerable = function () {
    return false;
};

import '@babel/polyfill';

// Apigee has a bug connected with this method
Object.setPrototypeOf = Object.setPrototypeOf || function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
};
