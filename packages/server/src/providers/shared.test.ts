import { describe, expect, it } from 'vitest';
import { normalizePayload, redactSecrets, safeText } from './shared.ts';

describe('redactSecrets', () => {
  it.each([
    ['export API_KEY=abc123def', 'abc123def'],
    ['psql postgres://admin:hunter2@db:5432/app', 'hunter2'],
    ['curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payloadpayload.signaturesig"', 'payloadpayload'],
    ['git clone https://ghp_abcdefghijklmnopqrstuvwxyz0123@github.com/x/y', 'ghp_abcdefghijklmnopqrstuvwxyz0123'],
    ['mysql -u root --password=topsecret', 'topsecret'],
    ['OPENAI_API_KEY="sk-proj-abcdefghijklmnop"', 'sk-proj-abcdefghijklmnop'],
    ['aws configure set aws_secret_access_key wJalrXUtnFEMI', 'wJalrXUtnFEMI'],
    ['echo AKIAIOSFODNN7EXAMPLE', 'AKIAIOSFODNN7EXAMPLE'],
  ])('hides the secret in %s', (input, secret) => {
    expect(redactSecrets(input)).not.toContain(secret);
  });

  it('keeps ordinary text', () => {
    expect(redactSecrets('php artisan test --filter=AuthTest')).toBe('php artisan test --filter=AuthTest');
    expect(redactSecrets('Edit AuthController.php')).toBe('Edit AuthController.php');
  });
});

describe('safeText', () => {
  it('removes terminal escapes, bidi overrides and newlines', () => {
    expect(safeText('a\u001b[31mb\u202ec\nd', 50)).toBe('a [31mb c d');
  });
});

describe('normalizePayload', () => {
  it('rejects non-objects and wrong types', () => {
    expect(normalizePayload(null)).toBeNull();
    expect(normalizePayload('x')).toBeNull();
    expect(normalizePayload([])).toBeNull();
    expect(normalizePayload({ hook_event_name: 'Stop', session_id: 42 })).toBeNull();
  });

  it('caps field lengths and drops non-object tool_input', () => {
    const p = normalizePayload({ hook_event_name: 'Stop', session_id: 's'.repeat(500), tool_input: 'oops' })!;
    expect(p.session_id!.length).toBe(200);
    expect(p.tool_input).toBeUndefined();
  });
});
