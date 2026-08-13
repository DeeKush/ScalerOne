import assert from 'node:assert/strict';
import { parseEmailIdentity, isAllowedScalerEmail, formatStudentId } from './emailIdentity.js';

assert.equal(isAllowedScalerEmail('a@sst.scaler.com'), true);
assert.equal(isAllowedScalerEmail('a@scaler.com'), true);
assert.equal(isAllowedScalerEmail('a@gmail.com'), false);

const student = parseEmailIdentity('ariyan.25bcs10115@sst.scaler.com');
assert.equal(student.accountType, 'student');
assert.equal(student.batchYear, 2025);
assert.equal(student.passOutYear, 2029);
assert.equal(student.rollNumber, '10115');
assert.equal(student.programCode, 'bcs');
assert.equal(student.domainAllowed, true);
assert.equal(formatStudentId(student), '25bcs10115');

const employee = parseEmailIdentity('alex@scaler.com');
assert.equal(employee.accountType, 'employee');
assert.equal(employee.batchYear, undefined);
assert.equal(formatStudentId(employee), 'STAFF');

const bad = parseEmailIdentity('nope@gmail.com');
assert.equal(bad.domainAllowed, false);

console.log('emailIdentity tests passed');
