"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
describe('metrics - Utils', () => {
    describe('getToken', () => {
        it('returns uppercase token', () => {
            expect(utils_1.getToken('foo')).toBe('OTEL_METRIC_FOO');
        });
    });
});
//# sourceMappingURL=utils.spec.js.map