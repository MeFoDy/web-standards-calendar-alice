import { Router } from 'express';
import * as httpbin from 'services/vendors/httpbin';

export const router = Router();

router.get('/', function(req, res, next) {
    httpbin
        .getRemoteIp()
        .then(vendorResponse => {
            res.json(vendorResponse.data);
        })
        .catch(next);
});
