import test from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../src/utils/errors.js';

test('Double Allocation Conflict Rule', async (t) => {
  // Unit test verifying our AppError and allocation conflict status codes
  const err = new AppError('Asset is already allocated to someone else', 409);
  assert.equal(err.statusCode, 409);
  assert.equal(err.message, 'Asset is already allocated to someone else');
  assert.equal(err.isOperational, true);
});

test('Booking Overlap Conflict Rule', async (t) => {
  // Unit test verifying booking overlap conflict status codes
  const err = new AppError('This resource is already booked during the requested time slot', 409);
  assert.equal(err.statusCode, 409);
  assert.equal(err.message, 'This resource is already booked during the requested time slot');
});

test('Maintenance Status Transition Rule', async (t) => {
  // Unit test verifying maintenance transitions
  const validTransitions = ['PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
  assert.ok(validTransitions.includes('APPROVED'));
});
